import { userController } from "@/lib/server/user/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

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

    // Log the request for monitoring
    logger.info("Fetch user details request", {
      userId: authResult.userId.toString(),
    });

    return await userController.getUserDetails(authResult.userId);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in fetch user details route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while fetching user details.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);
