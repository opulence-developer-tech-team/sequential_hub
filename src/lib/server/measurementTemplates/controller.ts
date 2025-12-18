import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { measurementTemplateService } from "./service";
import {
  ICreateMeasurementTemplateUserInput,
  IUpdateMeasurementTemplateUserInput,
} from "./interface";
import { logger } from "../utils/logger";

class MeasurementTemplateController {
  public async createTemplate(
    adminId: Types.ObjectId,
    body: ICreateMeasurementTemplateUserInput
  ): Promise<NextResponse> {
    try {
      const template = await measurementTemplateService.createTemplate({
        adminId,
        title: body.title.trim(),
        fields: body.fields.map((field) => ({
          name: field.name.trim(),
        })),
      });

      const response = measurementTemplateService.mapTemplateToResponse(template);

      return utils.customResponse({
        status: 201,
        message: MessageResponse.Success,
        description: "Measurement template created successfully",
        data: response,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in createTemplate controller", err, {
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to create measurement template",
        data: null,
      });
    }
  }

  public async updateTemplate(
    adminId: Types.ObjectId,
    body: IUpdateMeasurementTemplateUserInput
  ): Promise<NextResponse> {
    try {
      const templateId = new Types.ObjectId(body.templateId);

      const template = await measurementTemplateService.updateTemplate(
        templateId,
        adminId,
        body.title.trim(),
        body.fields.map((field) => ({
          name: field.name.trim(),
        }))
      );

      if (!template) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Measurement template not found or you don't have permission to update it",
          data: null,
        });
      }

      const response = measurementTemplateService.mapTemplateToResponse(template);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement template updated successfully",
        data: response,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in updateTemplate controller", err, {
        adminId: adminId.toString(),
        templateId: body.templateId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to update measurement template",
        data: null,
      });
    }
  }

  public async deleteTemplate(
    adminId: Types.ObjectId,
    templateId: string
  ): Promise<NextResponse> {
    try {
      const objectId = new Types.ObjectId(templateId);

      const deleted = await measurementTemplateService.deleteTemplate(
        objectId,
        adminId
      );

      if (!deleted) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Measurement template not found or you don't have permission to delete it",
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement template deleted successfully",
        data: null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in deleteTemplate controller", err, {
        adminId: adminId.toString(),
        templateId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to delete measurement template",
        data: null,
      });
    }
  }

  public async getTemplates(adminId: Types.ObjectId): Promise<NextResponse> {
    try {
      const templates = await measurementTemplateService.getTemplatesByAdmin(
        adminId
      );

      const response = templates.map((template) =>
        measurementTemplateService.mapTemplateToResponse(template)
      );

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Measurement templates fetched successfully",
        data: response,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in getTemplates controller", err, {
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: err.message || "Failed to fetch measurement templates",
        data: null,
      });
    }
  }
}

export const measurementTemplateController = new MeasurementTemplateController();















































