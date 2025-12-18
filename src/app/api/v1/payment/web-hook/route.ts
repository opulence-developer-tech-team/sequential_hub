import { NextResponse } from "next/server";
import { paymentController } from "@/lib/server/payment/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";

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

    // Get webhook signature from headers
    const signature = request.headers.get("monnify-signature") || "";

    if (!signature) {
      logger.warn("Webhook request missing signature");
      return utils.customResponse({
        status: 401,
        message: MessageResponse.Error,
        description: "Missing webhook signature",
        data: null,
      }) as NextResponse;
    }

    // Parse request body
    let body: any;
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

    // Log the webhook for monitoring
    logger.info("Webhook received", {
      eventType: body.eventType,
      transactionReference: body.eventData?.transactionReference,
    });

    return await paymentController.handleWebhook(body, signature);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in webhook route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while processing webhook",
      data: null,
    }) as NextResponse;
  }
}

export const POST = utils.withErrorHandling(handler);
