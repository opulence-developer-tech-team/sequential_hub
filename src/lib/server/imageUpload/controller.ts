import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import sharp from "sharp";
import path from "path";
import os from "os";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { IDeleteImage } from "./interface";
import cloudinary from "../config/cloudnary";
import { logger } from "../utils/logger";
import { imageUploadService } from "./service";
import { connectDB } from "../utils/db";

class ImageUploadController {
  private readonly MAX_SIZE_KB = 500;
  private readonly REQUEST_TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Upload image with timeout and ownership tracking
   */
  public async uploadImage(
    formData: FormData,
    adminId: Types.ObjectId
  ): Promise<NextResponse> {
    const file = formData.get("image") as File | null;

    if (!file) {
      logger.warn("Upload attempt with no file", { adminId: adminId.toString() });
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "No file provided",
        data: null,
      });
    }

    // Create timeout promise
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Request timeout: Image upload took too long"));
      }, this.REQUEST_TIMEOUT_MS);
    });

    try {
      // Race between upload and timeout
      const result = await Promise.race([
        this.performUpload(file, adminId),
        timeoutPromise,
      ]);

      return result;
    } catch (error: any) {
      logger.error("Image upload failed", error, {
        adminId: adminId.toString(),
        fileName: file.name,
        fileSize: file.size,
      });

      if (error.message?.includes("timeout")) {
        return utils.customResponse({
          status: 408,
          message: MessageResponse.Error,
          description: "Request timeout: Image upload took too long. Please try again with a smaller file.",
          data: null,
        });
      }

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: `Failed to upload image: ${error.message || "Unknown error"}`,
        data: null,
      });
    }
  }

  /**
   * Perform the actual upload operation
   */
  private async performUpload(
    file: File,
    adminId: Types.ObjectId
  ): Promise<NextResponse> {
    await connectDB();

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // Validate file is actually an image using Sharp (validates magic bytes)
    let metadata;
    try {
      metadata = await sharp(originalBuffer).metadata();
    } catch (error: any) {
      logger.warn("Invalid image file detected", {
        adminId: adminId.toString(),
        fileName: file.name,
        mimeType: file.type,
      });
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid image file. File content does not match image format.",
        data: null,
      });
    }

    // Upload to Cloudinary and get BOTH URL + publicId from Cloudinary response (no parsing).
    const { imageUrl, publicId } = await this.uploadImageToCloudinary(originalBuffer);

    // Save metadata is REQUIRED for success. If it fails, rollback Cloudinary upload.
    try {
      await imageUploadService.saveImageMetadata({
        imageUrl,
        publicId,
        uploadedBy: adminId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch (error: any) {
      logger.error("Failed to save image metadata; rolling back Cloudinary upload", error, {
        imageUrl,
        publicId,
        adminId: adminId.toString(),
      });

      // Best-effort rollback to preserve invariant:
      // "if an image exists in Cloudinary from this app, it must exist in UploadedImage".
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true,
        });
      } catch (rollbackError: any) {
        logger.error("Rollback failed: uploaded image may be orphaned in Cloudinary", rollbackError, {
          imageUrl,
          publicId,
          adminId: adminId.toString(),
        });
      }

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Upload failed. Please try again.",
        data: null,
      });
    }

    logger.info("Image uploaded successfully", {
      imageUrl,
      publicId,
      adminId: adminId.toString(),
      fileSize: file.size,
      format: metadata.format,
    });

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Image uploaded successfully!",
      data: {
        imageUrl,
      },
    });
  }

  /**
   * Delete image with ownership verification
   */
  public async deleteUploadedImage(
    body: IDeleteImage,
    adminId: Types.ObjectId
  ): Promise<NextResponse> {
    const imageUrl = body.imageUrl;

    await connectDB();

    // Validate that the URL is from Cloudinary (security check)
    if (
      !imageUrl.includes("cloudinary.com") &&
      !imageUrl.includes("res.cloudinary.com")
    ) {
      logger.warn("Delete attempt with invalid URL", {
        imageUrl,
        adminId: adminId.toString(),
      });
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid image URL. Only Cloudinary URLs are allowed.",
        data: null,
      });
    }

    // Verify ownership
    const hasOwnership = await imageUploadService.verifyOwnership(
      imageUrl,
      adminId
    );

    if (!hasOwnership) {
      logger.warn("Unauthorized delete attempt", {
        imageUrl,
        adminId: adminId.toString(),
      });
      return utils.customResponse({
        status: 403,
        message: MessageResponse.Error,
        description: "You do not have permission to delete this image.",
        data: null,
      });
    }

    try {
      // First, try to get publicId from database (more reliable)
      const imageMetadata = await imageUploadService.findImageByUrl(imageUrl);
      let publicId: string | null = null;

      if (imageMetadata && imageMetadata.publicId) {
        publicId = imageMetadata.publicId;
        logger.info("Using publicId from database", {
          imageUrl,
          publicId,
          adminId: adminId.toString(),
        });
      } else {
        // Fallback to extracting from URL
        publicId = imageUploadService.extractPublicIdFromUrl(imageUrl);
        logger.info("Extracted publicId from URL", {
          imageUrl,
          publicId,
          adminId: adminId.toString(),
        });
      }

      if (!publicId) {
        logger.error("Failed to extract public ID for deletion", undefined, {
          imageUrl,
          adminId: adminId.toString(),
        });
        // Still delete metadata even if we can't delete from Cloudinary
        await imageUploadService.deleteImageMetadata(imageUrl);
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid image URL format. Metadata deleted but image may still exist in Cloudinary.",
          data: null,
        });
      }

      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true, // Invalidate CDN cache
      });

      logger.info("Cloudinary destroy result", {
        imageUrl,
        publicId,
        result: result.result,
        adminId: adminId.toString(),
      });

      if (result.result === "not found") {
        // Image not found in Cloudinary, but still delete metadata if exists
        await imageUploadService.deleteImageMetadata(imageUrl);
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Image not found in Cloudinary",
          data: null,
        });
      }

      if (result.result !== "ok") {
        logger.warn("Unexpected Cloudinary delete result", {
          imageUrl,
          publicId,
          result: result.result,
          adminId: adminId.toString(),
        });
        // Still try to delete metadata
        await imageUploadService.deleteImageMetadata(imageUrl);
        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: `Failed to delete image from Cloudinary. Result: ${result.result}`,
          data: null,
        });
      }

      // Delete metadata from database
      await imageUploadService.deleteImageMetadata(imageUrl);

      logger.info("Image deleted successfully", {
        imageUrl,
        publicId,
        adminId: adminId.toString(),
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Image deleted successfully!",
        data: null,
      });
    } catch (error: any) {
      logger.error("Failed to delete image", error, {
        imageUrl,
        adminId: adminId.toString(),
        errorMessage: error.message,
        errorStack: error.stack,
      });
      
      // Try to delete metadata even if Cloudinary deletion failed
      try {
        await imageUploadService.deleteImageMetadata(imageUrl);
      } catch (metadataError: any) {
        logger.error("Failed to delete metadata after Cloudinary error", metadataError);
      }
      
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: `Failed to delete image: ${error.message || "Unknown error"}`,
        data: null,
      });
    }
  }

  public deleteUploadedImages(imageUrls: string[]) {
    const publicIds = imageUrls.map((url) => {
      const filename = path.basename(url);
      const { name: publicId } = path.parse(filename);
      return publicId;
    });

    publicIds.forEach((id) => {
      cloudinary.uploader.destroy(id).catch((err) => {
        logger.error("Failed to delete image in batch", err, { publicId: id });
      });
    });
  }

  public deleteUploadedImageNotFromReq(imageUrl: string) {
    const publicId = imageUploadService.extractPublicIdFromUrl(imageUrl);
    if (!publicId) {
      logger.warn("Failed to extract public ID for cleanup", { imageUrl });
      return;
    }

    cloudinary.uploader.destroy(publicId).catch((err) => {
      logger.error("Failed to delete image in cleanup", err, {
        imageUrl,
        publicId,
      });
    });
  }

  /**
   * Get paginated list of unused images
   * Only returns images that are NOT referenced in products, orders, or measurement orders
   */
  public async getUnusedImages(
    page: number = 1,
    limit: number = 20
  ): Promise<NextResponse> {
    await connectDB();

    try {
      // Validate pagination parameters
      const validPage = Math.max(1, Math.floor(page));
      const validLimit = Math.min(Math.max(1, Math.floor(limit)), 100); // Max 100 per page

      const result = await imageUploadService.findUnusedImages(validPage, validLimit);

      logger.info("Unused images fetched", {
        page: validPage,
        limit: validLimit,
        total: result.pagination.total,
        returned: result.images.length,
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Unused images fetched successfully",
        data: {
          images: result.images,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      logger.error("Failed to fetch unused images", error, {
        page,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: `Failed to fetch unused images: ${error.message || "Unknown error"}`,
        data: null,
      });
    }
  }

  /**
   * Delete unused image with race condition protection
   * Verifies image is still unused before deletion
   */
  public async deleteUnusedImage(
    body: IDeleteImage,
    adminId: Types.ObjectId
  ): Promise<NextResponse> {
    const imageUrl = body.imageUrl;

    await connectDB();

    // Validate Cloudinary URL
    if (
      !imageUrl.includes("cloudinary.com") &&
      !imageUrl.includes("res.cloudinary.com")
    ) {
      logger.warn("Delete attempt with invalid URL", {
        imageUrl,
        adminId: adminId.toString(),
      });
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid image URL. Only Cloudinary URLs are allowed.",
        data: null,
      });
    }

    // CRITICAL: Verify image is still unused (race condition protection)
    const isInUse = await imageUploadService.isImageInUse(imageUrl);
    if (isInUse) {
      logger.warn("Attempt to delete image that is in use", {
        imageUrl,
        adminId: adminId.toString(),
      });
      return utils.customResponse({
        status: 409,
        message: MessageResponse.Error,
        description: "This image is currently in use and cannot be deleted. Please refresh the list.",
        data: null,
      });
    }

    // Verify ownership
    const hasOwnership = await imageUploadService.verifyOwnership(
      imageUrl,
      adminId
    );

    if (!hasOwnership) {
      logger.warn("Unauthorized delete attempt", {
        imageUrl,
        adminId: adminId.toString(),
      });
      return utils.customResponse({
        status: 403,
        message: MessageResponse.Error,
        description: "You do not have permission to delete this image.",
        data: null,
      });
    }

    // Proceed with deletion (reuse existing logic)
    return await this.deleteUploadedImage(body, adminId);
  }

  public async uploadImageToCloudinary(originalBuffer: Buffer): Promise<{ imageUrl: string; publicId: string }> {
    const maxSizeKB = this.MAX_SIZE_KB;
    let finalBuffer: Buffer;
    let tempFileName: string = "";

    const isGreaterThanMaxSizeKB = originalBuffer.length > maxSizeKB * 1024;

    try {
      finalBuffer = isGreaterThanMaxSizeKB
        ? await this.compressImageToLimit(originalBuffer, maxSizeKB)
        : originalBuffer;
      tempFileName = path.join(os.tmpdir(), `${uuidv4()}.jpg`);
      await fs.writeFile(tempFileName, finalBuffer); 

      const uploadRes = await cloudinary.uploader.upload(tempFileName);
      const imageUrl = uploadRes?.secure_url;
      const publicId = uploadRes?.public_id;

      if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
        throw new Error("Cloudinary upload succeeded but secure_url is missing");
      }
      if (!publicId || typeof publicId !== 'string' || publicId.trim().length === 0) {
        throw new Error("Cloudinary upload succeeded but public_id is missing");
      }

      return { imageUrl, publicId };
    } catch (error: any) {
      throw error;
    } finally {
      if (tempFileName) {
        fs.unlink(tempFileName).catch((err) => {
          logger.error("Failed to delete temp file", err, { tempFileName });
        });
      }
    }
  }

  private async compressImageToLimit(
    originalBuffer: Buffer,
    maxSizeKB = 500
  ): Promise<Buffer> {
    let quality = 80;
    let compressedBuffer = await sharp(originalBuffer)
      .resize({ width: 800 })
      .jpeg({ quality })
      .toBuffer();

    while (compressedBuffer.length > maxSizeKB * 1024 && quality > 10) {
      quality -= 10;
      compressedBuffer = await sharp(originalBuffer)
        .resize({ width: 800 })
        .jpeg({ quality })
        .toBuffer();
    }

    return compressedBuffer;
  }

  /**
   * Replace image: upload new image, delete old image, update product
   */
  public async replaceImage(
    formData: FormData,
    adminId: Types.ObjectId
  ): Promise<NextResponse> {
    await connectDB();

    const file = formData.get("image") as File | null;
    const color = formData.get("color") as string | null;
    const oldImageUrl = formData.get("oldImageUrl") as string | null;
    const productId = formData.get("productId") as string | null;
    const imageIndex = formData.get("imageIndex") as string | null;

    if (!file || !color || !oldImageUrl || !productId || imageIndex === null) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Missing required fields",
        data: null,
      });
    }

    const indexNum = parseInt(imageIndex, 10);
    if (isNaN(indexNum) || indexNum < 0) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Invalid image index",
        data: null,
      });
    }

    try {
      // 1. Upload new image
      const arrayBuffer = await file.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);

      // Validate file is actually an image
      let metadata;
      try {
        metadata = await sharp(originalBuffer).metadata();
      } catch (error: any) {
        logger.warn("Invalid image file detected for replacement", {
          adminId: adminId.toString(),
          fileName: file.name,
        });
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid image file. File content does not match image format.",
          data: null,
        });
      }

      // Upload to Cloudinary and get BOTH URL + publicId
      const { imageUrl: newImageUrl, publicId: newPublicId } = await this.uploadImageToCloudinary(originalBuffer);

      // Save metadata is REQUIRED. If it fails, rollback and abort replacement.
      try {
        await imageUploadService.saveImageMetadata({
          imageUrl: newImageUrl,
          publicId: newPublicId,
          uploadedBy: adminId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      } catch (error: any) {
        logger.error("Failed to save new image metadata; rolling back Cloudinary upload", error, {
          imageUrl: newImageUrl,
          publicId: newPublicId,
          adminId: adminId.toString(),
        });
        try {
          await cloudinary.uploader.destroy(newPublicId, { resource_type: 'image', invalidate: true });
        } catch (rollbackError: any) {
          logger.error("Rollback failed for replacement upload", rollbackError, {
            imageUrl: newImageUrl,
            publicId: newPublicId,
            adminId: adminId.toString(),
          });
        }
        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "Failed to replace image. Please try again.",
          data: null,
        });
      }

      // 2. Verify ownership of old image before deletion
      const hasOwnership = await imageUploadService.verifyOwnership(
        oldImageUrl,
        adminId
      );

      if (!hasOwnership) {
        // Rollback: delete the new image we just uploaded
        if (newPublicId) {
          try {
            await cloudinary.uploader.destroy(newPublicId);
            await imageUploadService.deleteImageMetadata(newImageUrl);
          } catch (rollbackError: any) {
            logger.error("Failed to rollback new image after ownership check failed", rollbackError);
          }
        }

        logger.warn("Unauthorized image replacement attempt", {
          oldImageUrl,
          adminId: adminId.toString(),
        });
        return utils.customResponse({
          status: 403,
          message: MessageResponse.Error,
          description: "You do not have permission to replace this image.",
          data: null,
        });
      }

      // 3. Delete old image from Cloudinary
      const oldPublicId = imageUploadService.extractPublicIdFromUrl(oldImageUrl);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
          await imageUploadService.deleteImageMetadata(oldImageUrl);
        } catch (deleteError: any) {
          logger.error("Failed to delete old image during replacement", deleteError, {
            oldImageUrl,
            oldPublicId,
            adminId: adminId.toString(),
          });
          // Continue anyway - new image is uploaded
        }
      }

      // 4. Update product in database
      // Update all variants that use the old image URL
      const { productService } = await import("../products/service");
      const updatedProduct = await productService.updateProductImage(
        productId,
        oldImageUrl,
        newImageUrl,
        color
      );

      if (!updatedProduct) {
        // Rollback: delete new image if product update failed
        if (newPublicId) {
          try {
            await cloudinary.uploader.destroy(newPublicId);
            await imageUploadService.deleteImageMetadata(newImageUrl);
          } catch (rollbackError: any) {
            logger.error("Failed to rollback new image after product update failed", rollbackError);
          }
        }

        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Product not found",
          data: null,
        });
      }

      logger.info("Image replaced successfully", {
        oldImageUrl,
        newImageUrl,
        productId,
        imageIndex: indexNum,
        adminId: adminId.toString(),
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Image replaced successfully!",
        data: {
          imageUrl: newImageUrl,
          product: updatedProduct,
        },
      });
    } catch (error: any) {
      logger.error("Failed to replace image", error, {
        adminId: adminId.toString(),
        productId,
        oldImageUrl,
      });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: `Failed to replace image: ${error.message || "Unknown error"}`,
        data: null,
      });
    }
  }
}

export const imageUploadController = new ImageUploadController();
