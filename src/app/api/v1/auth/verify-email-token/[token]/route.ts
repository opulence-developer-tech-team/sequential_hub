import { authController } from "@/lib/server/auth/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function handler(
  request: Request,
  context?: { params?: Promise<{ token: string }> | { token: string } }
): Promise<NextResponse> {
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

    // Extract token from URL path or params
    let token: string | null = null;
    
    // Try to get from params (Next.js 15+ uses Promise, Next.js 13/14 uses object)
    if (context?.params) {
      const params = context.params instanceof Promise ? await context.params : context.params;
      token = params.token;
    }
    
    // Fallback: extract from URL path
    if (!token) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const tokenIndex = pathParts.indexOf('verify-email-token');
      if (tokenIndex !== -1 && pathParts[tokenIndex + 1]) {
        token = pathParts[tokenIndex + 1];
      }
    }

    if (!token) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Verification token is required.",
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
      logger.warn("Rate limit exceeded for verify email token", {
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
    logger.info("Email verification by token attempt", {
      clientIp,
    });

    return await authController.verifyEmailByToken(token);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in verify email token route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while verifying your email.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);


























