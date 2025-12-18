import Joi from "joi";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import {
  ICreateMeasurementTemplateUserInput,
  IUpdateMeasurementTemplateUserInput,
} from "./interface";
import { Types } from "mongoose";

class MeasurementTemplateValidator {
  public createTemplate(body: ICreateMeasurementTemplateUserInput) {
    const fieldSchema = Joi.object({
      name: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "Measurement field name must be text.",
        "string.empty": "Measurement field name cannot be empty.",
        "string.min": "Measurement field name must be at least 1 character.",
        "string.max": "Measurement field name cannot exceed 100 characters.",
        "any.required": "Measurement field name is required.",
      }),
    });

    const schema = Joi.object({
      title: Joi.string().trim().min(1).max(200).required().messages({
        "string.base": "Template title must be text.",
        "string.empty": "Template title cannot be empty.",
        "string.min": "Template title must be at least 1 character.",
        "string.max": "Template title cannot exceed 200 characters.",
        "any.required": "Template title is required.",
      }),

      fields: Joi.array()
        .items(fieldSchema)
        .min(1)
        .max(50)
        .required()
        .messages({
          "array.base": "Fields must be an array.",
          "array.min": "At least one measurement field is required.",
          "array.max": "Cannot have more than 50 measurement fields.",
          "any.required": "Fields are required.",
        }),
    });

    const { error } = schema.validate(body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(" ");
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: errorMessage,
          data: null,
        }),
      };
    }

    return { valid: true };
  }

  public updateTemplate(body: IUpdateMeasurementTemplateUserInput) {
    const fieldSchema = Joi.object({
      name: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "Measurement field name must be text.",
        "string.empty": "Measurement field name cannot be empty.",
        "string.min": "Measurement field name must be at least 1 character.",
        "string.max": "Measurement field name cannot exceed 100 characters.",
        "any.required": "Measurement field name is required.",
      }),
    });

    const schema = Joi.object({
      templateId: Joi.string()
        .trim()
        .required()
        .custom((value, helpers) => {
          if (!Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "string.base": "Template ID must be a string.",
          "string.empty": "Template ID cannot be empty.",
          "any.required": "Template ID is required.",
          "any.invalid": "Template ID must be a valid MongoDB ObjectId.",
        }),

      title: Joi.string().trim().min(1).max(200).required().messages({
        "string.base": "Template title must be text.",
        "string.empty": "Template title cannot be empty.",
        "string.min": "Template title must be at least 1 character.",
        "string.max": "Template title cannot exceed 200 characters.",
        "any.required": "Template title is required.",
      }),

      fields: Joi.array()
        .items(fieldSchema)
        .min(1)
        .max(50)
        .required()
        .messages({
          "array.base": "Fields must be an array.",
          "array.min": "At least one measurement field is required.",
          "array.max": "Cannot have more than 50 measurement fields.",
          "any.required": "Fields are required.",
        }),
    });

    const { error } = schema.validate(body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(" ");
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: errorMessage,
          data: null,
        }),
      };
    }

    return { valid: true };
  }
}

export const measurementTemplateValidator = new MeasurementTemplateValidator();





































