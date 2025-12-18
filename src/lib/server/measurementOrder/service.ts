import { Types } from "mongoose";
import MeasurementOrder from "./entity";
import {
  IMeasurementOrder,
  MeasurementOrderStatus,
  IMeasurementOrderUserInput,
  IMeasurementOrderResponse,
  PaymentStatus,
} from "./interface";
import { logger } from "../utils/logger";
import { userService } from "../user/service";
import { measurementTemplateService } from "../measurementTemplates/service";
import { hashPassCode } from "../utils/auth";

class MeasurementOrderService {
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MSO-${year}${month}${day}-${randomPart}`;
  }

  public async createMeasurementOrder(
    userId: Types.ObjectId | null,
    body: IMeasurementOrderUserInput
  ): Promise<IMeasurementOrderResponse> {
    try {
      let personalInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };

      if (userId) {
        const user = await userService.getUserById(userId);
        if (!user) {
          logger.error("User not found in database", undefined, {
            userId: userId.toString(),
          });
          throw new Error("User account not found. Please sign in again.");
        }
        personalInfo = {
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          address: user.street || "",
          city: user.city || "",
          state: user.state || "",
          zipCode: user.zipCode || "",
          country: user.country || "Nigeria",
        };
        if (
          !personalInfo.name ||
          !personalInfo.email ||
          !personalInfo.phone ||
          !personalInfo.address ||
          !personalInfo.city ||
          !personalInfo.state ||
          !personalInfo.zipCode ||
          !personalInfo.country
        ) {
          throw new Error(
            "Complete personal information is required. Please update your details in your account settings."
          );
        }
      } else {
        // For guest users, use firstName/lastName if provided, otherwise fall back to name
        const firstName = body.firstName || (body.name ? body.name.split(' ')[0] : '');
        const lastName = body.lastName || (body.name ? body.name.split(' ').slice(1).join(' ') : '');
        const fullName = body.firstName && body.lastName 
          ? `${body.firstName} ${body.lastName}`.trim()
          : (body.name || `${firstName} ${lastName}`.trim());
        
        // Validate that required fields are provided for guest users
        if (!firstName || !lastName || !body.email || !body.phone || !body.address || !body.city || !body.state || !body.zipCode || !body.country) {
          throw new Error("All personal information fields are required for guest users");
        }
        
        personalInfo = {
          name: fullName,
          email: body.email,
          phone: body.phone,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          country: body.country,
        };

        // Handle account creation for guest users
        if (body.createAccount && body.password) {
          // Check if user with this email already exists
          const existingUser = await userService.findUserByEmail(body.email);

          if (existingUser) {
            throw new Error("An account with this email already exists");
          }

          // Create new user account
          const hashedPassword = (await hashPassCode(body.password)) as string;
          const newUser = await userService.createUser({
            email: body.email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: body.phone,
          });

          // Update user address after account creation
          if (newUser._id) {
            await userService.updateAddress(newUser._id as Types.ObjectId, {
              street: body.address,
              city: body.city,
              state: body.state,
              zipCode: body.zipCode,
              country: body.country,
            });
          }

          // Use the newly created user ID
          userId = newUser._id as Types.ObjectId;
        }
      }

      // Validate and process all templates
      if (!body.templates || body.templates.length === 0) {
        throw new Error("At least one measurement template is required");
      }

      // Shipping location is always required for measurement orders
      if (!body.shippingLocation || String(body.shippingLocation).trim() === "") {
        throw new Error("Shipping location is required");
      }

      const processedTemplates = await Promise.all(
        body.templates.map(async (templateInput) => {
          // Validate template input
          if (!templateInput.templateId) {
            throw new Error("Template ID is required for each template");
          }

          if (!templateInput.measurements || Object.keys(templateInput.measurements).length === 0) {
            throw new Error("Measurements are required for each template");
          }

          const templateId = new Types.ObjectId(templateInput.templateId);
          const foundTemplate = await measurementTemplateService.getTemplateByIdPublic(templateId);
          
          if (!foundTemplate) {
            throw new Error(`Measurement template with ID ${templateInput.templateId} not found`);
          }

          if (!foundTemplate._id) {
            throw new Error(`Template ID is missing for template "${foundTemplate.title || 'unknown'}"`);
          }

          if (!foundTemplate.title || String(foundTemplate.title).trim() === '') {
            throw new Error(`Template title is missing for template ID ${templateInput.templateId}`);
          }

          // Convert measurements to plain objects with proper types
          const measurements = Object.entries(templateInput.measurements)
            .filter(([_, value]) => {
              const numValue = Number(value);
              return value !== null && value !== undefined && !isNaN(numValue) && numValue > 0;
            })
            .map(([fieldName, value]) => {
              const numValue = Number(value);
              return {
                fieldName: String(fieldName).trim(),
                value: numValue,
              };
            });

          // Validate that measurements array is not empty
          if (measurements.length === 0) {
            throw new Error(`At least one valid measurement is required for template "${foundTemplate.title}"`);
          }

          // Validate that all required fields are present
          const templateFieldNames = foundTemplate.fields.map((f) => f.name);
          const measurementFieldNames = measurements.map((m) => m.fieldName);
          for (const fieldName of templateFieldNames) {
            if (!measurementFieldNames.includes(fieldName)) {
              throw new Error(`Measurement for "${fieldName}" is required for template "${foundTemplate.title}"`);
            }
          }

          // Ensure templateId is a proper ObjectId
          // When using .lean(), _id is returned as a plain object or string
          let templateObjectId: Types.ObjectId;
          if (foundTemplate._id instanceof Types.ObjectId) {
            templateObjectId = foundTemplate._id;
          } else if (typeof foundTemplate._id === 'string') {
            templateObjectId = new Types.ObjectId(foundTemplate._id);
          } else if (foundTemplate._id && typeof foundTemplate._id === 'object' && 'toString' in foundTemplate._id) {
            // Handle plain object from .lean()
            templateObjectId = new Types.ObjectId(String(foundTemplate._id));
          } else {
            throw new Error(`Invalid template ID format for template "${foundTemplate.title}"`);
          }
          
          // Validate ObjectId is valid
          if (!Types.ObjectId.isValid(templateObjectId)) {
            throw new Error(`Invalid ObjectId for template "${foundTemplate.title}"`);
          }

          const templateTitle = String(foundTemplate.title).trim();
          const quantity = Number(templateInput.quantity) || 1;
          const sampleImageUrls = Array.isArray(templateInput.sampleImageUrls) ? templateInput.sampleImageUrls : [];

          // Final validation before returning
          if (!templateObjectId) {
            throw new Error(`Invalid template ID for template "${templateTitle}"`);
          }
          if (!templateTitle || templateTitle === '') {
            throw new Error(`Invalid template title for template ID ${templateInput.templateId}`);
          }
          if (!measurements || measurements.length === 0) {
            throw new Error(`No valid measurements for template "${templateTitle}"`);
          }

          // Create plain object (not Mongoose document) to ensure proper serialization
          const processedTemplate = {
            templateId: templateObjectId,
            templateTitle: templateTitle,
            quantity: quantity,
            measurements: measurements.map(m => ({
              fieldName: String(m.fieldName),
              value: Number(m.value),
            })),
            sampleImageUrls: sampleImageUrls.map(url => String(url)),
          };

          // Validate the structure before returning
          if (!processedTemplate.templateId) {
            throw new Error(`Template ID is missing in processed template for "${templateTitle}"`);
          }
          if (!processedTemplate.templateTitle || processedTemplate.templateTitle.trim() === '') {
            throw new Error(`Template title is missing in processed template`);
          }
          if (!processedTemplate.measurements || processedTemplate.measurements.length === 0) {
            throw new Error(`Measurements array is empty for template "${templateTitle}"`);
          }

          logger.info("Processed template for order", {
            templateId: templateObjectId.toString(),
            templateTitle: templateTitle,
            quantity: quantity,
            measurementCount: measurements.length,
            measurements: processedTemplate.measurements,
            imageCount: sampleImageUrls.length,
          });

          return processedTemplate;
        })
      );

      // Validate processed templates array
      if (!processedTemplates || processedTemplates.length === 0) {
        throw new Error("No valid templates were processed");
      }

      // Validate each processed template has all required fields
      for (const template of processedTemplates) {
        if (!template.templateId) {
          throw new Error("Processed template is missing templateId");
        }
        if (!template.templateTitle || template.templateTitle.trim() === '') {
          throw new Error("Processed template is missing templateTitle");
        }
        if (!template.measurements || template.measurements.length === 0) {
          throw new Error(`Processed template "${template.templateTitle}" is missing measurements`);
        }
      }

      const orderNumber = this.generateOrderNumber();
      
      // Log the data being saved for debugging - log the actual structure
      logger.info("Creating measurement order", {
        orderNumber,
        userId: userId?.toString() || "guest",
        templateCount: processedTemplates.length,
        templates: processedTemplates.map(t => ({
          templateId: t.templateId.toString(),
          templateTitle: t.templateTitle,
          quantity: t.quantity,
          measurementCount: t.measurements.length,
          measurements: t.measurements,
        })),
      });

      // Ensure processedTemplates is in the exact format Mongoose expects
      // Create plain objects that match the schema exactly
      const templatesForSave = processedTemplates.map((template, index) => {
        // Ensure templateId is a proper ObjectId
        let templateId: Types.ObjectId;
        if (template.templateId instanceof Types.ObjectId) {
          templateId = template.templateId;
        } else {
          templateId = new Types.ObjectId(String(template.templateId));
        }
        
        // Ensure measurements array is properly formatted
        const measurements = Array.isArray(template.measurements) && template.measurements.length > 0
          ? template.measurements.map(m => ({
              fieldName: String(m.fieldName || '').trim(),
              value: Number(m.value) || 0,
            })).filter(m => m.fieldName && m.value > 0)
          : [];
        
        if (measurements.length === 0) {
          throw new Error(`Template at index ${index} has no valid measurements`);
        }
        
        const templateTitle = String(template.templateTitle || '').trim();
        if (!templateTitle) {
          throw new Error(`Template at index ${index} has no title`);
        }
        
        const quantity = Number(template.quantity) || 1;
        const sampleImageUrls = Array.isArray(template.sampleImageUrls) 
          ? template.sampleImageUrls.map(url => String(url)).filter(url => url) 
          : [];
        
        const templateObj = {
          templateId: templateId,
          templateTitle: templateTitle,
          quantity: quantity,
          measurements: measurements,
          sampleImageUrls: sampleImageUrls,
        };
        
        // Validate the object structure
        if (!templateObj.templateId || !templateObj.templateTitle || !templateObj.measurements || templateObj.measurements.length === 0) {
          throw new Error(`Invalid template structure at index ${index}: ${JSON.stringify(templateObj)}`);
        }
        
        return templateObj;
      });

      // Log the final structure being passed to Mongoose for debugging
      logger.info("Creating measurement order with templates", {
        orderNumber,
        userId: userId?.toString() || "guest",
        templateCount: templatesForSave.length,
        firstTemplate: templatesForSave[0] ? {
          templateId: templatesForSave[0].templateId.toString(),
          templateTitle: templatesForSave[0].templateTitle,
          quantity: templatesForSave[0].quantity,
          measurementCount: templatesForSave[0].measurements.length,
        } : null,
      });

      // Calculate tax and delivery fee based on shipping location
      let tax: number | undefined;
      let deliveryFee: number | undefined;
      
      try {
        const { shippingSettingsService } = await import("../shippingSettings/service");
        const shippingSettings = await shippingSettingsService.getSettings();
        
        // Find delivery fee for the selected location
        const locationFee = shippingSettings.locationFees.find(
          (lf) => lf.location === body.shippingLocation
        );
        if (locationFee) {
          deliveryFee = locationFee.fee;
        }
        
        // Tax will be calculated when price is set (7.5% VAT rate for Nigeria)
        // For now, we'll set it to null and calculate it when price is set
      } catch (error) {
        logger.warn("Failed to fetch shipping settings for measurement order", {
          shippingLocation: body.shippingLocation,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Create the document with all data including templates
      // Following the same pattern as Order service for consistency and reliability
      const measurementOrder = new MeasurementOrder({
        orderNumber,
        userId: userId || undefined,
        isGuest: !userId,
        guestEmail: !userId ? body.email : undefined,
        ...personalInfo,
        templates: templatesForSave,
        notes: body.notes,
        preferredStyle: body.preferredStyle,
        shippingLocation: body.shippingLocation,
        tax: tax || undefined,
        deliveryFee: deliveryFee || undefined,
        status: MeasurementOrderStatus.OrderReceived,
      });

      // Save the document - Mongoose will validate automatically
      // If validation fails, the error will be caught and logged
      const savedOrder = await measurementOrder.save();
      logger.info("Measurement order created successfully", {
        orderId: savedOrder._id.toString(),
        orderNumber: savedOrder.orderNumber,
        userId: userId?.toString() || "guest",
        email: savedOrder.email,
        templateCount: savedOrder.templates.length,
      });

      return this.mapOrderToResponse(savedOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating measurement order", err, {
        userId: userId?.toString() || "guest",
        templateCount: body.templates?.length || 0,
        templateIds: body.templates?.map(t => t.templateId) || [],
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Fetch all measurement orders with pagination and filters (for admin)
   */
  public async getAllOrders(
    page: number = 1,
    limit: number = 10,
    filters?: {
      searchTerm?: string;
      status?: MeasurementOrderStatus;
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
          { email: searchRegex },
          { name: searchRegex },
        ];
      }

      // Status filter
      if (filters?.status) {
        queryFilter.status = filters.status;
      }

      // Guest filter
      if (filters?.isGuest !== undefined) {
        queryFilter.isGuest = filters.isGuest;
      }

      // Execute query with filters and sorting
      const orders = await MeasurementOrder.find(queryFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }) // Most recent first
        .lean();

      const total = await MeasurementOrder.countDocuments(queryFilter);

      // Map orders to response format
      const mappedOrders = orders.map((order: any) =>
        this.mapOrderToResponse(order as IMeasurementOrder)
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
      logger.error("Error fetching all measurement orders", err, {
        page,
        limit,
        filters,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  public mapOrderToResponse(order: IMeasurementOrder): IMeasurementOrderResponse {
    return {
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: order.userId?.toString(),
      isGuest: order.isGuest,
      guestEmail: order.guestEmail,
      name: order.name,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      zipCode: order.zipCode,
      country: order.country,
      templates: order.templates.map((template) => ({
        templateId: template.templateId.toString(),
        templateTitle: template.templateTitle,
        quantity: template.quantity,
        measurements: template.measurements,
        sampleImageUrls: template.sampleImageUrls || [],
      })),
      notes: order.notes,
      preferredStyle: order.preferredStyle,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      monnifyTransactionReference: order.monnifyTransactionReference,
      monnifyPaymentReference: order.monnifyPaymentReference,
      paymentUrl: order.paymentUrl,
      price: order.price,
      priceSetAt: order.priceSetAt,
      priceSetBy: order.priceSetBy?.toString(),
      shippingLocation: order.shippingLocation,
      tax: order.tax,
      deliveryFee: order.deliveryFee,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      isReplaced: order.isReplaced ?? false,
      replacedByOrderId: order.replacedByOrderId
        ? order.replacedByOrderId.toString()
        : undefined,
      originalOrderId: order.originalOrderId
        ? order.originalOrderId.toString()
        : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Update measurement order status (for admin)
   */
  public async updateMeasurementOrderStatus(
    orderId: Types.ObjectId,
    status: MeasurementOrderStatus
  ): Promise<IMeasurementOrderResponse | null> {
    try {
      const updateData: any = {
        status,
      };

      const order = await MeasurementOrder.findByIdAndUpdate(
        orderId,
        { $set: updateData },
        { new: true }
      ).lean();

      if (!order) {
        logger.warn("Measurement order not found for status update", {
          orderId: orderId.toString(),
        });
        return null;
      }

      logger.info("Measurement order status updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status,
      });

      return this.mapOrderToResponse(order as IMeasurementOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating measurement order status", err, {
        orderId: orderId.toString(),
        status,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Fetch measurement orders for a specific user with pagination
   */
  public async getUserMeasurementOrders(
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
      const orders = await MeasurementOrder.find(queryFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await MeasurementOrder.countDocuments(queryFilter);

      // Map orders to response format
      const mappedOrders = orders.map((order: any) =>
        this.mapOrderToResponse(order as IMeasurementOrder)
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
      logger.error("Error fetching user measurement orders", err, {
        userId: userId.toString(),
        page,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Set price for a measurement order
   */
  public async setMeasurementOrderPrice(
    orderId: Types.ObjectId,
    price: number,
    adminId: Types.ObjectId
  ): Promise<IMeasurementOrderResponse | null> {
    try {
      // Get the order first to check current state
      const existingOrder = await MeasurementOrder.findById(orderId).lean();
      
      if (!existingOrder) {
        logger.warn("Measurement order not found for setting price", {
          orderId: orderId.toString(),
        });
        return null;
      }

      // Do not allow editing price for a paid order
      if (existingOrder.paymentStatus === PaymentStatus.Paid) {
        logger.warn("Attempt to change price on a paid measurement order", {
          orderId: orderId.toString(),
          orderNumber: existingOrder.orderNumber,
        });
        throw new Error("Cannot change the price of a measurement order that has already been paid.");
      }

      const isFirstPriceSet =
        existingOrder.price === null ||
        existingOrder.price === undefined ||
        existingOrder.price === 0;
      
      // Determine delivery fee, taking free shipping threshold into account
      let deliveryFee = existingOrder.deliveryFee || 0;
      let roundedTax: number;

      try {
        const { shippingSettingsService } = await import("../shippingSettings/service");
        const shippingSettings = await shippingSettingsService.getSettings();

        const freeShippingThreshold = shippingSettings.freeShippingThreshold;

        // Apply free shipping if a threshold is configured and the price meets or exceeds it
        if (
          typeof freeShippingThreshold === "number" &&
          freeShippingThreshold > 0 &&
          price >= freeShippingThreshold
        ) {
          deliveryFee = 0;
        }

        // Calculate tax (7.5% VAT rate for Nigeria) based on price + deliveryFee
        const subtotal = price + deliveryFee;
        const tax = subtotal * 0.075;
        roundedTax = Math.round(tax * 100) / 100;
      } catch (error) {
        // If shipping settings cannot be loaded, fall back to existing deliveryFee
        logger.warn("Failed to fetch shipping settings when setting measurement order price", {
          orderId: orderId.toString(),
          error: error instanceof Error ? error.message : String(error),
        });
        const subtotal = price + deliveryFee;
        const tax = subtotal * 0.075;
        roundedTax = Math.round(tax * 100) / 100;
      }

      // If this is the first time the price is being set, update the existing document in-place.
      if (isFirstPriceSet) {
        const order = await MeasurementOrder.findByIdAndUpdate(
          orderId,
          {
            $set: {
              price,
              tax: roundedTax,
              deliveryFee,
              priceSetAt: new Date(),
              priceSetBy: adminId,
            },
          },
          { new: true }
        ).lean();

        if (!order) {
          logger.warn("Measurement order not found after price update", {
            orderId: orderId.toString(),
          });
          return null;
        }

        logger.info("Measurement order price set", {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          price,
          tax: roundedTax,
          deliveryFee,
          adminId: adminId.toString(),
        });

        return this.mapOrderToResponse(order as IMeasurementOrder);
      }

      // If the price was already set before, create a brand new order document
      // and mark the existing one as replaced so it can no longer be paid.
      const newOrderNumber = this.generateOrderNumber();

      const replacementOrder = new MeasurementOrder({
        orderNumber: newOrderNumber,
        userId: existingOrder.userId || undefined,
        isGuest: existingOrder.isGuest,
        guestEmail: existingOrder.guestEmail,
        name: existingOrder.name,
        email: existingOrder.email,
        phone: existingOrder.phone,
        address: existingOrder.address,
        city: existingOrder.city,
        state: existingOrder.state,
        zipCode: existingOrder.zipCode,
        country: existingOrder.country,
        templates: existingOrder.templates,
        notes: existingOrder.notes,
        preferredStyle: existingOrder.preferredStyle,
        status: MeasurementOrderStatus.OrderReceived,
        paymentStatus: PaymentStatus.Pending,
        paymentMethod: existingOrder.paymentMethod || "monnify",
        paymentReference: null,
        monnifyTransactionReference: null,
        monnifyPaymentReference: null,
        paymentUrl: null,
        price,
        priceSetAt: new Date(),
        priceSetBy: adminId,
        shippingLocation: existingOrder.shippingLocation,
        tax: roundedTax,
        deliveryFee,
        paidAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        cancellationReason: undefined,
        isReplaced: false,
        replacedByOrderId: null,
        originalOrderId: existingOrder._id,
      });

      const savedReplacementOrder = await replacementOrder.save();

      // Mark the original order as replaced and cancelled
      await MeasurementOrder.findByIdAndUpdate(
        existingOrder._id,
        {
          $set: {
            isReplaced: true,
            replacedByOrderId: savedReplacementOrder._id,
            status: MeasurementOrderStatus.Cancelled,
            cancelledAt: new Date(),
            cancellationReason:
              "Order replaced after price update. A new receipt has been generated.",
          },
        }
      ).lean();

      logger.info("Measurement order price updated by creating replacement order", {
        originalOrderId: existingOrder._id.toString(),
        originalOrderNumber: existingOrder.orderNumber,
        replacementOrderId: savedReplacementOrder._id.toString(),
        replacementOrderNumber: savedReplacementOrder.orderNumber,
        price,
        tax: roundedTax,
        deliveryFee,
        adminId: adminId.toString(),
      });

      return this.mapOrderToResponse(savedReplacementOrder as unknown as IMeasurementOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error setting measurement order price", err, {
        orderId: orderId.toString(),
        price,
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Find measurement order by ID
   */
  public async findOrderById(
    orderId: Types.ObjectId
  ): Promise<IMeasurementOrder | null> {
    try {
      const order = await MeasurementOrder.findById(orderId).lean();

      if (!order) {
        logger.warn("Measurement order not found", {
          orderId: orderId.toString(),
        });
        return null;
      }

      return order as IMeasurementOrder;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding measurement order by ID", err, {
        orderId: orderId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Find measurement order by order number
   */
  public async findOrderByOrderNumber(
    orderNumber: string
  ): Promise<IMeasurementOrder | null> {
    try {
      const order = await MeasurementOrder.findOne({
        orderNumber: orderNumber,
      });

      return order ? (order as unknown as IMeasurementOrder) : null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding measurement order by order number", err, {
        orderNumber,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Update measurement order payment information
   */
  public async updateMeasurementOrderPayment(
    orderId: Types.ObjectId,
    paymentData: {
      monnifyTransactionReference?: string;
      monnifyPaymentReference?: string;
      paymentUrl?: string;
      paymentReference?: string;
    }
  ): Promise<IMeasurementOrderResponse | null> {
    try {
      const order = await MeasurementOrder.findByIdAndUpdate(
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

      return this.mapOrderToResponse(order as IMeasurementOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating measurement order payment", err, {
        orderId: orderId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Update measurement order payment status
   */
  public async updateMeasurementOrderPaymentStatus(
    transactionReference: string,
    paymentStatus: PaymentStatus,
    paidAt?: Date
  ): Promise<IMeasurementOrderResponse | null> {
    try {
      const updateData: any = {
        paymentStatus,
        ...(paidAt && { paidAt }),
        ...(paymentStatus === PaymentStatus.Paid && {
          status: MeasurementOrderStatus.DesignReview,
        }),
        ...(paymentStatus === PaymentStatus.Failed && {
          status: MeasurementOrderStatus.Cancelled,
        }),
      };

      const order = await MeasurementOrder.findOneAndUpdate(
        { monnifyTransactionReference: transactionReference },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!order) {
        logger.warn("Measurement order not found for transaction reference", {
          transactionReference,
        });
        return null;
      }

      logger.info("Measurement order payment status updated", {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        transactionReference,
        paymentStatus,
      });

      return this.mapOrderToResponse(order as IMeasurementOrder);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating measurement order payment status", err, {
        transactionReference,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Find measurement order by transaction reference
   */
  public async findOrderByTransactionReference(
    transactionReference: string
  ): Promise<IMeasurementOrder | null> {
    try {
      const order = await MeasurementOrder.findOne({
        monnifyTransactionReference: transactionReference,
      }).lean();

      return order ? (order as IMeasurementOrder) : null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error finding measurement order by transaction reference", err, {
        transactionReference,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }
}

export const measurementOrderService = new MeasurementOrderService();
