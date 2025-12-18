import { NextResponse } from "next/server";
import { measurementTemplateController } from "@/lib/server/measurementTemplates/controller";
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

    // Verify admin authentication
    const auth = await utils.verifyAdminAuth();
    if (!auth.valid) {
      return auth.response! as NextResponse;
    }

    // Log the request for monitoring
    logger.info("Measurement templates fetch initiated", {
      adminId: auth.adminId!.toString(),
    });

    return await measurementTemplateController.getTemplates(auth.adminId!);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in get measurement templates route", err, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while processing the request. Please try again.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);
