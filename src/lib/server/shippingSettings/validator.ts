import Joi from "joi";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { shippingLocation } from "../../resources";

interface UpdateShippingSettingsBody {
  locationFees: Array<{
    location: string;
    fee: number;
  }>;
  freeShippingThreshold: number;
}

class ShippingSettingsValidator {
  public updateSettings(body: UpdateShippingSettingsBody) {
    const schema = Joi.object<UpdateShippingSettingsBody>({
      locationFees: Joi.array()
        .items(
          Joi.object({
            location: Joi.string()
              .trim()
              .required()
              .valid(...shippingLocation)
              .messages({
                "string.base": "Location must be text.",
                "string.empty": "Location is required.",
                "any.required": "Location is required.",
                "any.only": `Location must be one of: ${shippingLocation.join(", ")}`,
              }),
            fee: Joi.number()
              .min(0)
              .required()
              .messages({
                "number.base": "Fee must be a number.",
                "number.min": "Fee must be 0 or greater.",
                "any.required": "Fee is required.",
              }),
          })
        )
        .required()
        .messages({
          "array.base": "Location fees must be an array.",
          "any.required": "Location fees are required.",
        }),
      freeShippingThreshold: Joi.number()
        .min(0)
        .required()
        .messages({
          "number.base": "Free shipping threshold must be a number.",
          "number.min": "Free shipping threshold must be 0 or greater.",
          "any.required": "Free shipping threshold is required.",
        }),
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

export const shippingSettingsValidator = new ShippingSettingsValidator();
























