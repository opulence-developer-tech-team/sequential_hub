import Joi from "joi";
import mongoose from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { IOrderUserInput } from "./interface";
import { shippingLocation, worldCountries } from "../../resources";

class OrderValidator {
  public createOrder(body: IOrderUserInput) {
    const itemSchema = Joi.object({
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
      variantId: Joi.string()
        .trim()
        .required()
        .custom((value, helpers) => {
          // Validate that variantId is a valid MongoDB ObjectId
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "string.base": "Variant ID must be a string.",
          "string.empty": "Variant ID cannot be empty.",
          "any.required": "Variant ID is required.",
          "any.invalid": "Variant ID must be a valid MongoDB ObjectId.",
        }),
      quantity: Joi.number().integer().positive().max(1000).required().messages({
        "number.base": "Quantity must be a number.",
        "number.integer": "Quantity must be an integer.",
        "number.positive": "Quantity must be positive.",
        "number.max": "Quantity cannot exceed 1000.",
        "any.required": "Quantity is required.",
      }),
    });

    const addressSchema = Joi.object({
      firstName: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "First name must be a string.",
        "string.empty": "First name cannot be empty.",
        "string.min": "First name must be at least 1 character.",
        "string.max": "First name cannot exceed 100 characters.",
        "any.required": "First name is required.",
      }),
      lastName: Joi.string().trim().min(1).max(100).required().messages({
        "string.base": "Last name must be a string.",
        "string.empty": "Last name cannot be empty.",
        "string.min": "Last name must be at least 1 character.",
        "string.max": "Last name cannot exceed 100 characters.",
        "any.required": "Last name is required.",
      }),
      email: Joi.string().email().trim().lowercase().max(255).required().messages({
        "string.base": "Email must be a string.",
        "string.email": "Email must be a valid email address.",
        "string.empty": "Email cannot be empty.",
        "string.max": "Email cannot exceed 255 characters.",
        "any.required": "Email is required.",
      }),
      phone: Joi.string()
        .trim()
        .pattern(/^\+[1-9]\d{9,14}$/)
        .required()
        .messages({
          "string.base": "Phone must be a string.",
          "string.empty": "Phone cannot be empty.",
          "string.pattern.base": "Phone must be in E.164 format (e.g., +1234567890). Must start with + followed by country code and 9-14 digits.",
          "any.required": "Phone is required.",
        }),
      address: Joi.string().trim().min(5).max(500).required().messages({
        "string.base": "Address must be a string.",
        "string.empty": "Address cannot be empty.",
        "string.min": "Address must be at least 5 characters.",
        "string.max": "Address cannot exceed 500 characters.",
        "any.required": "Address is required.",
      }),
      city: Joi.string().trim().min(2).max(100).required().messages({
        "string.base": "City must be a string.",
        "string.empty": "City cannot be empty.",
        "string.min": "City must be at least 2 characters.",
        "string.max": "City cannot exceed 100 characters.",
        "any.required": "City is required.",
      }),
      state: Joi.string().trim().min(2).max(100).required().messages({
        "string.base": "State must be a string.",
        "string.empty": "State cannot be empty.",
        "string.min": "State must be at least 2 characters.",
        "string.max": "State cannot exceed 100 characters.",
        "any.required": "State is required.",
      }),
      zipCode: Joi.string().trim().min(3).max(20).required().messages({
        "string.base": "ZIP code must be a string.",
        "string.empty": "ZIP code cannot be empty.",
        "string.min": "ZIP code must be at least 3 characters.",
        "string.max": "ZIP code cannot exceed 20 characters.",
        "any.required": "ZIP code is required.",
      }),
      country: Joi.string()
        .trim()
        .required()
        .custom((value, helpers) => {
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
        }),
    });

    const schema = Joi.object({
      items: Joi.array().items(itemSchema).min(1).max(100).required().messages({
        "array.base": "Items must be an array.",
        "array.min": "Order must have at least one item.",
        "array.max": "Order cannot have more than 100 items.",
        "any.required": "Items are required.",
      }),
      // Shipping address is optional for authenticated users (can be fetched from account)
      // Required for guest users
      shippingAddress: addressSchema.optional(),
      billingAddress: addressSchema.optional(),
      sameAsShipping: Joi.boolean().optional(),
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
      shippingLocation: Joi.string()
        .trim()
        .required()
        .valid(...shippingLocation)
        .messages({
          "string.base": "Shipping location must be a string.",
          "any.required": "Shipping location is required.",
          "any.only": `Shipping location must be one of: ${shippingLocation.join(", ")}.`,
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

    // Note: Shipping address validation for guest vs authenticated users
    // is handled in the order service, not here in the validator
    // This allows flexibility: authenticated users can omit address (fetched from account)
    // while guest users must provide it

    return { valid: true };
  }
}

export const orderValidator = new OrderValidator();
