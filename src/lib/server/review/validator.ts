import Joi from "joi";
import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";

interface CreateReviewBody {
  productSlug?: string;
  productId?: string;
  rating: number;
  comment: string;
  name?: string;
  email?: string;
}

class ReviewValidator {
  public createReview(body: CreateReviewBody) {
    const schema = Joi.object<CreateReviewBody>({
      productSlug: Joi.string().trim().optional(),
      productId: Joi.string()
        .trim()
        .optional()
        .custom((value, helpers) => {
          if (!Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "any.invalid": "productId must be a valid ObjectId.",
        }),
      rating: Joi.number().integer().min(1).max(5).required().messages({
        "number.base": "Rating must be a number.",
        "number.min": "Rating must be at least 1.",
        "number.max": "Rating cannot be more than 5.",
        "any.required": "Rating is required.",
      }),
      comment: Joi.string().trim().min(10).max(2000).required().messages({
        "string.base": "Comment must be text.",
        "string.min": "Comment must be at least 10 characters.",
        "string.max": "Comment cannot be longer than 2000 characters.",
        "any.required": "Comment is required.",
      }),
      name: Joi.string().trim().optional(),
      email: Joi.string().trim().email().optional().messages({
        "string.email": "Email must be a valid email address.",
      }),
    }).custom((value, helpers) => {
      // Require at least one identifier: productSlug or productId
      if (!value.productSlug && !value.productId) {
        return helpers.error("any.custom");
      }
      return value;
    }).messages({
      "any.custom": "Either productSlug or productId is required.",
    });

    const { error } = schema.validate(body);

    if (!error) {
      return { valid: true as const };
    }

    return {
      valid: false as const,
      response: utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: error.details[0].message,
        data: null,
      }),
    };
  }
}

export const reviewValidator = new ReviewValidator();



























