import GeneralMiddleware from "@/lib/server/middleware";
import { orderController } from "@/lib/server/order/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";
import { OrderStatus } from "@/lib/server/order/interface";

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
    logger.warn("Rate limit exceeded for update order status", {
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
    const { orderId, orderStatus } = body;

    // Validate required fields
    if (!orderId || !orderStatus) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Order ID and order status are required",
        data: null,
      });
    }

    // Validate order status
    if (!Object.values(OrderStatus).includes(orderStatus)) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid order status",
        data: null,
      });
    }

    // Log the request for monitoring/auditing
    logger.info("Updating order status", {
      adminId: auth.adminId!.toString(),
      orderId,
      orderStatus,
    });

    return await orderController.updateOrderStatus(orderId, orderStatus);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error in update order status handler", err, {
      adminId: auth.adminId!.toString(),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: err.message || "Failed to update order status",
      data: null,
    });
  }
}

export const PATCH = utils.withErrorHandling(handler);







































