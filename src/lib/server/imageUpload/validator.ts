import Joi from "joi";

import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { IDeleteImage, IReplaceImage } from "./interface";

class ImageUploadValidator {
  public async imageUpload(formData: FormData) {
    const file = formData.get("image") as File | null;

    if (!file) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Please upload a file!",
          data: null,
        }),
      };
    }

    // Validate file size BEFORE processing (prevent memory exhaustion)
    const MAX_FILE_SIZE_MB = 10; // 10MB limit before compression
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: `File size exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`,
          data: null,
        }),
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "File is empty",
          data: null,
        }),
      };
    }

    // Validate MIME type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Image file must be either a JPG, JPEG, PNG, or WEBP image",
          data: null,
        }),
      };
    }

    // Validate file extension (additional check)
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid file extension. Only JPG, JPEG, PNG, and WEBP are allowed",
          data: null,
        }),
      };
    }

    return {
      valid: true,
    };
  }
  public deleteImage(body: IDeleteImage) {
    const schema = Joi.object({
      imageUrl: Joi.string().uri().required().messages({
        "any.required": "Image URL is required.",
        "string.uri": "Image URL must be a valid URI.",
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

  public async replaceImage(formData: FormData) {
    const file = formData.get("image") as File | null;
    const color = formData.get("color") as string | null;
    const oldImageUrl = formData.get("oldImageUrl") as string | null;
    const productId = formData.get("productId") as string | null;
    const imageIndex = formData.get("imageIndex") as string | null;

    if (!file) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Please upload a file!",
          data: null,
        }),
      };
    }

    if (!color || !oldImageUrl || !productId || imageIndex === null) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Missing required fields: color, oldImageUrl, productId, or imageIndex",
          data: null,
        }),
      };
    }

    // Validate file size
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: `File size exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`,
          data: null,
        }),
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "File is empty",
          data: null,
        }),
      };
    }

    // Validate MIME type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Image file must be either a JPG, JPEG, PNG, or WEBP image",
          data: null,
        }),
      };
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid file extension. Only JPG, JPEG, PNG, and WEBP are allowed",
          data: null,
        }),
      };
    }

    // Validate color format (hex color)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(color)) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid color format. Must be a valid hex color (e.g., #000000)",
          data: null,
        }),
      };
    }

    // Validate oldImageUrl is a valid URI
    try {
      new URL(oldImageUrl);
    } catch {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid old image URL format",
          data: null,
        }),
      };
    }

    // Validate productId is not empty
    if (!productId.trim()) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Product ID is required",
          data: null,
        }),
      };
    }

    // Validate imageIndex is a valid number
    const indexNum = parseInt(imageIndex, 10);
    if (isNaN(indexNum) || indexNum < 0) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid image index. Must be a non-negative number",
          data: null,
        }),
      };
    }

    return {
      valid: true,
    };
  }
}

export const imageUploadValidator = new ImageUploadValidator();
