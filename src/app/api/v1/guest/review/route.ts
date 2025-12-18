import { NextResponse } from "next/server";
import { connectDB } from "@/lib/server/utils/db";
import { utils } from "@/lib/server/utils";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { reviewController } from "@/lib/server/review/controller";

async function handler(request: Request): Promise<NextResponse> {
  await connectDB();

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (request.method === "GET") {
    // Rate limit read operations
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.FETCH.maxRequests,
      RATE_LIMITS.FETCH.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for guest review fetch", {
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

    const url = new URL(request.url);
    const productSlug = url.searchParams.get("slug") || undefined;
    const productId = url.searchParams.get("productId") || undefined;
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "10");

    return await reviewController.getReviewsForProduct({ productSlug, productId, page, limit });
  }

  if (request.method === "POST") {
    // Rate limit write operations more strictly
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.UPDATE.maxRequests,
      RATE_LIMITS.UPDATE.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for guest review create", {
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

    const body = await request.json();
    return await reviewController.createReview(body);
  }

  return utils.customResponse({
    status: 405,
    message: MessageResponse.Error,
    description: "Method not allowed. Only GET and POST are supported.",
    data: null,
  }) as NextResponse;
}

export const GET = utils.withErrorHandling(handler);
export const POST = utils.withErrorHandling(handler);





































