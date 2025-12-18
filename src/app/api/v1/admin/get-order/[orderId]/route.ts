import { orderController } from "@/lib/server/order/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";
import GeneralMiddleware from "@/lib/server/middleware";

async function handler(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
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
    RATE_LIMITS.FETCH.maxRequests,
    RATE_LIMITS.FETCH.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for get order", {
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

  // Handle params as Promise (Next.js 15+) or object (Next.js 13/14)
  const resolvedParams = params instanceof Promise ? await params : params;
  const { orderId } = resolvedParams;

  logger.info("Fetching order by ID", {
    adminId: auth.adminId!.toString(),
    orderId,
  });

  return await orderController.getOrderById(orderId);
}

export const GET = async (
  request: Request,
  context: { params: Promise<{ orderId: string }> | { orderId: string } }
) => {
  try {
    return await handler(request, context);
  } catch (err) {
    console.error("Route handler error:", err);
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "Internal server error",
      data: null,
    });
  }
};


























