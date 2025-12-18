import { Types } from "mongoose";
import UploadedImage from "./entity";
import { IUploadedImage } from "./interface";
import { logger } from "../utils/logger";

class ImageUploadService {
  /**
   * Save image metadata to database
   */
  async saveImageMetadata(data: {
    imageUrl: string;
    publicId: string;
    uploadedBy: Types.ObjectId;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<IUploadedImage> {
    try {
      const image = new UploadedImage(data);
      await image.save();
      logger.info("Image metadata saved", {
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        uploadedBy: data.uploadedBy.toString(),
      });
      return image;
    } catch (error: any) {
      logger.error("Failed to save image metadata", error, data);
      throw error;
    }
  }

  /**
   * Find image by URL
   */
  async findImageByUrl(imageUrl: string): Promise<IUploadedImage | null> {
    try {
      return await UploadedImage.findOne({ imageUrl }).exec();
    } catch (error: any) {
      logger.error("Failed to find image by URL", error, { imageUrl });
      return null;
    }
  }

  /**
   * Find image by public ID
   */
  async findImageByPublicId(publicId: string): Promise<IUploadedImage | null> {
    try {
      return await UploadedImage.findOne({ publicId }).exec();
    } catch (error: any) {
      logger.error("Failed to find image by public ID", error, { publicId });
      return null;
    }
  }

  /**
   * Verify image ownership
   */
  async verifyOwnership(
    imageUrl: string,
    adminId: Types.ObjectId
  ): Promise<boolean> {
    try {
      const image = await this.findImageByUrl(imageUrl);
      if (!image) {
        return false;
      }
      return image.uploadedBy.toString() === adminId.toString();
    } catch (error: any) {
      logger.error("Failed to verify image ownership", error, {
        imageUrl,
        adminId: adminId.toString(),
      });
      return false;
    }
  }

  /**
   * Delete image metadata from database
   */
  async deleteImageMetadata(imageUrl: string): Promise<boolean> {
    try {
      const result = await UploadedImage.deleteOne({ imageUrl }).exec();
      logger.info("Image metadata deleted", {
        imageUrl,
        deleted: result.deletedCount > 0,
      });
      return result.deletedCount > 0;
    } catch (error: any) {
      logger.error("Failed to delete image metadata", error, { imageUrl });
      return false;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * Handles various Cloudinary URL formats:
   * - https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
   * - https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
   * - https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
   */
  extractPublicIdFromUrl(imageUrl: string): string | null {
    try {
      // Match Cloudinary URL pattern
      // Pattern: /image/upload/ followed by optional version/transformations, then public_id
      const cloudinaryPattern = /\/image\/upload\/(?:v\d+\/)?(?:[^\/]+\/)*([^\.]+)/;
      const match = imageUrl.match(cloudinaryPattern);
      
      if (match && match[1]) {
        const publicId = match[1];
        logger.info("Extracted publicId from URL", { imageUrl, publicId });
        return publicId;
      }

      // Alternative pattern for URLs with transformations
      // Pattern: /upload/ followed by transformations and public_id
      const altPattern = /\/upload\/(?:v\d+\/)?(?:[^\/]+\/)*([^\/]+?)(?:\.[^.]+)?$/;
      const altMatch = imageUrl.match(altPattern);
      
      if (altMatch && altMatch[1]) {
        const publicId = altMatch[1].replace(/\.[^.]+$/, ''); // Remove file extension
        logger.info("Extracted publicId from URL (alt pattern)", { imageUrl, publicId });
        return publicId;
      }

      // Fallback: extract from filename (last segment before extension)
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || "";
      const publicId = filename.split(".")[0];
      
      if (publicId) {
        logger.info("Extracted publicId from filename", { imageUrl, publicId });
        return publicId;
      }

      logger.warn("Failed to extract publicId from URL", { imageUrl });
      return null;
    } catch (error: any) {
      logger.error("Failed to extract public ID from URL", error, { imageUrl });
      return null;
    }
  }

  /**
   * Find all unused images efficiently by checking all usage locations in parallel.
   * This method:
   * 1. Fetches all uploaded images
   * 2. Queries products, orders, and measurement orders in parallel to get all used URLs
   * 3. Uses Set intersection to find unused images (O(N) instead of O(N*M))
   * 4. Returns paginated results
   * 
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated list of unused images with metadata
   */
  async findUnusedImages(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    images: Array<{
      _id: string;
      imageUrl: string;
      publicId: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      uploadedBy: string;
      createdAt?: Date;
      updatedAt?: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      // Step 1: Fetch all uploaded images (we'll filter unused ones)
      const allImages = await UploadedImage.find({})
        .select('imageUrl publicId fileName fileSize mimeType uploadedBy createdAt updatedAt')
        .lean()
        .exec();

      if (allImages.length === 0) {
        return {
          images: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      // Step 2: Collect all image URLs from all images
      const allImageUrls = new Set(allImages.map(img => img.imageUrl));

      // Step 3: Query all usage locations in PARALLEL (not sequential)
      // This is the key optimization - O(1) parallel queries instead of O(N) sequential
      const [productImages, orderImages, measurementOrderImages] = await Promise.all([
        // Products: Check productVariant.imageUrls arrays
        this.getUsedImageUrlsFromProducts(),
        // Orders: Check items.variantImageUrls arrays
        this.getUsedImageUrlsFromOrders(),
        // Measurement Orders: Check templates[].sampleImageUrls[]
        this.getUsedImageUrlsFromMeasurementOrders(),
      ]);

      // Step 4: Combine all used URLs into a single Set (O(N) operation)
      const usedImageUrls = new Set<string>();
      productImages.forEach(url => usedImageUrls.add(url));
      orderImages.forEach(url => usedImageUrls.add(url));
      measurementOrderImages.forEach(url => usedImageUrls.add(url));

      // Step 5: Find unused images (Set difference - O(N) operation)
      const unusedImages = allImages.filter(
        img => !usedImageUrls.has(img.imageUrl)
      );

      // Step 6: Paginate unused images
      const skip = (page - 1) * limit;
      const paginatedImages = unusedImages.slice(skip, skip + limit);
      const total = unusedImages.length;
      const totalPages = Math.ceil(total / limit);

      logger.info("Unused images query completed", {
        totalImages: allImages.length,
        usedImages: usedImageUrls.size,
        unusedImages: unusedImages.length,
        page,
        limit,
        returned: paginatedImages.length,
      });

      return {
        images: paginatedImages.map(img => ({
          _id: img._id.toString(),
          imageUrl: img.imageUrl,
          publicId: img.publicId,
          fileName: img.fileName,
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          uploadedBy: img.uploadedBy.toString(),
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error: any) {
      logger.error("Failed to find unused images", error, {
        page,
        limit,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Extract all image URLs used in products (from productVariant.imageUrls arrays)
   * Uses aggregation for efficiency
   */
  private async getUsedImageUrlsFromProducts(): Promise<Set<string>> {
    try {
      const { default: Product } = await import("../products/entity");
      
      // Use aggregation to extract all unique imageUrls from productVariant arrays
      // Handle both new imageUrls array and old imageUrl field for backward compatibility
      const result = await Product.aggregate([
        { $unwind: "$productVariant" },
        // Unwind imageUrls array (if it exists) or create array from imageUrl
        {
          $project: {
            imageUrls: {
              $cond: {
                if: { $isArray: "$productVariant.imageUrls" },
                then: "$productVariant.imageUrls",
                else: {
                  $cond: {
                    if: { $ne: ["$productVariant.imageUrl", null] },
                    then: ["$productVariant.imageUrl"],
                    else: []
                  }
                }
              }
            }
          }
        },
        { $unwind: "$imageUrls" },
        { $group: { _id: "$imageUrls" } },
        { $project: { _id: 0, imageUrl: "$_id" } },
      ]).exec();

      const imageUrls = new Set<string>();
      result.forEach((doc: any) => {
        if (doc.imageUrl && typeof doc.imageUrl === 'string' && doc.imageUrl.trim().length > 0) {
          imageUrls.add(doc.imageUrl);
        }
      });

      logger.info("Extracted product image URLs", { count: imageUrls.size });
      return imageUrls;
    } catch (error: any) {
      logger.error("Failed to extract product image URLs", error);
      // Return empty set on error - better to show false positives than crash
      return new Set<string>();
    }
  }

  /**
   * Extract all image URLs used in orders (from items.variantImageUrls arrays)
   */
  private async getUsedImageUrlsFromOrders(): Promise<Set<string>> {
    try {
      const { default: Order } = await import("../order/entity");
      
      // Handle both new variantImageUrls array and old variantImageUrl field for backward compatibility
      const result = await Order.aggregate([
        { $unwind: "$items" },
        // Unwind variantImageUrls array (if it exists) or create array from variantImageUrl
        {
          $project: {
            imageUrls: {
              $cond: {
                if: { $isArray: "$items.variantImageUrls" },
                then: "$items.variantImageUrls",
                else: {
                  $cond: {
                    if: { $ne: ["$items.variantImageUrl", null] },
                    then: ["$items.variantImageUrl"],
                    else: []
                  }
                }
              }
            }
          }
        },
        { $unwind: "$imageUrls" },
        { $group: { _id: "$imageUrls" } },
        { $project: { _id: 0, imageUrl: "$_id" } },
      ]).exec();

      const imageUrls = new Set<string>();
      result.forEach((doc: any) => {
        if (doc.imageUrl && typeof doc.imageUrl === 'string' && doc.imageUrl.trim().length > 0) {
          imageUrls.add(doc.imageUrl);
        }
      });

      logger.info("Extracted order image URLs", { count: imageUrls.size });
      return imageUrls;
    } catch (error: any) {
      logger.error("Failed to extract order image URLs", error);
      return new Set<string>();
    }
  }

  /**
   * Extract all image URLs used in measurement orders (from templates[].sampleImageUrls[])
   */
  private async getUsedImageUrlsFromMeasurementOrders(): Promise<Set<string>> {
    try {
      const { default: MeasurementOrder } = await import("../measurementOrder/entity");
      
      const result = await MeasurementOrder.aggregate([
        { $unwind: "$templates" },
        { $unwind: { path: "$templates.sampleImageUrls", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$templates.sampleImageUrls" } },
        { $project: { _id: 0, imageUrl: "$_id" } },
        { $match: { imageUrl: { $ne: null } } },
      ]).exec();

      const imageUrls = new Set<string>();
      result.forEach((doc: any) => {
        if (doc.imageUrl && typeof doc.imageUrl === 'string') {
          imageUrls.add(doc.imageUrl);
        }
      });

      logger.info("Extracted measurement order image URLs", { count: imageUrls.size });
      return imageUrls;
    } catch (error: any) {
      logger.error("Failed to extract measurement order image URLs", error);
      return new Set<string>();
    }
  }

  /**
   * Verify if an image is currently in use (race condition protection)
   * Called before deletion to ensure image hasn't been used since the list was fetched
   */
  async isImageInUse(imageUrl: string): Promise<boolean> {
    try {
      const [inProducts, inOrders, inMeasurementOrders] = await Promise.all([
        this.isImageUsedInProducts(imageUrl),
        this.isImageUsedInOrders(imageUrl),
        this.isImageUsedInMeasurementOrders(imageUrl),
      ]);

      const inUse = inProducts || inOrders || inMeasurementOrders;

      if (inUse) {
        logger.warn("Image deletion blocked - image is in use", { imageUrl });
      }

      return inUse;
    } catch (error: any) {
      logger.error("Failed to check if image is in use", error, { imageUrl });
      // On error, assume it's in use (fail-safe) to prevent accidental deletion
      return true;
    }
  }

  private async isImageUsedInProducts(imageUrl: string): Promise<boolean> {
    try {
      const { default: Product } = await import("../products/entity");
      // Check both new imageUrls array and old imageUrl field for backward compatibility
      const count = await Product.countDocuments({
        $or: [
          { "productVariant.imageUrls": imageUrl }, // New format: imageUrls array
          { "productVariant.imageUrl": imageUrl }, // Old format: single imageUrl (backward compatibility)
        ]
      }).exec();
      return count > 0;
    } catch (error: any) {
      logger.error("Failed to check product usage", error, { imageUrl });
      return true; // Fail-safe: assume in use
    }
  }

  private async isImageUsedInOrders(imageUrl: string): Promise<boolean> {
    try {
      const { default: Order } = await import("../order/entity");
      // Check both new variantImageUrls array and old variantImageUrl field for backward compatibility
      const count = await Order.countDocuments({
        $or: [
          { "items.variantImageUrls": imageUrl }, // New format: variantImageUrls array
          { "items.variantImageUrl": imageUrl }, // Old format: single variantImageUrl (backward compatibility)
        ]
      }).exec();
      return count > 0;
    } catch (error: any) {
      logger.error("Failed to check order usage", error, { imageUrl });
      return true; // Fail-safe: assume in use
    }
  }

  private async isImageUsedInMeasurementOrders(imageUrl: string): Promise<boolean> {
    try {
      const { default: MeasurementOrder } = await import("../measurementOrder/entity");
      const count = await MeasurementOrder.countDocuments({
        "templates.sampleImageUrls": imageUrl,
      }).exec();
      return count > 0;
    } catch (error: any) {
      logger.error("Failed to check measurement order usage", error, { imageUrl });
      return true; // Fail-safe: assume in use
    }
  }
}

export const imageUploadService = new ImageUploadService();













































