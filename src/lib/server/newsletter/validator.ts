import Joi from "joi";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";

interface SubscribeNewsletterBody {
  email: string;
  consent: boolean;
  source?: string;
}

class NewsletterValidator {
  public subscribe(body: SubscribeNewsletterBody) {
    const schema = Joi.object<SubscribeNewsletterBody>({
      email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
          "string.base": "Email must be text.",
          "string.email": "Please provide a valid email address.",
          "string.empty": "Email is required.",
          "any.required": "Email is required.",
        }),
      consent: Joi.boolean()
        .required()
        .valid(true)
        .messages({
          "boolean.base": "Consent must be accepted.",
          "any.only": "You must consent to receive email communications.",
          "any.required": "Consent is required.",
        }),
      source: Joi.string().trim().max(50).optional().messages({
        "string.max": "Source cannot be longer than 50 characters.",
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

export const newsletterValidator = new NewsletterValidator();































