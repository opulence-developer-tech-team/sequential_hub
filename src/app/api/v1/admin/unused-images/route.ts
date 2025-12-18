import GeneralMiddleware from "@/lib/server/middleware";
import { imageUploadController } from "@/lib/server/imageUpload/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function handler(request: Request): Promise<NextResponse> {
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  await connectDB();

  const admin = await GeneralMiddleware.doesAdminExist(auth.adminId!);
  if (!admin.valid) return admin.response!;

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(
    auth.adminId!.toString(),
    RATE_LIMITS.FETCH.maxRequests,
    RATE_LIMITS.FETCH.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for unused images fetch", {
      adminId: auth.adminId!.toString(),
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
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    return await imageUploadController.getUnusedImages(page, limit);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in unused images route", err, {
      adminId: auth.adminId!.toString(),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred. Please try again.",
      data: null,
    });
  }
}

export const GET = utils.withErrorHandling(handler);
















