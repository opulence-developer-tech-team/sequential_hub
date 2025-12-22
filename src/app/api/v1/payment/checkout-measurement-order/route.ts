import { NextResponse } from "next/server";
import { paymentController } from "@/lib/server/payment/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // Only allow POST requests
    if (request.method !== "POST") {
      return utils.customResponse({
        status: 405,
        message: MessageResponse.Error,
        description: "Method not allowed. Only POST requests are supported.",
        data: null,
      }) as NextResponse;
    }

    // Get client IP for rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.FETCH.maxRequests,
      RATE_LIMITS.FETCH.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for measurement order checkout", {
        clientIp,
      });
      return utils.customResponse({
        status: 429,
        message: MessageResponse.Error,
        description: `Too many requests. Please wait ${Math.ceil(
          (rateLimitResult.resetTime - Date.now()) / 1000
        )} seconds before trying again.`,
        data: {
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
      }) as NextResponse;
    }

    // Check authentication (optional - supports both authenticated and guest users)
    const auth = await utils.verifyUserAuth();
    const userId = auth.valid ? auth.userId! : null;

    // Parse request body
    let body: { orderId: string; orderNumber?: string };
    try {
      body = await request.json();
    } catch (error) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid JSON in request body.",
        data: null,
      }) as NextResponse;
    }

    // Validate request body
    if (!body.orderId) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Order ID is required.",
        data: null,
      }) as NextResponse;
    }

    // Log the request for monitoring/auditing
    logger.info("Measurement order checkout initiated", {
      clientIp,
      userId: userId?.toString() || "guest",
      orderId: body.orderId,
      orderNumber: body.orderNumber,
    });

    return await paymentController.initializeMeasurementOrderCheckout(body.orderId);
  } catch (error: any) {
    // This catch block is a safety net
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in measurement order checkout route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while processing checkout. Please try again.",
      data: null,
    }) as NextResponse;
  }
}

export const POST = utils.withErrorHandling(handler);















































