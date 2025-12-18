import { wishlistController } from "@/lib/server/wishlist/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

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
    if (!auth.valid) {
      return auth.response! as NextResponse;
    }

    // Rate limiting - use IP address
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
      logger.warn("Rate limit exceeded for fetch wishlist", {
        clientIp,
        userId: auth.userId!.toString(),
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

    // Log the request for monitoring/auditing
    logger.info("Fetching user wishlist", {
      clientIp,
      userId: auth.userId!.toString(),
    });

    return await wishlistController.getUserWishlist(auth.userId!);
  } catch (error: any) {
    // This catch block is a safety net
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in fetch wishlist route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while fetching wishlist.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);
