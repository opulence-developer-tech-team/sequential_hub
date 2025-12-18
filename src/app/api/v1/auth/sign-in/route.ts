import { userController } from "@/lib/server/user/controller";
import { IUserSignIn } from "@/lib/server/user/interface";
import { userValidator } from "@/lib/server/user/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

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
      logger.warn("Rate limit exceeded for sign-in", {
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

    // Parse request body
    let body: IUserSignIn;
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
    const validation = userValidator.signIn(body);
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    // Log the request for monitoring
    logger.info("User sign-in attempt", {
      clientIp,
      email: body.email,
    });

    return await userController.signIn(body);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in sign-in route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred during sign-in.",
      data: null,
    }) as NextResponse;
  }
}

export const POST = utils.withErrorHandling(handler);
