import Joi from "joi";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { ICartUserInput } from "./interface";

class CartValidator {
  public calculateCart(body: ICartUserInput[] | { items: ICartUserInput[]; shippingLocation?: string }) {
    // Support both old format (array) and new format (object with items and shippingLocation)
    const itemSchema = Joi.object({
      productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        "string.base": "Product ID must be a string.",
        "string.pattern.base": "Product ID must be a valid MongoDB ObjectId (24 hex characters).",
        "any.required": "Product ID is required.",
      }),
      variantId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        "string.base": "Variant ID must be a string.",
        "string.pattern.base": "Variant ID must be a valid MongoDB ObjectId (24 hex characters).",
        "any.required": "Variant ID is required.",
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        "number.base": "Quantity must be a number.",
        "number.integer": "Quantity must be an integer.",
        "number.min": "Quantity must be at least 1.",
        "any.required": "Quantity is required.",
      }),
    });

    // Try array format first (old format)
    const arraySchema = Joi.array()
      .items(itemSchema)
      .min(1)
      .max(100)
      .required()
      .messages({
        "array.base": "Cart items must be an array.",
        "array.min": "At least one cart item is required.",
        "array.max": "Cart cannot contain more than 100 items.",
        "any.required": "Cart items are required.",
      });

    // Try object format (new format)
    const objectSchema = Joi.object({
      items: Joi.array()
        .items(itemSchema)
        .min(1)
        .max(100)
        .required()
        .messages({
          "array.base": "Cart items must be an array.",
          "array.min": "At least one cart item is required.",
          "array.max": "Cart cannot contain more than 100 items.",
          "any.required": "Cart items are required.",
        }),
      shippingLocation: Joi.string().trim().optional().allow("").messages({
        "string.base": "Shipping location must be a string.",
      }),
    });

    // Validate against both schemas - if either passes, it's valid
    const arrayValidation = arraySchema.validate(body);
    const objectValidation = objectSchema.validate(body);

    // If array format is valid, return success
    if (!arrayValidation.error) {
      return { valid: true };
    }

    // If object format is valid, return success
    if (!objectValidation.error) {
      return { valid: true };
    }

    // Both formats failed, return the first error
    const error = arrayValidation.error || objectValidation.error;
    return {
      valid: false,
      response: utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: error.details[0].message,
        data: null,
      }),
    };
  }
}

export const cartValidator = new CartValidator();







































