import Joi from "joi";

import { Types } from "mongoose";
import { IAdminLogin } from "./interface";
import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";

class AdminValidator {
  public adminLogIn(body: IAdminLogin) {
    const schema = Joi.object<IAdminLogin>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text",
        "string.email": "Invalid email format",
        "any.required": "Email is required.",
      }),
      password: Joi.string().required().messages({
        "any.required": "Password is required.",
      }),
      rememberMe: Joi.boolean().optional().messages({
        "boolean.base": "Remember me must be a boolean value.",
      }),
    });

    const { error } = schema.validate(body);

    if (!error) {
      return {
        valid: true,
      };
    } else {
      console.log(error);
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
}

export const adminValidator = new AdminValidator();
