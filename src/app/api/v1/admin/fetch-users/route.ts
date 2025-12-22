import GeneralMiddleware from "@/lib/server/middleware";
import { userController } from "@/lib/server/user/controller";
import { userValidator } from "@/lib/server/user/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function handler(request: Request) {
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
    logger.warn("Rate limit exceeded for fetch users", {
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

  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get("page") || undefined,
    limit: url.searchParams.get("limit") || undefined,
    searchTerm: url.searchParams.get("searchTerm") || undefined,
    status: url.searchParams.get("status") || undefined,
  };

  const validation = userValidator.fetchUsers(queryParams);
  if (!validation.valid) {
    return validation.response!;
  }

  const page = parseInt(queryParams.page || "1", 10);
  const limit = parseInt(queryParams.limit || "10", 10);
  const validPage = page > 0 ? page : 1;
  const validLimit = limit > 0 && limit <= 50 ? limit : 10;

  const filters: {
    searchTerm?: string;
    status?: string;
  } = {};

  if (queryParams.searchTerm && queryParams.searchTerm.trim()) {
    filters.searchTerm = queryParams.searchTerm.trim();
  }

  if (queryParams.status && queryParams.status.trim()) {
    filters.status = queryParams.status;
  }

  logger.info("Fetching users", {
    adminId: auth.adminId!.toString(),
    page: validPage,
    limit: validLimit,
    filters: {
      hasSearchTerm: !!filters.searchTerm,
      status: filters.status || "all",
    },
  });

  return await userController.fetchUsers(validPage, validLimit, filters);
}

export const GET = utils.withErrorHandling(handler);
































