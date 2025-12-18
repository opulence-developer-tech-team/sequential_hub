// Re-export user validators for authentication
export { userValidator } from "../user/validator";

import Joi from "joi";
import { IResendOTP, IVerifyEmail } from "./inteface";
import type { IForgotPassword, IResetPassword } from "./inteface";
import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";

class AuthValidator {
  public resendOTP(body: IResendOTP) {
    const schema = Joi.object<IResendOTP>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text.",
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
      }),
    });

    const { error } = schema.validate(body);

    if (!error) {
      return {
        valid: true,
      };
    } else {
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

  public verifyEmail(body: IVerifyEmail) {
    const schema = Joi.object<IVerifyEmail>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text.",
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
      }),
      otp: Joi.string()
        .length(6)
        .pattern(/^\d+$/)
        .required()
        .messages({
          "string.base": "OTP must be text.",
          "string.length": "OTP must be exactly 6 digits.",
          "string.pattern.base": "OTP must contain only numbers.",
          "any.required": "OTP is required.",
        }),
    });

    const { error } = schema.validate(body);

    if (!error) {
      return {
        valid: true,
      };
    } else {
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

  public forgotPassword(body: IForgotPassword) {
    const schema = Joi.object<IForgotPassword>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text.",
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
      }),
    });

    const { error } = schema.validate(body);

    if (!error) {
      return {
        valid: true,
      };
    } else {
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

  public resetPassword(body: IResetPassword) {
    const schema = Joi.object<IResetPassword>({
      token: Joi.string().required().messages({
        "string.base": "Reset token must be text.",
        "any.required": "Reset token is required.",
      }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          "string.base": "Password must be text.",
          "string.min": "Password must be at least 8 characters long.",
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
          "any.required": "Password is required.",
        }),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "string.base": "Confirm password must be text.",
        "any.only": "Passwords do not match.",
        "any.required": "Confirm password is required.",
      }),
    });

    const { error } = schema.validate(body);

    if (!error) {
      return {
        valid: true,
      };
    } else {
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

export const authValidator = new AuthValidator();
