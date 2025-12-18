import mongoose, { Types } from "mongoose";
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
import Product from "../products/entity";

class OrderService {
  /**
   * How long we hold inventory for an unpaid checkout.
   * Keep it short to avoid locking stock during abandonment.
   */
  private static readonly INVENTORY_RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
              quarterLength: item.measurements.quarterLength,
              ankle: item.measurements.ankle,
            }
          : undefined,
      }));

      // Reserve inventory + create order atomically.
      // This prevents overselling during the payment window.
      const reservationNow = new Date();
      const reservationExpiresAt = new Date(
        reservationNow.getTime() + OrderService.INVENTORY_RESERVATION_TTL_MS
      );

      const session = await mongoose.startSession();

      try {
        const savedOrder = (await session.withTransaction(async () => {
          await this.reserveInventoryForCartItems(
            cartCalculation.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            session
          );

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
            inventoryReservedAt: reservationNow,
            inventoryReservationExpiresAt: reservationExpiresAt,
          });

          return (await order.save({ session })) as unknown as IOrder;
        })) as unknown as IOrder | null;

        if (!savedOrder) {
          throw new Error("Failed to create order");
        }

        logger.info("Order created successfully", {
          orderId: savedOrder._id.toString(),
          orderNumber: savedOrder.orderNumber,
          userId: userId?.toString() || "guest",
          guestEmail: isGuest ? shippingAddress.email : undefined,
          total: savedOrder.total,
          itemCount: savedOrder.items.length,
          reservationExpiresAt: reservationExpiresAt.toISOString(),
        });

        // Convert to response format
        return this.mapOrderToResponse(savedOrder);
      } finally {
        session.endSession();
      }
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
        ...(paymentStatus === PaymentStatus.Cancelled && {
          orderStatus: OrderStatus.Cancelled,
          cancelledAt: new Date(),
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
   * Confirm an order is paid and (once) deduct inventory for its purchased variants.
   *
   * Why this exists:
   * - Monnify webhooks can be retried (and verify endpoint can be hit multiple times).
   * - We must NOT decrement stock more than once.
   * - Inventory deduction should be atomic per order (all items succeed, or none are deducted).
   *
   * Behavior:
   * - Always ensures the order paymentStatus is Paid and paidAt is set (idempotent).
   * - If inventoryDeductedAt is already set, no-op inventory and return current order.
   * - If inventory cannot be deducted (missing variant, insufficient quantity, invalid IDs),
   *   we keep payment as Paid but mark inventoryDeductionFailedAt/inventoryDeductionError
   *   and set orderStatus to Failed (paid-but-unfulfillable requires manual intervention/refund flow).
   */
  public async confirmPaidAndDeductInventory(
    transactionReference: string,
    paidAt?: Date
  ): Promise<IOrderResponse | null> {
    const session = await mongoose.startSession();

    try {
      let response: IOrderResponse | null = null;

      await session.withTransaction(async () => {
        const orderDoc = await Order.findOne({
          monnifyTransactionReference: transactionReference,
        }).session(session);

        if (!orderDoc) {
          logger.warn("Order not found for inventory deduction", {
            transactionReference,
          });
          response = null;
          return;
        }

        // Always reflect payment truth (idempotent)
        orderDoc.paymentStatus = PaymentStatus.Paid;
        orderDoc.orderStatus = OrderStatus.Processing;
        orderDoc.paidAt = orderDoc.paidAt || paidAt || new Date();

        const reservationWasHeld =
          Boolean((orderDoc as any).inventoryReservedAt) &&
          !Boolean((orderDoc as any).inventoryReservationReleasedAt);

        const alreadyDeducted = Boolean((orderDoc as any).inventoryDeductedAt);
        if (alreadyDeducted) {
          // Clear any previous failure markers if we already succeeded
          (orderDoc as any).inventoryDeductionFailedAt = undefined;
          (orderDoc as any).inventoryDeductionError = undefined;
          await orderDoc.save({ session });
          response = this.mapOrderToResponse(orderDoc.toObject() as any);
          return;
        }

        // Aggregate required quantities per product+variant (avoid double-counting)
        const required = new Map<string, Map<string, number>>();
        for (const item of orderDoc.items as any[]) {
          const productIdStr =
            item?.productId && typeof item.productId.toString === "function"
              ? item.productId.toString()
              : String(item?.productId || "");
          const variantIdStr = String(item?.variantId || "");
          const qty = typeof item?.quantity === "number" ? item.quantity : 0;

          if (!productIdStr || !variantIdStr || qty <= 0) {
            continue;
          }
          if (!required.has(productIdStr)) required.set(productIdStr, new Map());
          const perVariant = required.get(productIdStr)!;
          perVariant.set(variantIdStr, (perVariant.get(variantIdStr) || 0) + qty);
        }

        const productIds = Array.from(required.keys()).filter((id) =>
          Types.ObjectId.isValid(id)
        );

        const products = await Product.find({
          _id: { $in: productIds.map((id) => new Types.ObjectId(id)) },
        }).session(session);

        const productsById = new Map<string, any>();
        for (const p of products) {
          productsById.set(p._id.toString(), p);
        }

        // Validate *everything* first. If any item can't be deducted, we deduct none.
        const validationErrors: string[] = [];

        for (const [productIdStr, variantsMap] of required.entries()) {
          const product = productsById.get(productIdStr);
          if (!product) {
            validationErrors.push(`Product not found: ${productIdStr}`);
            continue;
          }

          const variantArray: any[] = Array.isArray(product.productVariant)
            ? product.productVariant
            : [];

          for (const [variantIdStr, qty] of variantsMap.entries()) {
            if (!Types.ObjectId.isValid(variantIdStr)) {
              validationErrors.push(
                `Invalid variantId "${variantIdStr}" for product ${productIdStr}`
              );
              continue;
            }

            const variant = variantArray.find(
              (v) => v?._id?.toString?.() === variantIdStr
            );
            if (!variant) {
              validationErrors.push(
                `Variant not found: product ${productIdStr}, variant ${variantIdStr}`
              );
              continue;
            }

            const currentQty =
              typeof variant.quantity === "number" && !Number.isNaN(variant.quantity)
                ? variant.quantity
                : 0;

            if (currentQty < qty) {
              validationErrors.push(
                `Insufficient stock: product ${productIdStr}, variant ${variantIdStr} (need ${qty}, have ${currentQty})`
              );
            }

            if (reservationWasHeld) {
              const reservedQty =
                typeof variant.reservedQuantity === "number" &&
                !Number.isNaN(variant.reservedQuantity) &&
                variant.reservedQuantity >= 0
                  ? variant.reservedQuantity
                  : 0;
              if (reservedQty < qty) {
                validationErrors.push(
                  `Reservation mismatch: product ${productIdStr}, variant ${variantIdStr} (need reserved ${qty}, have reserved ${reservedQty})`
                );
              }
            }
          }
        }

        if (validationErrors.length > 0) {
          const msg = validationErrors.slice(0, 10).join(" | ");

          (orderDoc as any).inventoryDeductionFailedAt = new Date();
          (orderDoc as any).inventoryDeductionError =
            validationErrors.length > 10
              ? `${msg} | (+${validationErrors.length - 10} more)`
              : msg;

          // Paid but cannot fulfill safely → flag loudly
          orderDoc.orderStatus = OrderStatus.Failed;

          logger.error("Inventory deduction failed for paid order", undefined, {
            orderId: orderDoc._id.toString(),
            orderNumber: orderDoc.orderNumber,
            transactionReference,
            errorCount: validationErrors.length,
            errors: validationErrors.slice(0, 10),
          });

          await orderDoc.save({ session });
          response = this.mapOrderToResponse(orderDoc.toObject() as any);
          return;
        }

        // Apply deductions now that validation passed
        for (const [productIdStr, variantsMap] of required.entries()) {
          const product = productsById.get(productIdStr);
          if (!product) continue;

          for (const [variantIdStr, qty] of variantsMap.entries()) {
            const variant = (product.productVariant as any[])?.find(
              (v: any) => v?._id?.toString?.() === variantIdStr
            );
            if (!variant) continue;

            // Consume reservation if it was held
            if (reservationWasHeld) {
              const currentReserved =
                typeof variant.reservedQuantity === "number" &&
                !Number.isNaN(variant.reservedQuantity) &&
                variant.reservedQuantity >= 0
                  ? variant.reservedQuantity
                  : 0;
              variant.reservedQuantity = Math.max(0, currentReserved - qty);
            }

            const currentQty =
              typeof variant.quantity === "number" && !Number.isNaN(variant.quantity)
                ? variant.quantity
                : 0;
            const nextQty = Math.max(0, currentQty - qty);
            variant.quantity = nextQty;

            const nextReserved =
              typeof variant.reservedQuantity === "number" &&
              !Number.isNaN(variant.reservedQuantity) &&
              variant.reservedQuantity >= 0
                ? variant.reservedQuantity
                : 0;
            const nextAvailable = Math.max(0, nextQty - nextReserved);

            // Keep inStock aligned with available units (prevents selling reserved units)
            variant.inStock = nextAvailable > 0;
          }
        }

        // Save all touched products
        for (const product of products) {
          await product.save({ session });
        }

        // Mark inventory deduction success
        (orderDoc as any).inventoryDeductedAt = new Date();
        // Reservation is consumed as part of deduction (if it existed)
        if (reservationWasHeld) {
          (orderDoc as any).inventoryReservationReleasedAt =
            (orderDoc as any).inventoryReservationReleasedAt || new Date();
        }
        (orderDoc as any).inventoryDeductionFailedAt = undefined;
        (orderDoc as any).inventoryDeductionError = undefined;

        await orderDoc.save({ session });

        logger.info("Inventory deducted for paid order", {
          orderId: orderDoc._id.toString(),
          orderNumber: orderDoc.orderNumber,
          transactionReference,
          productCount: required.size,
        });

        response = this.mapOrderToResponse(orderDoc.toObject() as any);
      });

      return response;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error confirming paid order / deducting inventory", err, {
        transactionReference,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    } finally {
      session.endSession();
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
              quarterLength: item.measurements.quarterLength,
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
      inventoryReservedAt: (order as any).inventoryReservedAt,
      inventoryReservationExpiresAt: (order as any).inventoryReservationExpiresAt,
      inventoryReservationReleasedAt: (order as any).inventoryReservationReleasedAt,
      inventoryDeductedAt: (order as any).inventoryDeductedAt,
      inventoryDeductionFailedAt: (order as any).inventoryDeductionFailedAt,
      inventoryDeductionError: (order as any).inventoryDeductionError,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Reserve inventory for a pending checkout.
   * This increments variant.reservedQuantity and updates variant.inStock based on availability.
   *
   * Must be called inside a transaction to be concurrency-safe.
   */
  private async reserveInventoryForCartItems(
    items: Array<{ productId: string; variantId: string; quantity: number }>,
    session: mongoose.ClientSession
  ): Promise<void> {
    const required = new Map<string, Map<string, number>>();
    for (const item of items) {
      const productId = String(item.productId || "");
      const variantId = String(item.variantId || "");
      const qty = typeof item.quantity === "number" ? item.quantity : 0;
      if (!productId || !variantId || qty <= 0) continue;
      if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(variantId)) {
        throw new Error("Invalid productId or variantId in cart items");
      }
      if (!required.has(productId)) required.set(productId, new Map());
      const perVariant = required.get(productId)!;
      perVariant.set(variantId, (perVariant.get(variantId) || 0) + qty);
    }

    const productIds = Array.from(required.keys()).map((id) => new Types.ObjectId(id));
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    const productsById = new Map<string, any>();
    for (const p of products) productsById.set(p._id.toString(), p);

    // Validate all first (no partial reserve)
    const errors: string[] = [];
    for (const [productId, variantsMap] of required.entries()) {
      const product = productsById.get(productId);
      if (!product) {
        errors.push(`Product not found: ${productId}`);
        continue;
      }
      const variantArray: any[] = Array.isArray(product.productVariant)
        ? product.productVariant
        : [];

      for (const [variantId, qty] of variantsMap.entries()) {
        const variant = variantArray.find((v) => v?._id?.toString?.() === variantId);
        if (!variant) {
          errors.push(`Variant not found: product ${productId}, variant ${variantId}`);
          continue;
        }

        const currentQty =
          typeof variant.quantity === "number" && !Number.isNaN(variant.quantity) && variant.quantity >= 0
            ? variant.quantity
            : 0;
        const currentReserved =
          typeof variant.reservedQuantity === "number" &&
          !Number.isNaN(variant.reservedQuantity) &&
          variant.reservedQuantity >= 0
            ? variant.reservedQuantity
            : 0;
        const available = Math.max(0, currentQty - currentReserved);

        if (available < qty) {
          errors.push(
            `Insufficient available stock: product ${productId}, variant ${variantId} (need ${qty}, available ${available})`
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.slice(0, 5).join(" | "));
    }

    // Apply reserves
    for (const [productId, variantsMap] of required.entries()) {
      const product = productsById.get(productId);
      if (!product) continue;
      const variantArray: any[] = Array.isArray(product.productVariant)
        ? product.productVariant
        : [];

      for (const [variantId, qty] of variantsMap.entries()) {
        const variant = variantArray.find((v) => v?._id?.toString?.() === variantId);
        if (!variant) continue;

        const currentReserved =
          typeof variant.reservedQuantity === "number" &&
          !Number.isNaN(variant.reservedQuantity) &&
          variant.reservedQuantity >= 0
            ? variant.reservedQuantity
            : 0;
        variant.reservedQuantity = currentReserved + qty;

        const currentQty =
          typeof variant.quantity === "number" && !Number.isNaN(variant.quantity) && variant.quantity >= 0
            ? variant.quantity
            : 0;
        const nextAvailable = Math.max(0, currentQty - variant.reservedQuantity);
        variant.inStock = nextAvailable > 0;
      }

      await product.save({ session });
    }
  }

  /**
   * Release inventory reservation for an unpaid order.
   * Used on expiry and on failed/cancelled payments.
   */
  public async releaseInventoryReservationByTransactionReference(
    transactionReference: string,
    reason: "expired" | "payment_failed" | "payment_cancelled"
  ): Promise<IOrderResponse | null> {
    const session = await mongoose.startSession();
    try {
      let response: IOrderResponse | null = null;
      await session.withTransaction(async () => {
        const orderDoc = await Order.findOne({
          monnifyTransactionReference: transactionReference,
        }).session(session);

        if (!orderDoc) {
          response = null;
          return;
        }

        // Never release a paid order's reservation
        if (orderDoc.paymentStatus === PaymentStatus.Paid) {
          response = this.mapOrderToResponse(orderDoc.toObject() as any);
          return;
        }

        const wasReserved = Boolean((orderDoc as any).inventoryReservedAt);
        const alreadyReleased = Boolean((orderDoc as any).inventoryReservationReleasedAt);

        if (!wasReserved || alreadyReleased) {
          if (reason === "expired") {
            orderDoc.orderStatus = OrderStatus.Cancelled;
            orderDoc.cancelledAt = orderDoc.cancelledAt || new Date();
            orderDoc.cancellationReason =
              orderDoc.cancellationReason || "Reservation expired";
            await orderDoc.save({ session });
          }
          response = this.mapOrderToResponse(orderDoc.toObject() as any);
          return;
        }

        // Build required quantities from order items
        const required = new Map<string, Map<string, number>>();
        for (const item of orderDoc.items as any[]) {
          const productIdStr = item?.productId?.toString?.() || "";
          const variantIdStr = String(item?.variantId || "");
          const qty = typeof item?.quantity === "number" ? item.quantity : 0;
          if (!productIdStr || !variantIdStr || qty <= 0) continue;
          if (!required.has(productIdStr)) required.set(productIdStr, new Map());
          const perVariant = required.get(productIdStr)!;
          perVariant.set(variantIdStr, (perVariant.get(variantIdStr) || 0) + qty);
        }

        const productIds = Array.from(required.keys())
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));

        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        const productsById = new Map<string, any>();
        for (const p of products) productsById.set(p._id.toString(), p);

        for (const [productIdStr, variantsMap] of required.entries()) {
          const product = productsById.get(productIdStr);
          if (!product) continue;

          for (const [variantIdStr, qty] of variantsMap.entries()) {
            const variant = (product.productVariant as any[])?.find(
              (v: any) => v?._id?.toString?.() === variantIdStr
            );
            if (!variant) continue;

            const currentReserved =
              typeof variant.reservedQuantity === "number" &&
              !Number.isNaN(variant.reservedQuantity) &&
              variant.reservedQuantity >= 0
                ? variant.reservedQuantity
                : 0;
            variant.reservedQuantity = Math.max(0, currentReserved - qty);

            const currentQty =
              typeof variant.quantity === "number" && !Number.isNaN(variant.quantity) && variant.quantity >= 0
                ? variant.quantity
                : 0;
            const nextAvailable = Math.max(0, currentQty - variant.reservedQuantity);
            variant.inStock = nextAvailable > 0;
          }

          await product.save({ session });
        }

        (orderDoc as any).inventoryReservationReleasedAt = new Date();

        if (reason === "expired") {
          orderDoc.orderStatus = OrderStatus.Cancelled;
          orderDoc.cancelledAt = orderDoc.cancelledAt || new Date();
          orderDoc.cancellationReason =
            orderDoc.cancellationReason || "Reservation expired";
        }

        await orderDoc.save({ session });
        response = this.mapOrderToResponse(orderDoc.toObject() as any);
      });

      return response;
    } finally {
      session.endSession();
    }
  }

  /**
   * Opportunistic cleanup: release reservations that have expired.
   * (Useful in serverless environments without background workers.)
   */
  public async releaseExpiredInventoryReservations(limit: number = 25): Promise<{
    scanned: number;
    released: number;
  }> {
    const now = new Date();

    const expired = await Order.find({
      paymentStatus: PaymentStatus.Pending,
      inventoryReservedAt: { $exists: true, $ne: null },
      inventoryReservationExpiresAt: { $lt: now },
      $or: [
        { inventoryReservationReleasedAt: { $exists: false } },
        { inventoryReservationReleasedAt: null },
      ],
    })
      .select("_id monnifyTransactionReference")
      .limit(limit)
      .lean();

    let released = 0;
    for (const o of expired) {
      const txRef = (o as any).monnifyTransactionReference;
      if (!txRef) continue;
      try {
        await this.releaseInventoryReservationByTransactionReference(txRef, "expired");
        released += 1;
      } catch (error) {
        logger.warn("Failed to release expired reservation", {
          orderId: (o as any)._id?.toString?.(),
          transactionReference: txRef,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { scanned: expired.length, released };
  }
}

export const orderService = new OrderService();
