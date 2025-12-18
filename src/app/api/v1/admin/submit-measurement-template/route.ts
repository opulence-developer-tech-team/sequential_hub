import { NextResponse } from "next/server";
import { measurementTemplateController } from "@/lib/server/measurementTemplates/controller";
import { measurementTemplateValidator } from "@/lib/server/measurementTemplates/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { ICreateMeasurementTemplateUserInput } from "@/lib/server/measurementTemplates/interface";
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

    // Verify admin authentication
    const auth = await utils.verifyAdminAuth();
    if (!auth.valid) {
      return auth.response! as NextResponse;
    }

    // Parse request body
    let body: ICreateMeasurementTemplateUserInput;
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
    const validation = measurementTemplateValidator.createTemplate(body);
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    // Log the request for monitoring
    logger.info("Measurement template submission initiated", {
      adminId: auth.adminId!.toString(),
      title: body.title,
      fieldCount: body.fields.length,
    });

    return await measurementTemplateController.createTemplate(auth.adminId!, body);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in submit measurement template route", err, {
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

export const POST = utils.withErrorHandling(handler);
