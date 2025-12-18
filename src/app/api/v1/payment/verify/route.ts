import { NextResponse } from "next/server";
import { paymentController } from "@/lib/server/payment/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";

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

    // Get transaction reference or payment reference from query params
    // Monnify redirects with paymentReference and transactionReference
    const { searchParams } = new URL(request.url);
    const transactionReference = searchParams.get("transactionReference");
    const paymentReference = searchParams.get("paymentReference");
    const orderNumber = searchParams.get("orderNumber");

    // We need at least one reference to verify payment
    if (!transactionReference && !paymentReference && !orderNumber) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Transaction reference, payment reference, or order number is required.",
        data: null,
      }) as NextResponse;
    }

    // Prefer transactionReference, fallback to paymentReference, then orderNumber
    const referenceToUse = transactionReference || paymentReference || orderNumber;

    // Log the request for monitoring
    logger.info("Payment verification requested", {
      transactionReference: transactionReference || "none",
      paymentReference: paymentReference || "none",
      orderNumber: orderNumber || "none",
    });

    return await paymentController.verifyPayment(referenceToUse!);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in payment verification route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while verifying payment. Please try again.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);
