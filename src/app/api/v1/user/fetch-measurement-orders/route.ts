import { measurementOrderController } from "@/lib/server/measurementOrder/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // Only allow GET requests
    if (request.method !== "GET") {
      return utils.customResponse({
        status: 405,
        message: MessageResponse.Error,
        description: "Method not allowed. Only GET requests are supported.",
        data: null,
      }) as NextResponse;
    }

    // Verify user authentication
    const auth = await utils.verifyUserAuth();
    if (!auth.valid || !auth.userId) {
      return utils.customResponse({
        status: 401,
        message: MessageResponse.Error,
        description: "Unauthorized. Please sign in to continue.",
        data: null,
      }) as NextResponse;
    }

    // Rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.FETCH.maxRequests,
      RATE_LIMITS.FETCH.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for fetch measurement orders", {
        clientIp,
        userId: auth.userId.toString(),
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;

    // Log the request for monitoring/auditing
    logger.info("Fetching user measurement orders", {
      clientIp,
      userId: auth.userId.toString(),
      page: validPage,
      limit: validLimit,
    });

    return await measurementOrderController.getUserMeasurementOrders(
      new Types.ObjectId(auth.userId.toString()),
      validPage,
      validLimit
    );
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in fetch measurement orders route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while fetching measurement orders.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);







































