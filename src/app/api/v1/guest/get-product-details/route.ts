import { productController } from "@/lib/server/products/controller";
import { productValidator } from "@/lib/server/products/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // Rate limiting - use IP address for guest users
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.FETCH.maxRequests,
      RATE_LIMITS.FETCH.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for guest product details fetch", {
        clientIp,
      });
      return utils.customResponse({
        status: 429,
        message: MessageResponse.Error,
        description: `Too many requests. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before trying again.`,
        data: {
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
      }) as NextResponse;
    }

    // Extract slug from query parameters
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') || undefined;

    // Validate query parameters
    const validation = productValidator.getProductBySlug({ slug });
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    if (!slug) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Product slug is required.",
        data: null,
      }) as NextResponse;
    }

    // Log the request for monitoring/auditing
    logger.info("Fetching product details (guest)", {
      clientIp,
      slug,
    });

    return await productController.getProductBySlug(slug);
  } catch (error: any) {
    logger.error("Unexpected error in guest product details route", error, {
      url: request.url,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while fetching product details.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);






















































