import Joi from "joi";
import { ClothingCategory, ProductSize } from "@/types/enum";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { IAddProductUserInput, IEditProductUserInput } from "./interface";
import { Types } from "mongoose";

class ProductValidator {
  public addProduct(body: IAddProductUserInput) {
    const categoryValues = Object.values(ClothingCategory);
    const sizeValues = Object.values(ProductSize);

    const schema = Joi.object({
      name: Joi.string().trim().required().messages({
        "string.base": "Product name must be text.",
        "any.required": "Product name is required.",
      }),

      description: Joi.string().trim().required().messages({
        "string.base": "Description must be text.",
        "any.required": "Description is required.",
      }),

      category: Joi.string()
        .valid(...categoryValues)
        .required()
        .messages({
          "any.only": `Category must be one of: ${categoryValues.join(", ")}`,
          "any.required": "Category is required.",
        }),

      material: Joi.string().trim().required().max(200).messages({
        "string.base": "Material must be text.",
        "string.empty": "Material is required.",
        "any.required": "Material is required.",
        "string.max": "Material must not exceed 200 characters.",
      }),

      productOwner: Joi.string().trim().required().max(100).messages({
        "string.base": "Product owner must be text.",
        "string.empty": "Product owner is required.",
        "any.required": "Product owner is required.",
        "string.max": "Product owner must not exceed 100 characters.",
      }),

      productVariant: Joi.array()
        .items(
          Joi.object({
            imageUrls: Joi.array().items(Joi.string().uri()).min(1).required().messages({
              "array.base": "Image URLs must be an array.",
              "array.min": "At least one image URL is required for each variant.",
              "any.required": "Image URLs are required.",
              "string.uri": "Each image URL must be a valid URL.",
            }),
            color: Joi.string().trim().required().messages({
              "any.required": "Color is required.",
            }),
            size: Joi.string()
              .valid(...sizeValues)
              .required()
              .messages({
                "any.only": `Size must be one of: ${sizeValues.join(", ")}`,
                "any.required": "Size is required.",
              }),
            quantity: Joi.number().integer().min(0).required().messages({
              "number.base": "Quantity must be a number.",
              "number.min": "Quantity cannot be negative.",
              "any.required": "Quantity is required.",
            }),
            price: Joi.number().positive().required().messages({
              "number.base": "Price must be a number.",
              "number.positive": "Price must be greater than 0.",
              "any.required": "Price is required.",
            }),
            discountPrice: Joi.number()
              .min(0)
              .required()
              .custom((value, helpers) => {
                const parent = helpers.state.ancestors[0];
                const price = parent?.price;
                if (price !== undefined && typeof price === 'number' && value <= price) {
                  return helpers.error("any.invalid");
                }
                return value;
              })
              .messages({
                "number.base": "Discount price must be a number.",
                "any.required": "Discount price is required.",
                "any.invalid": "Discount price must be greater than the regular price.",
              }),
            inStock: Joi.boolean().required().messages({
              "boolean.base": "Stock status must be a boolean value (true or false).",
              "any.required": "Stock status is required.",
            }),
            measurements: Joi.object({
              neck: Joi.number().min(0).optional().messages({
                "number.base": "Neck must be a number.",
                "number.min": "Neck cannot be negative.",
              }),
              shoulder: Joi.number().min(0).optional().messages({
                "number.base": "Shoulder must be a number.",
                "number.min": "Shoulder cannot be negative.",
              }),
              chest: Joi.number().min(0).optional().messages({
                "number.base": "Chest must be a number.",
                "number.min": "Chest cannot be negative.",
              }),
              shortSleeve: Joi.number().min(0).optional().messages({
                "number.base": "Short sleeve must be a number.",
                "number.min": "Short sleeve cannot be negative.",
              }),
              longSleeve: Joi.number().min(0).optional().messages({
                "number.base": "Long sleeve must be a number.",
                "number.min": "Long sleeve cannot be negative.",
              }),
              roundSleeve: Joi.number().min(0).optional().messages({
                "number.base": "Round sleeve must be a number.",
                "number.min": "Round sleeve cannot be negative.",
              }),
              tummy: Joi.number().min(0).optional().messages({
                "number.base": "Tummy must be a number.",
                "number.min": "Tummy cannot be negative.",
              }),
              topLength: Joi.number().min(0).optional().messages({
                "number.base": "Top length must be a number.",
                "number.min": "Top length cannot be negative.",
              }),
              waist: Joi.number().min(0).optional().messages({
                "number.base": "Waist must be a number.",
                "number.min": "Waist cannot be negative.",
              }),
              laps: Joi.number().min(0).optional().messages({
                "number.base": "Laps must be a number.",
                "number.min": "Laps cannot be negative.",
              }),
              kneelLength: Joi.number().min(0).optional().messages({
                "number.base": "Kneel length must be a number.",
                "number.min": "Kneel length cannot be negative.",
              }),
              roundKneel: Joi.number().min(0).optional().messages({
                "number.base": "Round kneel must be a number.",
                "number.min": "Round kneel cannot be negative.",
              }),
              trouserLength: Joi.number().min(0).optional().messages({
                "number.base": "Trouser length must be a number.",
                "number.min": "Trouser length cannot be negative.",
              }),
              ankle: Joi.number().min(0).optional().messages({
                "number.base": "Ankle must be a number.",
                "number.min": "Ankle cannot be negative.",
              }),
            })
              .optional()
              .custom((value, helpers) => {
                if (!value || typeof value !== "object") {
                  return value;
                }
                const filledCount = Object.values(value).filter(
                  (v) => v !== undefined && v !== null
                ).length;
                if (filledCount < 5) {
                  return helpers.error("any.custom");
                }
                return value;
              })
              .messages({
                "any.custom":
                  "At least 5 measurement fields must be provided for each variant.",
            }),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.base": "productVariant must be an array.",
          "array.min": "At least one product variant is required.",
          "any.required": "productVariant is required.",
        }),

      isFeatured: Joi.boolean().required().messages({
        "boolean.base": "isFeatured must be true or false.",
        "any.required": "isFeatured is required.",
      }),

      inStock: Joi.boolean().required().messages({
        "boolean.base": "Stock status must be a boolean value (true or false).",
        "any.required": "Stock status is required.",
      }),
    });

    const { error } = schema.validate(body);

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

  public editProduct(body: IEditProductUserInput) {
    const categoryValues = Object.values(ClothingCategory);
    const sizeValues = Object.values(ProductSize);

    const schema = Joi.object<IEditProductUserInput>({
      productId: Joi.any()
        .required()
        .custom((value, helpers) => {
          if (!Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "any.required": "Product ID is required.",
          "any.invalid": "Product ID must be a valid ObjectId.",
        }),
      name: Joi.string().trim().required().messages({
        "string.base": "Product name must be text.",
        "any.required": "Product name is required.",
      }),

      description: Joi.string().trim().required().messages({
        "string.base": "Description must be text.",
        "any.required": "Description is required.",
      }),

      slug: Joi.string().trim().required().messages({
        "string.base": "Slug must be text.",
        "any.required": "Slug is required.",
      }),

      category: Joi.string()
        .valid(...categoryValues)
        .required()
        .messages({
          "any.only": `Category must be one of: ${categoryValues.join(", ")}`,
          "any.required": "Category is required.",
        }),

      material: Joi.string().trim().required().max(200).messages({
        "string.base": "Material must be text.",
        "string.empty": "Material is required.",
        "any.required": "Material is required.",
        "string.max": "Material must not exceed 200 characters.",
      }),

      productOwner: Joi.string().trim().required().max(100).messages({
        "string.base": "Product owner must be text.",
        "string.empty": "Product owner is required.",
        "any.required": "Product owner is required.",
        "string.max": "Product owner must not exceed 100 characters.",
        }),

      productVariant: Joi.array()
        .items(
          Joi.object({
            // _id is optional because:
            // - Existing variants should include their _id (for Mongoose to match and update them)
            // - New variants won't have _id until Mongoose auto-generates it during save
            _id: Joi.any()
              .optional()
              .custom((value, helpers) => {
                if (value !== undefined && value !== null && !Types.ObjectId.isValid(value)) {
                  return helpers.error("any.invalid");
                }
                return value;
              })
              .messages({
                "any.invalid": "Variant _id must be a valid ObjectId.",
              }),
            imageUrls: Joi.array().items(Joi.string().uri()).min(1).required().messages({
              "array.base": "Image URLs must be an array.",
              "array.min": "At least one image URL is required for each variant.",
              "any.required": "Image URLs are required.",
              "string.uri": "Each image URL must be a valid URL.",
            }),
            color: Joi.string().trim().required().messages({
              "any.required": "Color is required.",
            }),
            size: Joi.string()
              .valid(...sizeValues)
              .required()
              .messages({
                "any.only": `Size must be one of: ${sizeValues.join(", ")}`,
                "any.required": "Size is required.",
              }),
            quantity: Joi.number().integer().min(0).required().messages({
              "number.base": "Quantity must be a number.",
              "number.min": "Quantity cannot be negative.",
              "any.required": "Quantity is required.",
            }),
            price: Joi.number().positive().required().messages({
              "number.base": "Price must be a number.",
              "number.positive": "Price must be greater than 0.",
              "any.required": "Price is required.",
            }),
            discountPrice: Joi.number()
              .min(0)
              .required()
              .custom((value, helpers) => {
                const parent = helpers.state.ancestors[0];
                const price = parent?.price;
                if (price !== undefined && typeof price === 'number' && value <= price) {
                  return helpers.error("any.invalid");
                }
                return value;
              })
              .messages({
                "number.base": "Discount price must be a number.",
                "any.required": "Discount price is required.",
                "any.invalid": "Discount price must be greater than the regular price.",
              }),
            inStock: Joi.boolean().required().messages({
              "boolean.base": "Stock status must be a boolean value (true or false).",
              "any.required": "Stock status is required.",
            }),
            measurements: Joi.object({
              neck: Joi.number().min(0).optional().messages({
                "number.base": "Neck must be a number.",
                "number.min": "Neck cannot be negative.",
              }),
              shoulder: Joi.number().min(0).optional().messages({
                "number.base": "Shoulder must be a number.",
                "number.min": "Shoulder cannot be negative.",
              }),
              chest: Joi.number().min(0).optional().messages({
                "number.base": "Chest must be a number.",
                "number.min": "Chest cannot be negative.",
              }),
              shortSleeve: Joi.number().min(0).optional().messages({
                "number.base": "Short sleeve must be a number.",
                "number.min": "Short sleeve cannot be negative.",
              }),
              longSleeve: Joi.number().min(0).optional().messages({
                "number.base": "Long sleeve must be a number.",
                "number.min": "Long sleeve cannot be negative.",
              }),
              roundSleeve: Joi.number().min(0).optional().messages({
                "number.base": "Round sleeve must be a number.",
                "number.min": "Round sleeve cannot be negative.",
              }),
              tummy: Joi.number().min(0).optional().messages({
                "number.base": "Tummy must be a number.",
                "number.min": "Tummy cannot be negative.",
              }),
              topLength: Joi.number().min(0).optional().messages({
                "number.base": "Top length must be a number.",
                "number.min": "Top length cannot be negative.",
              }),
              waist: Joi.number().min(0).optional().messages({
                "number.base": "Waist must be a number.",
                "number.min": "Waist cannot be negative.",
              }),
              laps: Joi.number().min(0).optional().messages({
                "number.base": "Laps must be a number.",
                "number.min": "Laps cannot be negative.",
              }),
              kneelLength: Joi.number().min(0).optional().messages({
                "number.base": "Kneel length must be a number.",
                "number.min": "Kneel length cannot be negative.",
              }),
              roundKneel: Joi.number().min(0).optional().messages({
                "number.base": "Round kneel must be a number.",
                "number.min": "Round kneel cannot be negative.",
              }),
              trouserLength: Joi.number().min(0).optional().messages({
                "number.base": "Trouser length must be a number.",
                "number.min": "Trouser length cannot be negative.",
              }),
              ankle: Joi.number().min(0).optional().messages({
                "number.base": "Ankle must be a number.",
                "number.min": "Ankle cannot be negative.",
              }),
            })
              .optional()
              .custom((value, helpers) => {
                if (!value || typeof value !== "object") {
                  return value;
                }
                const filledCount = Object.values(value).filter(
                  (v) => v !== undefined && v !== null
                ).length;
                if (filledCount < 5) {
                  return helpers.error("any.custom");
                }
                return value;
              })
              .messages({
                "any.custom":
                  "At least 5 measurement fields must be provided for each variant.",
            }),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.base": "productVariant must be an array.",
          "array.min": "At least one product variant is required.",
          "any.required": "productVariant is required.",
        }),

      isFeatured: Joi.boolean().required().messages({
        "boolean.base": "isFeatured must be true or false.",
        "any.required": "isFeatured is required.",
      }),

      inStock: Joi.boolean().required().messages({
        "boolean.base": "Stock status must be a boolean value (true or false).",
        "any.required": "Stock status is required.",
      }),
    });

    const { error } = schema.validate(body);

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

  public deleteProduct(productId: string | null) {
    const schema = Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.required": "Product ID is required.",
        "any.invalid": "Product ID must be a valid ObjectId.",
        "string.base": "Product ID must be a string.",
      });

    const { error } = schema.validate(productId);

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

  public fetchProducts(query: {
    page?: string;
    limit?: string;
    searchTerm?: string;
    category?: string;
    featured?: string;
    inStock?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
  }) {
    const categoryValues = Object.values(ClothingCategory);

    const schema = Joi.object({
      page: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .messages({
          "string.pattern.base": "Page must be a positive integer.",
        }),
      limit: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .messages({
          "string.pattern.base": "Limit must be a positive integer.",
        }),
      searchTerm: Joi.string().trim().allow("").optional().messages({
        "string.base": "Search term must be text.",
      }),
      category: Joi.string()
        .valid(...categoryValues, "")
        .optional()
        .messages({
          "any.only": `Category must be one of: ${categoryValues.join(", ")} or empty.`,
        }),
      featured: Joi.string()
        .valid("true", "false", "")
        .optional()
        .messages({
          "any.only": "Featured must be 'true', 'false', or empty.",
        }),
      inStock: Joi.string()
        .valid("true", "false", "")
        .optional()
        .messages({
          "any.only": "In stock must be 'true', 'false', or empty.",
        }),
      size: Joi.string().trim().allow("").optional().messages({
        "string.base": "Size must be text.",
      }),
      minPrice: Joi.string()
        .pattern(/^\d+(\.\d+)?$/)
        .optional()
        .messages({
          "string.pattern.base": "Min price must be a valid number.",
        }),
      maxPrice: Joi.string()
        .pattern(/^\d+(\.\d+)?$/)
        .optional()
        .messages({
          "string.pattern.base": "Max price must be a valid number.",
        }),
      sortBy: Joi.string()
        .valid("name", "price-low", "price-high")
        .optional()
        .messages({
          "any.only": "Sort by must be one of: name, price-low, price-high.",
        }),
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

  public getProductBySlug(query: { slug?: string }) {
    const schema = Joi.object({
      slug: Joi.string()
        .trim()
        .required()
        .messages({
          "string.base": "Product slug must be text.",
          "any.required": "Product slug is required.",
          "string.empty": "Product slug cannot be empty.",
        }),
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

  public deleteProductVariant(query: {
    productId?: string;
    variantId?: string;
  }) {

  const schema = Joi.object({
      productId: Joi.string()
        .required()
        .custom((value, helpers) => {
          if (!Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "any.required": "Product ID is required.",
          "any.invalid": "Product ID must be a valid ObjectId.",
          "string.base": "Product ID must be a string.",
        }),
      variantId: Joi.string()
        .required()
        .custom((value, helpers) => {
          if (!Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "any.required": "Variant ID is required.",
          "any.invalid": "Variant ID must be a valid ObjectId.",
          "string.base": "Variant ID must be a string.",
        }),
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

export const productValidator = new ProductValidator();
