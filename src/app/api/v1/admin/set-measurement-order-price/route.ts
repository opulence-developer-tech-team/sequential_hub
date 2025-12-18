import GeneralMiddleware from "@/lib/server/middleware";
import { measurementOrderController } from "@/lib/server/measurementOrder/controller";
import { measurementOrderService } from "@/lib/server/measurementOrder/service";
import { emailService } from "@/lib/server/utils/email";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

async function handler(request: Request) {
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  await connectDB();

  const admin = await GeneralMiddleware.doesAdminExist(auth.adminId!);
  if (!admin.valid) return admin.response!;

  const isSuperAdmin = await GeneralMiddleware.isSuperAdmin({
    adminRole: admin.adminUser?.adminRole,
  });
  if (!isSuperAdmin.valid) return isSuperAdmin.response!;

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(
    auth.adminId!.toString(),
    RATE_LIMITS.UPDATE.maxRequests,
    RATE_LIMITS.UPDATE.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for set measurement order price", {
      adminId: auth.adminId!.toString(),
    });
    return utils.customResponse({
      status: 429,
      message: MessageResponse.Error,
      description: `Too many requests. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before trying again.`,
      data: {
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
    });
  }

  try {
    const body = await request.json();
    const { orderId, price } = body;

    // Validate required fields
    if (!orderId || price === undefined || price === null) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Order ID and price are required",
        data: null,
      });
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Price must be a number greater than or equal to 0",
        data: null,
      });
    }

    // Log the request for monitoring/auditing
    logger.info("Setting measurement order price", {
      adminId: auth.adminId!.toString(),
      orderId,
      price,
    });

    // Set the price
    const response = await measurementOrderController.setMeasurementOrderPrice(
      orderId,
      price,
      auth.adminId!
    );

    // If successful, send email notification
    if (response.status === 200) {
      try {
        // Clone the response before reading it to avoid locking the stream
        const clonedResponse = response.clone();
        const orderData = await clonedResponse.json();
        const order = orderData?.data; // The data is directly in orderData.data, not orderData.data.data
        
        if (order && order.email) {
          logger.info("Attempting to send price notification email", {
            orderId,
            email: order.email,
            orderNumber: order.orderNumber,
          });
          // Get base URL for payment link
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const paymentLink = order.isGuest
            ? `${baseUrl}/pay-measurement-order/${order.orderNumber}`
            : `${baseUrl}/account?tab=orders`;

          // Compute tax, delivery fee and total from updated order data
          const basePrice = typeof order.price === 'number' ? order.price : price;
          const deliveryFee = typeof order.deliveryFee === 'number' ? order.deliveryFee : null;
          const tax = typeof order.tax === 'number' ? order.tax : null;
          const totalAmount =
            basePrice +
            (deliveryFee || 0) +
            (tax || 0);

          // Generate email content with detailed price summary
          const customerName = order.name || 'Valued Customer';
          const emailHtml = emailService.generateMeasurementOrderPriceEmailTemplate(
            order.orderNumber,
            customerName,
            basePrice,
            paymentLink,
            order.isGuest,
            baseUrl,
            tax,
            deliveryFee,
            totalAmount
          );

          // Send email
          const emailSent = await emailService.sendEmail({
            to: order.email,
            subject: `Your Measurement Order #${order.orderNumber} - Price Quote Ready`,
            html: emailHtml,
          });

          if (!emailSent) {
            logger.warn("Failed to send price notification email", {
              orderId,
              email: order.email,
            });
            // Don't fail the request if email fails
          } else {
            logger.info("Price notification email sent", {
              orderId,
              email: order.email,
            });
          }
        } else {
          logger.warn("Order data missing or email not found", {
            orderId,
            hasOrder: !!order,
            hasEmail: order?.email ? true : false,
            orderData: order ? { orderNumber: order.orderNumber, name: order.name } : null,
          });
        }
      } catch (emailError: any) {
        logger.error("Error sending price notification email", emailError instanceof Error ? emailError : new Error(String(emailError)), {
          orderId,
          errorMessage: emailError?.message,
          stack: emailError instanceof Error ? emailError.stack : undefined,
        });
        // Don't fail the request if email fails
      }
    }

    return response;
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error in set measurement order price handler", err, {
      adminId: auth.adminId!.toString(),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: err.message || "Failed to set measurement order price",
      data: null,
    });
  }
}

export const PATCH = utils.withErrorHandling(handler);

