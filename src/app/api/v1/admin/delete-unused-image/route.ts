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

  const isSuperAdmin = await GeneralMiddleware.isSuperAdmin({
    adminRole: admin.adminUser?.adminRole,
  });
  if (!isSuperAdmin.valid) return isSuperAdmin.response!;

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(
    auth.adminId!.toString(),
    RATE_LIMITS.UPDATE.maxRequests,
    RATE_LIMITS.UPDATE.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for unused image deletion", {
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
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Image URL is required",
        data: null,
      });
    }

    logger.info("Unused image deletion initiated", {
      adminId: auth.adminId!.toString(),
      imageUrl,
    });

    return await imageUploadController.deleteUnusedImage(
      { imageUrl: imageUrl.trim() },
      auth.adminId!
    );
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in delete unused image route", err, {
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

export const DELETE = utils.withErrorHandling(handler);





















