import { NextResponse } from "next/server";
import { utils } from "@/lib/server/utils";
import { imageUploadController } from "@/lib/server/imageUpload/controller";
import { imageUploadValidator } from "@/lib/server/imageUpload/validator";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { connectDB } from "@/lib/server/utils/db";
import { adminService } from "@/lib/server/admin/service";
import { Types } from "mongoose";

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // Verify request is from our frontend
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter((url): url is string => Boolean(url));

    const isFromFrontend =
      (origin && allowedOrigins.some((url) => url && origin.startsWith(url))) ||
      (referer && allowedOrigins.some((url) => url && referer.includes(url)));

    if (!isFromFrontend && process.env.NODE_ENV === "production") {
      logger.warn("Guest image request from unauthorized source", {
        origin,
        referer,
        method: request.method,
      });
      return utils.customResponse({
        status: 403,
        message: MessageResponse.Error,
        description: "Unauthorized: Request must come from the application frontend.",
        data: null,
      }) as NextResponse;
    }

    // Handle DELETE request
    if (request.method === "DELETE") {
      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // Rate limiting
      const rateLimitResult = rateLimiter.checkLimit(
        clientIp,
        RATE_LIMITS.UPLOAD.maxRequests,
        RATE_LIMITS.UPLOAD.windowMs
      );

      if (!rateLimitResult.allowed) {
        logger.warn("Rate limit exceeded for guest image delete", {
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

      // Get super admin ID for image ownership tracking
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@sequentialhub.com";
      const superAdmin = await adminService.findAdminByEmail(adminEmail);

      if (!superAdmin) {
        logger.error("Super admin not found for guest image delete", undefined, {
          adminEmail,
        });
        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "System configuration error. Please contact support.",
          data: null,
        }) as NextResponse;
      }

      // Parse request body
      const body = await request.json();
      const validationResponse = imageUploadValidator.deleteImage(body);
      
      if (!validationResponse.valid) {
        return validationResponse.response! as NextResponse;
      }

      // Delete image with super admin ID for ownership verification
      logger.info("Guest image delete initiated", {
        clientIp,
        imageUrl: body.imageUrl,
        superAdminId: superAdmin._id.toString(),
      });

      return await imageUploadController.deleteUploadedImage(
        body,
        superAdmin._id as Types.ObjectId
      );
    }

    // Handle POST request
    if (request.method !== "POST") {
      return utils.customResponse({
        status: 405,
        message: MessageResponse.Error,
        description: "Method not allowed. Only POST and DELETE requests are supported.",
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
      RATE_LIMITS.UPLOAD.maxRequests,
      RATE_LIMITS.UPLOAD.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for guest image upload", {
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

    // Get super admin ID for image ownership tracking
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@sequentialhub.com";
    const superAdmin = await adminService.findAdminByEmail(adminEmail);

    if (!superAdmin) {
      logger.error("Super admin not found for guest image upload", undefined, {
        adminEmail,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "System configuration error. Please contact support.",
        data: null,
      }) as NextResponse;
    }

    // Validate
    const formData = await request.formData();
    const validationResponse = await imageUploadValidator.imageUpload(formData);
    if (!validationResponse.valid) {
      return validationResponse.response! as NextResponse;
    }

    // Upload with super admin ID for tracking
    logger.info("Guest image upload initiated", {
      clientIp,
      superAdminId: superAdmin._id.toString(),
    });

    return await imageUploadController.uploadImage(
      formData,
      superAdmin._id as Types.ObjectId
    );
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in guest image upload route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description:
        "An unexpected error occurred while processing the request. Please try again.",
      data: null,
    }) as NextResponse;
  }
}

export const POST = utils.withErrorHandling(handler);
export const DELETE = utils.withErrorHandling(handler);
