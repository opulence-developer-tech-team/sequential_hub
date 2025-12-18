import { NextResponse } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { orderService } from "@/lib/server/order/service";
import { measurementOrderService } from "@/lib/server/measurementOrder/service";

async function handler(request: Request): Promise<NextResponse> {
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

    // Get client IP for rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.FETCH.maxRequests,
      RATE_LIMITS.FETCH.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for track order", {
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

    // Get order number from query parameters
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    if (!orderNumber || orderNumber.trim() === "") {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Order number is required.",
        data: null,
      }) as NextResponse;
    }

    // Try to find order in regular orders first
    const regularOrderId = await orderService.findOrderByOrderNumber(
      orderNumber.trim()
    );

    if (regularOrderId) {
      // Found regular order
      const orderData = await orderService.findOrderById(regularOrderId);
      if (orderData) {
        const mappedOrder = orderService.mapOrderToResponse(orderData);
        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "Order found successfully.",
          data: {
            orderType: "regular",
            order: mappedOrder,
          },
        }) as NextResponse;
      }
    }

    // Try to find in measurement orders
    const measurementOrder = await measurementOrderService.findOrderByOrderNumber(
      orderNumber.trim()
    );

    if (measurementOrder) {
      // Found measurement order
      const mappedOrder = measurementOrderService.mapOrderToResponse(measurementOrder);
      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement order found successfully.",
        data: {
          orderType: "measurement",
          order: mappedOrder,
        },
      }) as NextResponse;
    }

    // Order not found
    return utils.customResponse({
      status: 404,
      message: MessageResponse.Error,
      description: "Order not found. Please check your order number and try again.",
      data: null,
    }) as NextResponse;
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in track order route", err, {
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

export const GET = utils.withErrorHandling(handler);

