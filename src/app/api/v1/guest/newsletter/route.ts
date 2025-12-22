import { NextResponse } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { newsletterController } from "@/lib/server/newsletter/controller";

interface NewsletterBody {
  email: string;
  consent: boolean;
  source?: string;
}

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    if (request.method !== "POST") {
      return utils.customResponse({
        status: 405,
        message: MessageResponse.Error,
        description: "Method not allowed. Only POST requests are supported.",
        data: null,
      }) as NextResponse;
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit newsletter subscriptions
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.UPDATE.maxRequests,
      RATE_LIMITS.UPDATE.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for newsletter subscription", {
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

    let body: NewsletterBody;
    try {
      body = await request.json();
    } catch (error: any) {
      logger.warn("Invalid JSON in newsletter request body", {
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

    return await newsletterController.subscribe(body);
  } catch (error: any) {
    logger.error("Unexpected error in newsletter handler", error?.stack || error?.message, {
      error: error?.message,
    });

    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description:
        "An unexpected error occurred while processing your subscription. Please try again later.",
      data: null,
    }) as NextResponse;
  }
}

export const POST = utils.withErrorHandling(handler);






































