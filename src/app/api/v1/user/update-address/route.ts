import { userController } from "@/lib/server/user/controller";
import { userValidator } from "@/lib/server/user/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // Only allow PUT requests
    if (request.method !== "PUT") {
      return utils.customResponse({
        status: 405,
        message: MessageResponse.Error,
        description: "Method not allowed. Only PUT requests are supported.",
        data: null,
      }) as NextResponse;
    }

    // Verify user authentication
    const authResult = await utils.verifyUserAuth();

    if (!authResult.valid || !authResult.userId) {
      return utils.customResponse({
        status: 401,
        message: MessageResponse.Error,
        description: "Unauthorized. Please sign in to continue.",
        data: null,
      }) as NextResponse;
    }

    // Parse request body
    let body;
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

    // Validate request body
    const validation = userValidator.updateAddress(body);
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    // Log the request for monitoring
    logger.info("Update address request", {
      userId: authResult.userId.toString(),
    });

    return await userController.updateAddress(authResult.userId, body);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in update address route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while updating address.",
      data: null,
    }) as NextResponse;
  }
}

export const PUT = utils.withErrorHandling(handler);
