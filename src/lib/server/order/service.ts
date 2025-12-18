import { Types } from "mongoose";
import Order from "./entity";
import {
  IOrder,
  OrderStatus,
  PaymentStatus,
} from "./interface";
import { IOrderUserInput, IOrderResponse } from "./interface";
import { cartService } from "../cart/service";
import { ICartUserInput } from "../cart/interface";
import { logger } from "../utils/logger";
import { utils } from "../utils";
import { userService } from "../user/service";
import { hashPassCode } from "../utils/auth";

class OrderService {
  /**
   * Generate unique order number
   * Format: ORD-YYYYMMDD-XXXXXX (where XXXXXX is random alphanumeric)
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${year}${month}${day}-${randomPart}`;
  }


  /**
   * Create a new order
   * Supports both authenticated users and guest users
   */
  public async createOrder(
    userId: Types.ObjectId | null,
    body: IOrderUserInput
  ): Promise<IOrderResponse> {
    try {
      // For authenticated users, always fetch user details from database
      // This ensures we use the most up-to-date information and is more secure
      let shippingAddress: IOrderUserInput["shippingAddress"] | undefined;
      
      if (userId) {
        // Authenticated user: fetch from database
        const user = await userService.getUserById(userId);
        
        if (!user) {
          logger.error("User not found in database", undefined, {
            userId: userId.toString(),
          });
          throw new Error("User account not found. Please sign in again.");
        }

        // Build shipping address from user account data
        shippingAddress = {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          address: user.street || "",
          city: user.city || "",
          state: user.state || "",
          zipCode: user.zipCode || "",
          country: user.country || "Nigeria",
        };

        // Validate that user has complete address information
        if (
          !shippingAddress.firstName ||
          !shippingAddress.lastName ||
          !shippingAddress.email ||
          !shippingAddress.phone ||
          !shippingAddress.address ||
          !shippingAddress.city ||
          !shippingAddress.state ||
          !shippingAddress.zipCode ||
          !shippingAddress.country
        ) {
          logger.warn("Incomplete user address in database", {
            userId: userId.toString(),
            hasFirstName: !!shippingAddress.firstName,
            hasLastName: !!shippingAddress.lastName,
            hasEmail: !!shippingAddress.email,
            hasPhone: !!shippingAddress.phone,
            hasAddress: !!shippingAddress.address,
            hasCity: !!shippingAddress.city,
            hasState: !!shippingAddress.state,
            hasZipCode: !!shippingAddress.zipCode,
            hasCountry: !!shippingAddress.country,
          });
          throw new Error(
            "Complete shipping address is required. Please update your address in your account settings."
          );
        }

        logger.info("Fetched user details from database for order", {
          userId: userId.toString(),
          email: shippingAddress.email,
        });
      } else {
        // Guest user: use address from request body
        shippingAddress = body.shippingAddress;

        // Validate that shipping address is provided for guest users
        if (!shippingAddress) {
          throw new Error("Shipping address is required for guest checkout");
        }

        // Validate required address fields for guest users
        if (
          !shippingAddress.firstName ||
          !shippingAddress.lastName ||
          !shippingAddress.email ||
          !shippingAddress.phone ||
          !shippingAddress.address ||
          !shippingAddress.city ||
          !shippingAddress.state ||
          !shippingAddress.zipCode ||
          !shippingAddress.country
        ) {
          throw new Error("Complete shipping address is required");
        }
      }

      // Use string ObjectIds directly (cart service now expects strings, not hashed numbers)
      const cartItems: ICartUserInput[] = body.items.map((item) => ({
        productId: item.productId, // Already a string ObjectId
        variantId: item.variantId, // Already a string ObjectId
        quantity: item.quantity,
      }));

      // Always fetch shipping settings to check free shipping threshold
      let freeShippingThreshold: number | undefined;
      let locationFees: Array<{ location: string; fee: number }> | undefined;
      
      try {
        const { shippingSettingsService } = await import("../shippingSettings/service");
        const shippingSettings = await shippingSettingsService.getSettings();
        freeShippingThreshold = shippingSettings.freeShippingThreshold;
        // Only fetch location fees if shipping location is provided
        if (body.shippingLocation) {
          locationFees = shippingSettings.locationFees;
        }
      } catch (error) {
        logger.warn("Failed to fetch shipping settings for order calculation", {
          shippingLocation: body.shippingLocation,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Calculate cart totals using cart service with shipping location
      const cartCalculation = await cartService.calculateCart(
        cartItems,
        body.shippingLocation,
        freeShippingThreshold,
        locationFees
      );

      if (!cartCalculation || cartCalculation.items.length === 0) {
        throw new Error("Invalid cart items or cart is empty");
      }

      // Validate that all items are in stock and quantities are available
      for (const item of cartCalculation.items) {
        if (!item.inStock) {
          throw new Error(`Product "${item.productName}" is out of stock`);
        }
        if (item.quantity > item.availableQuantity) {
          throw new Error(
            `Only ${item.availableQuantity} units available for "${item.productName}"`
          );
        }
      }

      // Determine if this is a guest order (before account creation)
      let isGuest = !userId;

      // Handle account creation for guest users
      if (isGuest && body.createAccount && body.password) {
        // Check if user with this email already exists
        const existingUser = await userService.findUserByEmail(
          shippingAddress.email
        );

        if (existingUser) {
          throw new Error("An account with this email already exists");
        }

        // Create new user account
        const hashedPassword = (await hashPassCode(body.password)) as string;
        const newUser = await userService.createUser({
          email: shippingAddress.email,
          password: hashedPassword,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phoneNumber: shippingAddress.phone,
        });

        // Update user address after account creation
        if (newUser._id) {
          await userService.updateAddress(newUser._id as Types.ObjectId, {
            street: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country,
          });
        }

        // Use the newly created user ID
        userId = newUser._id as Types.ObjectId;
        
        // Update isGuest flag since account was created
        isGuest = false;
      }

      // Prepare billing address
      // For authenticated users, billing address is same as shipping (from account)
      // For guest users, use billingAddress from request or default to shipping
      const billingAddress = userId
        ? shippingAddress // Authenticated users: billing same as shipping (from account)
        : body.sameAsShipping
        ? shippingAddress
        : body.billingAddress || shippingAddress;

      // Generate unique order number
      let orderNumber = this.generateOrderNumber();
      let orderNumberExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure order number is unique (handle rare collisions)
      while (orderNumberExists && attempts < maxAttempts) {
        const existingOrder = await Order.findOne({ orderNumber }).lean();
        if (!existingOrder) {
          orderNumberExists = false;
        } else {
          orderNumber = this.generateOrderNumber();
          attempts++;
        }
      }

      if (orderNumberExists) {
        throw new Error("Failed to generate unique order number");
      }

      // Map cart items to order items, including variant measurements
      const orderItems = cartCalculation.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        variantId: item.variantId,
        productName: item.productName,
        productSlug: item.productSlug,
        variantImageUrls: Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
          ? item.variantImageUrls
          : (((item as any).variantImageUrl as string | undefined) ? [((item as any).variantImageUrl as string)] : []), // Backward compatibility fallback
        variantColor: item.variantColor,
        variantSize: item.variantSize,
        variantPrice: item.variantPrice,
        variantDiscountPrice: item.variantDiscountPrice,
        quantity: item.quantity,
        itemSubtotal: item.itemSubtotal,
        itemTotal: item.itemTotal,
        measurements: item.measurements
          ? {
              neck: item.measurements.neck,
              shoulder: item.measurements.shoulder,
              chest: item.measurements.chest,
              shortSleeve: item.measurements.shortSleeve,
              longSleeve: item.measurements.longSleeve,
              roundSleeve: item.measurements.roundSleeve,
              tummy: item.measurements.tummy,
              topLength: item.measurements.topLength,
              waist: item.measurements.waist,
              laps: item.measurements.laps,
              kneelLength: item.measurements.kneelLength,
              roundKneel: item.measurements.roundKneel,
              trouserLength: item.measurements.trouserLength,
              ankle: item.measurements.ankle,
            }
          : undefined,
      }));

      // Create order document
      const order = new Order({
        orderNumber,
        userId: userId || null,
        isGuest,
        guestEmail: isGuest ? shippingAddress.email : undefined,
        items: orderItems,
        shippingAddress: shippingAddress,
        billingAddress,
        subtotal: cartCalculation.subtotal,
        shipping: cartCalculation.shipping,
        tax: cartCalculation.tax,
        total: cartCalculation.total,
        shippingLocation: body.shippingLocation,
        orderStatus: OrderStatus.OrderPlaced,
        paymentStatus: PaymentStatus.Pending,
        paymentMethod: "monnify",
      });

      const savedOrder = await order.save();

      logger.info("Order created successfully", {
        orderId: savedOrder._id.toString(),
        orderNumber: savedOrder.orderNumber,
        userId: userId?.toString() || "guest",
        guestEmail: isGuest ? shippingAddress.email : undefined,
        total: savedOrder.total,
        itemCount: savedOrder.items.length,
      });

      // Convert to response format
      return this.mapOrderToResponse(savedOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating order", err, {
        userId: userId?.toString() || "guest",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Update order payment information
   */
  public async updateOrderPayment(
    orderId: Types.ObjectId,
    paymentData: {
      monnifyTransactionReference?: string;
      monnifyPaymentReference?: string;
      paymentUrl?: string;
      paymentReference?: string;
    }
  ): Promise<IOrderResponse | null> {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            ...(paymentData.monnifyTransactionReference && {
              monnifyTransactionReference: paymentData.monnifyTransactionReference,
            }),
            ...(paymentData.monnifyPaymentReference && {
              monnifyPaymentReference: paymentData.monnifyPaymentReference,
            }),
            ...(paymentData.paymentUrl && { paymentUrl: paymentData.paymentUrl }),
            ...(paymentData.paymentReference && {
              paymentReference: paymentData.paymentReference,
            }),
          },
        },
        { new: true }
      ).lean();

      if (!order) {
        return null;
      }

      return this.mapOrderToResponse(order as IOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating order payment", err, {
        orderId: orderId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Update order payment status (called by webhook)
   */
  public async updateOrderPaymentStatus(
    transactionReference: string,
    paymentStatus: PaymentStatus,
    paidAt?: Date
  ): Promise<IOrderResponse | null> {
    try {
      const updateData: any = {
        paymentStatus,
        ...(paidAt && { paidAt }),
        ...(paymentStatus === PaymentStatus.Paid && {
          orderStatus: OrderStatus.Processing,
        }),
        ...(paymentStatus === PaymentStatus.Failed && {
          orderStatus: OrderStatus.Failed,
        }),
      };

      const order = await Order.findOneAndUpdate(
        { monnifyTransactionReference: transactionReference },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!order) {
        logger.warn("Order not found for transaction reference", {
          transactionReference,
        });
        return null;
      }

      logger.info("Order payment status updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        transactionReference,
        paymentStatus,
      });

      return this.mapOrderToResponse(order as IOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating order payment status", err, {
        transactionReference,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Find order by transaction reference
   */
  public async findOrderByTransactionReference(
    transactionReference: string
  ): Promise<IOrder | null> {
    try {
      const order = await Order.findOne({
        monnifyTransactionReference: transactionReference,
      }).lean();

      return order as IOrder | null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding order by transaction reference", err, {
        transactionReference,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Find order by payment reference
   */
  public async findOrderByPaymentReference(
    paymentReference: string
  ): Promise<IOrder | null> {
    try {
      const order = await Order.findOne({
        monnifyPaymentReference: paymentReference,
      }).lean();

      return order as IOrder | null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding order by payment reference", err, {
        paymentReference,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Find order by order number and return ObjectId
   */
  public async findOrderByOrderNumber(
    orderNumber: string
  ): Promise<Types.ObjectId | null> {
    try {
      const order = await Order.findOne({
        orderNumber: orderNumber,
      })
        .select("_id")
        .lean();

      return order ? (order._id as Types.ObjectId) : null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding order by order number", err, {
        orderNumber,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Find order by ID
   */
  public async findOrderById(orderId: Types.ObjectId): Promise<IOrder | null> {
    try {
      const order = await Order.findById(orderId).lean();
      return order as IOrder | null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding order by ID", err, {
        orderId: orderId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Fetch all orders with pagination and filters (for admin)
   */
  public async getAllOrders(
    page: number = 1,
    limit: number = 10,
    filters?: {
      searchTerm?: string;
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      isGuest?: boolean;
    }
  ) {
    try {
      const skip = (page - 1) * limit;

      // Build query filter
      const queryFilter: any = {};

      // Search filter - search in orderNumber, customer email, customer name
      if (filters?.searchTerm && filters.searchTerm.trim()) {
        const searchRegex = new RegExp(filters.searchTerm.trim(), "i");
        queryFilter.$or = [
          { orderNumber: searchRegex },
          { guestEmail: searchRegex },
          { "shippingAddress.email": searchRegex },
          { "shippingAddress.firstName": searchRegex },
          { "shippingAddress.lastName": searchRegex },
        ];
      }

      // Order status filter
      if (filters?.orderStatus) {
        queryFilter.orderStatus = filters.orderStatus;
      }

      // Payment status filter
      if (filters?.paymentStatus) {
        queryFilter.paymentStatus = filters.paymentStatus;
      }

      // Guest filter
      if (filters?.isGuest !== undefined) {
        queryFilter.isGuest = filters.isGuest;
      }

      // Execute query with filters and sorting
      const orders = await Order.find(queryFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }) // Most recent first
        .lean();

      const total = await Order.countDocuments(queryFilter);

      // Map orders to response format
      const mappedOrders = orders.map((order: any) =>
        this.mapOrderToResponse(order as IOrder)
      );

      return {
        orders: mappedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching all orders", err, {
        page,
        limit,
        filters,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Fetch orders for a specific user with pagination
   */
  public async getUserOrders(
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const skip = (page - 1) * limit;

      // Build query filter - only get orders for this user
      const queryFilter: any = {
        userId: userId,
        isGuest: false,
      };

      // Execute query with sorting (most recent first)
      const orders = await Order.find(queryFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Order.countDocuments(queryFilter);

      // Map orders to response format
      const mappedOrders = orders.map((order: any) =>
        this.mapOrderToResponse(order as IOrder)
      );

      return {
        orders: mappedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching user orders", err, {
        userId: userId.toString(),
        page,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Update order status (for admin)
   */
  public async updateOrderStatus(
    orderId: Types.ObjectId,
    orderStatus: OrderStatus
  ): Promise<IOrderResponse | null> {
    try {
      const updateData: any = {
        orderStatus,
        ...(orderStatus === OrderStatus.Shipped && { shippedAt: new Date() }),
        ...(orderStatus === OrderStatus.OutForDelivery && { shippedAt: new Date() }),
        ...(orderStatus === OrderStatus.Delivered && { deliveredAt: new Date() }),
        ...(orderStatus === OrderStatus.Cancelled && { cancelledAt: new Date() }),
      };

      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true }
      ).lean();

      if (!order) {
        logger.warn("Order not found for status update", {
          orderId: orderId.toString(),
        });
        return null;
      }

      logger.info("Order status updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        orderStatus,
      });

      return this.mapOrderToResponse(order as IOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating order status", err, {
        orderId: orderId.toString(),
        orderStatus,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Map order document to response format
   */
  public mapOrderToResponse(order: IOrder): IOrderResponse {
    return {
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: order.userId?.toString(),
      isGuest: order.isGuest,
      guestEmail: order.guestEmail,
      items: order.items.map((item: any) => ({
        productId: item.productId.toString(),
        variantId: item.variantId,
        productName: item.productName,
        productSlug: item.productSlug,
        variantImageUrls: Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
          ? item.variantImageUrls
          : (item.variantImageUrl ? [item.variantImageUrl] : []), // Backward compatibility fallback
        variantColor: item.variantColor,
        variantSize: item.variantSize,
        variantPrice: item.variantPrice,
        variantDiscountPrice: item.variantDiscountPrice,
        quantity: item.quantity,
        itemSubtotal: item.itemSubtotal,
        itemTotal: item.itemTotal,
        measurements: item.measurements
          ? {
              neck: item.measurements.neck,
              shoulder: item.measurements.shoulder,
              chest: item.measurements.chest,
              shortSleeve: item.measurements.shortSleeve,
              longSleeve: item.measurements.longSleeve,
              roundSleeve: item.measurements.roundSleeve,
              tummy: item.measurements.tummy,
              topLength: item.measurements.topLength,
              waist: item.measurements.waist,
              laps: item.measurements.laps,
              kneelLength: item.measurements.kneelLength,
              roundKneel: item.measurements.roundKneel,
              trouserLength: item.measurements.trouserLength,
              ankle: item.measurements.ankle,
            }
          : undefined,
      })),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shippingLocation: order.shippingLocation,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      monnifyTransactionReference: order.monnifyTransactionReference,
      monnifyPaymentReference: order.monnifyPaymentReference,
      paymentUrl: order.paymentUrl,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

export const orderService = new OrderService();
