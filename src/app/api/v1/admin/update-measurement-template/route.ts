import { NextResponse } from "next/server";
import { measurementTemplateController } from "@/lib/server/measurementTemplates/controller";
import { measurementTemplateValidator } from "@/lib/server/measurementTemplates/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { IUpdateMeasurementTemplateUserInput } from "@/lib/server/measurementTemplates/interface";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";

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

    // Verify admin authentication
    const auth = await utils.verifyAdminAuth();
    if (!auth.valid) {
      return auth.response! as NextResponse;
    }

    // Parse request body
    let body: IUpdateMeasurementTemplateUserInput;
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
    const validation = measurementTemplateValidator.updateTemplate(body);
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    // Log the request for monitoring
    logger.info("Measurement template update initiated", {
      adminId: auth.adminId!.toString(),
      templateId: body.templateId,
      title: body.title,
      fieldCount: body.fields.length,
    });

    return await measurementTemplateController.updateTemplate(auth.adminId!, body);
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Unexpected error in update measurement template route", err, {
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

export const PUT = utils.withErrorHandling(handler);















































