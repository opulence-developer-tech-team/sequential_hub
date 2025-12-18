import Joi from "joi";
import mongoose from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { IMeasurementOrderUserInput } from "./interface";
import { shippingLocation, worldCountries } from "../../resources";

class MeasurementOrderValidator {
  public createMeasurementOrder(body: IMeasurementOrderUserInput, userId: string | null = null) {
    // If userId exists, personal info is optional (will be fetched from user account)
    // If userId is null (guest), personal info is required
    const isGuest = !userId;
    
    // Create base schema - make fields required for guests, optional for authenticated users
    const firstNameSchema = Joi.string().trim().min(1).max(50).messages({
      "string.base": "First name must be a string.",
      "string.empty": "First name cannot be empty.",
      "string.min": "First name must be at least 1 character.",
      "string.max": "First name cannot exceed 50 characters.",
      "any.required": "First name is required.",
    });
    
    const lastNameSchema = Joi.string().trim().min(1).max(50).messages({
      "string.base": "Last name must be a string.",
      "string.empty": "Last name cannot be empty.",
      "string.min": "Last name must be at least 1 character.",
      "string.max": "Last name cannot exceed 50 characters.",
      "any.required": "Last name is required.",
    });
    
    const emailSchema = Joi.string().email().trim().lowercase().max(255).messages({
      "string.base": "Email must be a string.",
      "string.email": "Email must be a valid email address.",
      "string.empty": "Email cannot be empty.",
      "string.max": "Email cannot exceed 255 characters.",
      "any.required": "Email is required.",
    });
    
    const phoneSchema = Joi.string()
      .trim()
      .pattern(/^\+[1-9]\d{9,14}$/)
      .messages({
        "string.base": "Phone must be a string.",
        "string.empty": "Phone cannot be empty.",
        "string.pattern.base": "Phone must be in E.164 format (e.g., +1234567890). Must start with + followed by country code and 9-14 digits.",
        "any.required": "Phone is required.",
      });
    
    const addressSchema = Joi.string().trim().min(5).max(500).messages({
      "string.base": "Address must be a string.",
      "string.empty": "Address cannot be empty.",
      "string.min": "Address must be at least 5 characters.",
      "string.max": "Address cannot exceed 500 characters.",
      "any.required": "Address is required.",
    });
    
    const citySchema = Joi.string().trim().min(2).max(100).messages({
      "string.base": "City must be a string.",
      "string.empty": "City cannot be empty.",
      "string.min": "City must be at least 2 characters.",
      "string.max": "City cannot exceed 100 characters.",
      "any.required": "City is required.",
    });
    
    const stateSchema = Joi.string().trim().min(2).max(100).messages({
      "string.base": "State must be a string.",
      "string.empty": "State cannot be empty.",
      "string.min": "State must be at least 2 characters.",
      "string.max": "State cannot exceed 100 characters.",
      "any.required": "State is required.",
    });
    
    const zipCodeSchema = Joi.string().trim().min(3).max(20).messages({
      "string.base": "ZIP code must be a string.",
      "string.empty": "ZIP code cannot be empty.",
      "string.min": "ZIP code must be at least 3 characters.",
      "string.max": "ZIP code cannot exceed 20 characters.",
      "any.required": "ZIP code is required.",
    });
    
    const countrySchema = Joi.string()
      .trim()
      .custom((value, helpers) => {
        // Allow empty string for optional fields
        if (!value || value.trim() === '') {
          return value;
        }
        
        // Check if country exists in worldCountries list (case-insensitive)
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
        "string.base": "Country must be a string.",
        "string.empty": "Country cannot be empty.",
        "any.required": "Country is required.",
        "any.only": `Country must be one of the valid countries from our list.`,
      });
    
    const schema = Joi.object({
      // Support both firstName/lastName and name (for backward compatibility)
      firstName: isGuest ? firstNameSchema.required() : firstNameSchema.optional(),
      lastName: isGuest ? lastNameSchema.required() : lastNameSchema.optional(),
      name: Joi.string().trim().min(1).max(200).optional().messages({
        "string.base": "Name must be a string.",
        "string.empty": "Name cannot be empty.",
        "string.min": "Name must be at least 1 character.",
        "string.max": "Name cannot exceed 200 characters.",
      }),
      email: isGuest ? emailSchema.required() : emailSchema.optional(),
      phone: isGuest ? phoneSchema.required() : phoneSchema.optional(),
      address: isGuest ? addressSchema.required() : addressSchema.optional(),
      city: isGuest ? citySchema.required() : citySchema.optional(),
      state: isGuest ? stateSchema.required() : stateSchema.optional(),
      zipCode: isGuest ? zipCodeSchema.required() : zipCodeSchema.optional(),
      country: isGuest ? countrySchema.required() : countrySchema.optional(),
      templates: Joi.array()
        .items(
          Joi.object({
            templateId: Joi.string()
              .trim()
              .required()
              .custom((value, helpers) => {
                if (!mongoose.Types.ObjectId.isValid(value)) {
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
            quantity: Joi.number()
              .integer()
              .positive()
              .min(1)
              .max(10000)
              .required()
              .messages({
                "number.base": "Quantity must be a number.",
                "number.integer": "Quantity must be a whole number.",
                "number.positive": "Quantity must be greater than 0.",
                "number.min": "Quantity must be at least 1.",
                "number.max": "Quantity cannot exceed 10,000.",
                "any.required": "Quantity is required.",
              }),
            measurements: Joi.object()
              .pattern(
                Joi.string(),
                Joi.number().positive().max(1000).required()
              )
              .min(1)
              .required()
              .messages({
                "object.base": "Measurements must be an object.",
                "object.min": "At least one measurement is required.",
                "any.required": "Measurements are required.",
              }),
            sampleImageUrls: Joi.array()
              .items(Joi.string().uri().trim())
              .max(2)
              .optional()
              .messages({
                "array.max": "Maximum 2 images allowed per template.",
                "string.uri": "Sample image URL must be a valid URL.",
              }),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.base": "Templates must be an array.",
          "array.min": "At least one template is required.",
          "any.required": "Templates are required.",
        }),
      notes: Joi.string().trim().max(2000).optional().allow("").messages({
        "string.max": "Notes cannot exceed 2000 characters.",
      }),
      preferredStyle: Joi.string().trim().max(1000).optional().allow("").messages({
        "string.max": "Preferred style cannot exceed 1000 characters.",
      }),
      shippingLocation: Joi.string()
        .trim()
        .required()
        .valid(...shippingLocation)
        .messages({
          "string.base": "Shipping location must be a string.",
          "any.required": "Shipping location is required.",
          "any.only": `Shipping location must be one of: ${shippingLocation.join(", ")}.`,
        }),
      // Account creation fields (optional for guest users)
      createAccount: Joi.boolean().optional(),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .optional()
        .messages({
          "string.base": "Password must be text.",
          "string.min": "Password must be at least 8 characters long.",
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        }),
      confirmPassword: Joi.string().valid(Joi.ref("password")).optional().messages({
        "any.only": "Passwords do not match.",
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

    // Additional validation: if createAccount is true, password and confirmPassword are required
    if (body.createAccount) {
      if (!body.password || !body.confirmPassword) {
        return {
          valid: false,
          response: utils.customResponse({
            status: 400,
            message: MessageResponse.Error,
            description: "Password and confirm password are required when creating an account.",
            data: null,
          }),
        };
      }
    }

    return { valid: true };
  }
}

export const measurementOrderValidator = new MeasurementOrderValidator();
