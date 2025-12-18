import GeneralMiddleware from "@/lib/server/middleware";
import { orderController } from "@/lib/server/order/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@/lib/server/order/interface";

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
    logger.warn("Rate limit exceeded for fetch orders", {
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

  // Extract query parameters
  const url = new URL(request.url);
  const queryParams = {
    page: url.searchParams.get('page') || undefined,
    limit: url.searchParams.get('limit') || undefined,
    searchTerm: url.searchParams.get('searchTerm') || undefined,
    orderStatus: url.searchParams.get('orderStatus') || undefined,
    paymentStatus: url.searchParams.get('paymentStatus') || undefined,
    isGuest: url.searchParams.get('isGuest') || undefined,
  };

  // Parse and validate pagination parameters
  const page = parseInt(queryParams.page || '1', 10);
  const limit = parseInt(queryParams.limit || '10', 10);
  const validPage = page > 0 ? page : 1;
  // Limit max items per page to prevent excessive data transfer
  const validLimit = limit > 0 && limit <= 50 ? limit : 10;

  // Parse filter parameters
  const filters: {
    searchTerm?: string;
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    isGuest?: boolean;
  } = {};

  if (queryParams.searchTerm && queryParams.searchTerm.trim()) {
    filters.searchTerm = queryParams.searchTerm.trim();
  }

  if (queryParams.orderStatus && Object.values(OrderStatus).includes(queryParams.orderStatus as OrderStatus)) {
    filters.orderStatus = queryParams.orderStatus as OrderStatus;
  }

  if (queryParams.paymentStatus && Object.values(PaymentStatus).includes(queryParams.paymentStatus as PaymentStatus)) {
    filters.paymentStatus = queryParams.paymentStatus as PaymentStatus;
  }

  if (queryParams.isGuest !== undefined && queryParams.isGuest !== '') {
    filters.isGuest = queryParams.isGuest === 'true';
  }

  // Log the request for monitoring/auditing
  logger.info("Fetching orders", {
    adminId: auth.adminId!.toString(),
    page: validPage,
    limit: validLimit,
    filters: {
      hasSearchTerm: !!filters.searchTerm,
      orderStatus: filters.orderStatus || null,
      paymentStatus: filters.paymentStatus || null,
      isGuest: filters.isGuest ?? null,
    },
  });

  return await orderController.getAllOrders(validPage, validLimit, filters);
}

export const GET = utils.withErrorHandling(handler);







































