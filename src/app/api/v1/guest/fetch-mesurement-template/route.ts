import { NextResponse } from "next/server";
import { measurementTemplateService } from "@/lib/server/measurementTemplates/service";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";

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

    // Rate limiting - use IP address for guest users
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
      logger.warn("Rate limit exceeded for guest measurement templates fetch", {
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

    // Log the request for monitoring
    logger.info("Measurement templates fetch initiated (guest)", {
      clientIp,
    });

    // Fetch all templates (public access)
    const templates = await measurementTemplateService.getAllTemplates();
    const response = templates.map((template) =>
      measurementTemplateService.mapTemplateToResponse(template)
    );

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Measurement templates fetched successfully",
      data: response,
    }) as NextResponse;
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      "Unexpected error in get measurement templates route (guest)",
      err,
      {
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description:
        "An unexpected error occurred while processing the request. Please try again.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);
