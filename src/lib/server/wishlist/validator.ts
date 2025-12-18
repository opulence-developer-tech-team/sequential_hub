import Joi from "joi";
import mongoose from "mongoose";
import { IWishlistUserInput } from "./interface";
import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";

class WishlistValidator {
  public toggleWishlist(body: IWishlistUserInput) {
    const schema = Joi.object<IWishlistUserInput>({
      productId: Joi.string()
        .trim()
        .required()
        .custom((value, helpers) => {
          // Validate that productId is a valid MongoDB ObjectId
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "string.base": "Product ID must be a string.",
          "string.empty": "Product ID cannot be empty.",
          "any.required": "Product ID is required.",
          "any.invalid": "Product ID must be a valid MongoDB ObjectId.",
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

export const wishlistValidator = new WishlistValidator();
