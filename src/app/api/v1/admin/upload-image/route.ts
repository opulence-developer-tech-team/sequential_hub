import { utils } from "@/lib/server/utils";
import { imageUploadController } from "@/lib/server/imageUpload/controller";
import { IDeleteImage } from "@/lib/server/imageUpload/interface";
import { imageUploadValidator } from "@/lib/server/imageUpload/validator";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function imageUploadhandler(request: Request): Promise<NextResponse> {
  // Authentication
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(
    auth.adminId!.toString(),
    RATE_LIMITS.UPLOAD.maxRequests,
    RATE_LIMITS.UPLOAD.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for upload", {
      adminId: auth.adminId!.toString(),
    });
    return utils.customResponse({
      status: 429,
      message: MessageResponse.Error,
      description: `Too many requests. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before trying again.`,
      data: {
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
    });
  }

  // Validation
  const formData = await request.formData();
  const validationResponse = await imageUploadValidator.imageUpload(formData);
  if (!validationResponse.valid) return validationResponse.response! as NextResponse;

  // Upload with ownership tracking
  return await imageUploadController.uploadImage(formData, auth.adminId!);
}

async function imageDeletehandler(request: Request): Promise<NextResponse> {
  // Authentication
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(
    auth.adminId!.toString(),
    RATE_LIMITS.DELETE.maxRequests,
    RATE_LIMITS.DELETE.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for delete", {
      adminId: auth.adminId!.toString(),
    });
    return utils.customResponse({
      status: 429,
      message: MessageResponse.Error,
      description: `Too many requests. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before trying again.`,
      data: {
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
    });
  }

  // Validation
  const body: IDeleteImage = await request.json();
  const validationResponse = imageUploadValidator.deleteImage(body);
  if (!validationResponse.valid) return validationResponse.response! as NextResponse;

  // Delete with ownership verification
  return await imageUploadController.deleteUploadedImage(body, auth.adminId!);
}

async function imageReplaceHandler(request: Request): Promise<NextResponse> {
  // Authentication
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  // Rate limiting
  const rateLimitResult = rateLimiter.checkLimit(
    auth.adminId!.toString(),
    RATE_LIMITS.UPLOAD.maxRequests,
    RATE_LIMITS.UPLOAD.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for image replacement", {
      adminId: auth.adminId!.toString(),
    });
    return utils.customResponse({
      status: 429,
      message: MessageResponse.Error,
      description: `Too many requests. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before trying again.`,
      data: {
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
    });
  }

  // Validation
  const formData = await request.formData();
  const validationResponse = await imageUploadValidator.replaceImage(formData);
  if (!validationResponse.valid) return validationResponse.response! as NextResponse;

  // Replace image: upload new, delete old, update product
  return await imageUploadController.replaceImage(formData, auth.adminId!);
}

export const POST = utils.withErrorHandling(imageUploadhandler);
export const DELETE = utils.withErrorHandling(imageDeletehandler);
export const PATCH = utils.withErrorHandling(imageReplaceHandler);
