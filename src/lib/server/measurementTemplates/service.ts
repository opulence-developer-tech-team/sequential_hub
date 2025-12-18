import {
  ICreateMeasurementTemplateInput,
  IMeasurementTemplate,
  IMeasurementTemplateResponse,
} from "./interface";
import MeasurementTemplate from "./entity";
import { Types } from "mongoose";
import { logger } from "../utils/logger";

class MeasurementTemplateService {
  public async createTemplate(
    input: ICreateMeasurementTemplateInput
  ): Promise<IMeasurementTemplate> {
    try {
      const template = new MeasurementTemplate({
        ...input,
      });

      const savedTemplate = await template.save();

      logger.info("Measurement template created successfully", {
        templateId: savedTemplate._id.toString(),
        adminId: input.adminId.toString(),
        title: input.title,
        fieldCount: input.fields.length,
      });

      return savedTemplate;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error creating measurement template", err, {
        adminId: input.adminId.toString(),
        title: input.title,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  public async updateTemplate(
    templateId: Types.ObjectId,
    adminId: Types.ObjectId,
    title: string,
    fields: { name: string }[]
  ): Promise<IMeasurementTemplate | null> {
    try {
      const template = await MeasurementTemplate.findOneAndUpdate(
        {
          _id: templateId,
          adminId: adminId, // Ensure admin owns the template
        },
        {
          title: title.trim(),
          fields: fields,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!template) {
        logger.warn("Measurement template not found or unauthorized", {
          templateId: templateId.toString(),
          adminId: adminId.toString(),
        });
        return null;
      }

      logger.info("Measurement template updated successfully", {
        templateId: template._id.toString(),
        adminId: adminId.toString(),
        title: title,
        fieldCount: fields.length,
      });

      return template;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating measurement template", err, {
        templateId: templateId.toString(),
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  public async deleteTemplate(
    templateId: Types.ObjectId,
    adminId: Types.ObjectId
  ): Promise<boolean> {
    try {
      const result = await MeasurementTemplate.findOneAndDelete({
        _id: templateId,
        adminId: adminId, // Ensure admin owns the template
      });

      if (!result) {
        logger.warn("Measurement template not found or unauthorized for deletion", {
          templateId: templateId.toString(),
          adminId: adminId.toString(),
        });
        return false;
      }

      logger.info("Measurement template deleted successfully", {
        templateId: templateId.toString(),
        adminId: adminId.toString(),
      });

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error deleting measurement template", err, {
        templateId: templateId.toString(),
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  public async getTemplatesByAdmin(
    adminId: Types.ObjectId
  ): Promise<IMeasurementTemplate[]> {
    try {
      const templates = await MeasurementTemplate.find({ adminId })
        .sort({ createdAt: -1 })
        .lean();

      logger.info("Fetched measurement templates for admin", {
        adminId: adminId.toString(),
        count: templates.length,
      });

      return templates as IMeasurementTemplate[];
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching measurement templates", err, {
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  public async getTemplateById(
    templateId: Types.ObjectId,
    adminId: Types.ObjectId
  ): Promise<IMeasurementTemplate | null> {
    try {
      const template = await MeasurementTemplate.findOne({
        _id: templateId,
        adminId: adminId,
      }).lean();

      return template as IMeasurementTemplate | null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching measurement template by ID", err, {
        templateId: templateId.toString(),
        adminId: adminId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Map template document to response format
   */
  public mapTemplateToResponse(
    template: IMeasurementTemplate
  ): IMeasurementTemplateResponse {
    return {
      _id: template._id.toString(),
      adminId: template.adminId.toString(),
      title: template.title,
      fields: template.fields,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  /**
   * Get all templates (for guest/public access)
   */
  public async getAllTemplates(): Promise<IMeasurementTemplate[]> {
    try {
      const templates = await MeasurementTemplate.find({})
        .sort({ createdAt: -1 })
        .lean();
      logger.info("Fetched all measurement templates", { count: templates.length });
      return templates as IMeasurementTemplate[];
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching all measurement templates", err, {
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * Get template by ID without admin check (for guest/public access)
   */
  public async getTemplateByIdPublic(templateId: Types.ObjectId): Promise<IMeasurementTemplate | null> {
    try {
      const template = await MeasurementTemplate.findOne({ _id: templateId }).lean();
      return template as IMeasurementTemplate | null;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching measurement template by ID (public)", err, {
        templateId: templateId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }
}

export const measurementTemplateService = new MeasurementTemplateService();

































