import GeneralMiddleware from "@/lib/server/middleware";
import { shippingSettingsController } from "@/lib/server/shippingSettings/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function getHandler(request: Request) {
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
    RATE_LIMITS.FETCH.maxRequests,
    RATE_LIMITS.FETCH.windowMs
  );

  if (!rateLimitResult.allowed) {
    logger.warn("Rate limit exceeded for shipping settings", {
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

  logger.info("Fetching shipping settings", {
    adminId: auth.adminId!.toString(),
  });

  return await shippingSettingsController.getSettings();
}

async function putHandler(request: Request) {
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
    logger.warn("Rate limit exceeded for shipping settings update", {
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

  const body = await request.json();

  logger.info("Updating shipping settings", {
    adminId: auth.adminId!.toString(),
  });

  return await shippingSettingsController.updateSettings(body);
}

export const GET = utils.withErrorHandling(getHandler);
export const PUT = utils.withErrorHandling(putHandler);
























