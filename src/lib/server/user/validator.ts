import Joi from "joi";
import { IUserSignUp, IUserSignIn, IUpdatePersonalInfo, IUpdateAddress } from "./interface";
import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";
import { worldCountries } from "../../resources";

class UserValidator {
  public signUp(body: IUserSignUp) {
    const schema = Joi.object<IUserSignUp>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text.",
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
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
      confirmPassword: Joi.string().valid(Joi.ref("password")).optional().messages({
        "any.only": "Passwords do not match.",
      }),
      firstName: Joi.string().trim().min(2).max(50).required().messages({
        "string.base": "First name must be text.",
        "string.min": "First name must be at least 2 characters long.",
        "string.max": "First name must not exceed 50 characters.",
        "any.required": "First name is required.",
      }),
      lastName: Joi.string().trim().min(2).max(50).required().messages({
        "string.base": "Last name must be text.",
        "string.min": "Last name must be at least 2 characters long.",
        "string.max": "Last name must not exceed 50 characters.",
        "any.required": "Last name is required.",
      }),
      phoneNumber: Joi.string()
        .trim()
        .required()
        .custom((value, helpers) => {
          // Remove formatting characters (spaces, hyphens, parentheses, dots)
          const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
          
          // Must start with +
          if (!cleaned.startsWith('+')) {
            return helpers.error('string.pattern.base');
          }
          
          // Remove + and validate digits
          const digitsOnly = cleaned.substring(1);
          
          // Must contain only digits after +
          if (!/^\d+$/.test(digitsOnly)) {
            return helpers.error('string.pattern.base');
          }
          
          // Length validation (E.164: 1-15 digits after +)
          if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            return helpers.error('string.pattern.base');
          }
          
          // Validate country code exists in our list
          // Extract country codes and normalize them (remove + and hyphens)
          const validCountryCodes = worldCountries.map(c => {
            const normalized = c.phoneCode.replace(/[\s\-]/g, '').replace('+', '');
            return normalized;
          });
          
          // Check if the phone number starts with any valid country code
          const phoneCodeMatch = validCountryCodes.find(code => {
            // Handle multi-digit country codes (1-3 digits)
            const codeLength = code.length;
            const phonePrefix = digitsOnly.substring(0, codeLength);
            return phonePrefix === code;
          });
          
          if (!phoneCodeMatch) {
            return helpers.error('string.pattern.base');
          }
          
          // Country code must start with 1-9
          if (!/^[1-9]/.test(digitsOnly)) {
            return helpers.error('string.pattern.base');
          }
          
          return value;
        })
        .messages({
          "string.base": "Phone number must be text.",
          "string.empty": "Phone number with country code is required.",
          "any.required": "Phone number with country code is required.",
          "string.pattern.base": "Phone number must start with a valid country code from our list (e.g., +1, +44, +234).",
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

  public signIn(body: IUserSignIn) {
    const schema = Joi.object<IUserSignIn>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text.",
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
      }),
      password: Joi.string().required().messages({
        "string.base": "Password must be text.",
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

  public updatePersonalInfo(body: IUpdatePersonalInfo) {
    const schema = Joi.object<IUpdatePersonalInfo>({
      firstName: Joi.string().trim().min(2).max(50).required().messages({
        "string.base": "First name must be text.",
        "string.min": "First name must be at least 2 characters long.",
        "string.max": "First name must not exceed 50 characters.",
        "any.required": "First name is required.",
      }),
      lastName: Joi.string().trim().min(2).max(50).required().messages({
        "string.base": "Last name must be text.",
        "string.min": "Last name must be at least 2 characters long.",
        "string.max": "Last name must not exceed 50 characters.",
        "any.required": "Last name is required.",
      }),
      phoneNumber: Joi.string()
        .trim()
        .required()
        .custom((value, helpers) => {
          // Remove formatting characters (spaces, hyphens, parentheses, dots)
          const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
          
          // Must start with +
          if (!cleaned.startsWith('+')) {
            return helpers.error('string.pattern.base');
          }
          
          // Remove + and validate digits
          const digitsOnly = cleaned.substring(1);
          
          // Must contain only digits after +
          if (!/^\d+$/.test(digitsOnly)) {
            return helpers.error('string.pattern.base');
          }
          
          // Length validation (E.164: 1-15 digits after +)
          if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            return helpers.error('string.pattern.base');
          }
          
          // Validate country code exists in our list
          // Extract country codes and normalize them (remove + and hyphens)
          const validCountryCodes = worldCountries.map(c => {
            const normalized = c.phoneCode.replace(/[\s\-]/g, '').replace('+', '');
            return normalized;
          });
          
          // Check if the phone number starts with any valid country code
          const phoneCodeMatch = validCountryCodes.find(code => {
            // Handle multi-digit country codes (1-3 digits)
            const codeLength = code.length;
            const phonePrefix = digitsOnly.substring(0, codeLength);
            return phonePrefix === code;
          });
          
          if (!phoneCodeMatch) {
            return helpers.error('string.pattern.base');
          }
          
          // Country code must start with 1-9
          if (!/^[1-9]/.test(digitsOnly)) {
            return helpers.error('string.pattern.base');
          }
          
          return value;
        })
        .messages({
          "string.base": "Phone number must be text.",
          "string.empty": "Phone number with country code is required.",
          "any.required": "Phone number with country code is required.",
          "string.pattern.base": "Phone number must start with a valid country code from our list (e.g., +1, +44, +234).",
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

  public updateAddress(body: IUpdateAddress) {
    const schema = Joi.object<IUpdateAddress>({
      street: Joi.string().trim().max(200).allow('').optional().messages({
        "string.base": "Street address must be text.",
        "string.max": "Street address must not exceed 200 characters.",
      }),
      city: Joi.string().trim().max(100).allow('').optional().messages({
        "string.base": "City must be text.",
        "string.max": "City must not exceed 100 characters.",
      }),
      state: Joi.string().trim().max(100).allow('').optional().messages({
        "string.base": "State/Province must be text.",
        "string.max": "State/Province must not exceed 100 characters.",
      }),
      zipCode: Joi.string().trim().max(20).allow('').optional().messages({
        "string.base": "Zip/Postal code must be text.",
        "string.max": "Zip/Postal code must not exceed 20 characters.",
      }),
      country: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .optional()
        .custom((value, helpers) => {
          // Allow empty string
          if (!value || value.trim() === '') {
            return value;
          }
          
          // Check if country exists in worldCountries list by name only (case-insensitive)
          const countryExists = worldCountries.some(
            c => c.name.toLowerCase() === value.trim().toLowerCase()
          );
          
          if (!countryExists) {
            return helpers.error('any.only');
          }
          
          // Return the exact country name from worldCountries (for consistency)
          const matchedCountry = worldCountries.find(
            c => c.name.toLowerCase() === value.trim().toLowerCase()
          );
          return matchedCountry?.name || value.trim();
        })
        .messages({
          "string.base": "Country must be text.",
          "string.max": "Country must not exceed 100 characters.",
          "any.only": "Country must be one of the valid countries from our list.",
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

  public fetchUsers(query: { page?: string; limit?: string; searchTerm?: string; status?: string }) {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(50).optional(),
      searchTerm: Joi.string().trim().max(100).optional(),
      status: Joi.string()
        .valid("all", "active", "pending", "inactive")
        .optional(),
    });

    const { error } = schema.validate(query);

    if (!error) {
      return { valid: true };
    }

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

export const userValidator = new UserValidator();
