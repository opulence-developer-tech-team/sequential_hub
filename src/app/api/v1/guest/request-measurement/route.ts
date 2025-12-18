import { NextResponse } from "next/server";
import { measurementOrderController } from "@/lib/server/measurementOrder/controller";
import { measurementOrderValidator } from "@/lib/server/measurementOrder/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { IMeasurementOrderUserInput } from "@/lib/server/measurementOrder/interface";

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
      logger.warn("Rate limit exceeded for measurement request", {
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
    let body: IMeasurementOrderUserInput;
    try {
      body = await request.json();
    } catch (error: any) {
      logger.warn("Invalid JSON in measurement request body", {
        clientIp,
        error: error.message,
      });
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid request body. Expected valid JSON.",
        data: null,
      }) as NextResponse;
    }

    // Validate request body (pass userId to make personal info optional for authenticated users)
    const validation = measurementOrderValidator.createMeasurementOrder(body, userId?.toString() || null);
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    // Log the request for monitoring/auditing
    logger.info("Measurement order request initiated", {
      userId: userId?.toString() || "guest",
      clientIp,
      templateCount: body.templates?.length || 0,
      templateIds: body.templates?.map(t => t.templateId) || [],
      email: body.email,
    });

    // Create measurement order
    return await measurementOrderController.createMeasurementOrder(userId, body);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in measurement request route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description:
        "An unexpected error occurred while processing the request. Please try again.",
      data: null,
    }) as NextResponse;
  }
}

export const POST = utils.withErrorHandling(handler);
