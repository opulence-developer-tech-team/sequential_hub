import {
  IAddProductInput,
  IEditProductInput,
  IEditProductUserInput,
} from "./interface";
import Product from "./entity";
import { Types } from "mongoose";
import { imageUploadService } from "../imageUpload/service";
import cloudinary from "../config/cloudnary";
import { logger } from "../utils/logger";

class ProductService {
  public async addProducts(input: IAddProductInput) {
    const product = new Product({ ...input });

    const savedProduct = await product.save();

    return savedProduct;
  }

  public async fetchProducts(
    page: number = 1,
    limit: number = 10,
    filters?: {
      searchTerm?: string;
      category?: string;
      featured?: boolean;
      inStock?: boolean;
      size?: string;
      minPrice?: number;
      maxPrice?: number;
    },
    sortBy: string = 'name'
  ) {
    const skip = (page - 1) * limit;

    // Build query filter
    const queryFilter: any = {};

    // Search filter - search in name and description
    if (filters?.searchTerm && filters.searchTerm.trim()) {
      const searchRegex = new RegExp(filters.searchTerm.trim(), "i");
      queryFilter.$or = [
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    // Category filter
    if (filters?.category && filters.category.trim()) {
      queryFilter.category = filters.category;
    }

    // Featured filter
    if (filters?.featured !== undefined) {
      queryFilter.isFeatured = filters.featured;
    }

    // In stock filter - check if any variant is in stock
    if (filters?.inStock !== undefined) {
      queryFilter["productVariant.inStock"] = filters.inStock;
    }

    // Size filter - check if any variant has the specified size
    if (filters?.size && filters.size.trim()) {
      queryFilter["productVariant.size"] = filters.size.trim();
    }

    // Price range filter - check if any variant price falls within range
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      queryFilter["productVariant.price"] = {};
      if (filters.minPrice !== undefined) {
        queryFilter["productVariant.price"].$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        queryFilter["productVariant.price"].$lte = filters.maxPrice;
      }
    }

    // Build sort object based on sortBy parameter
    // Note: For price sorting, we'll sort by minimum variant price
    let sortObject: any = { createdAt: -1 }; // Default sort
    switch (sortBy) {
      case 'name':
        sortObject = { name: 1 };
        break;
      case 'price-low':
        // Sort by minimum price in variants (requires aggregation or post-processing)
        sortObject = { name: 1 }; // Fallback to name sort, will handle in post-processing
        break;
      case 'price-high':
        // Sort by maximum price in variants (requires aggregation or post-processing)
        sortObject = { name: 1 }; // Fallback to name sort, will handle in post-processing
        break;
      default:
        sortObject = { name: 1 };
    }

    // Execute queries with filters and sorting
    let products = await Product.find(queryFilter)
      .skip(skip)
      .limit(limit)
      .sort(sortObject)
      .lean();

    // Handle price-based sorting (requires post-processing since price is in variants)
    if (sortBy === 'price-low' || sortBy === 'price-high') {
      products = products.sort((a: any, b: any) => {
        const aMinPrice = a.productVariant?.length > 0
          ? Math.min(...a.productVariant.map((v: any) => v.price || Infinity))
          : Infinity;
        const bMinPrice = b.productVariant?.length > 0
          ? Math.min(...b.productVariant.map((v: any) => v.price || Infinity))
          : Infinity;
        
        if (sortBy === 'price-low') {
          return aMinPrice - bMinPrice;
        } else {
          return bMinPrice - aMinPrice;
        }
      });
    }

    const total = await Product.countDocuments(queryFilter);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  public async findProductBySlug(slug: string) {
    return await Product.findOne({ slug });
  }

  public async updateProductImage(
    productId: string,
    oldImageUrl: string,
    newImageUrl: string,
    newColor: string
  ) {
    // Find product by slug (productId is the slug)
    const product = await Product.findOne({ slug: productId });

    if (!product) {
      return null;
    }

    // Update ALL variants that use the old image URL in their imageUrls array
    // This ensures all variants with the same image are updated when replacing
    let hasUpdates = false;
    product.productVariant = product.productVariant.map((variant) => {
      // Handle both new imageUrls array and old imageUrl field for backward compatibility
      const variantAny = variant as any
      const imageUrls = Array.isArray(variant.imageUrls)
        ? variant.imageUrls
        : (variantAny.imageUrl ? [variantAny.imageUrl] : [])
      const hasOldImage = imageUrls.includes(oldImageUrl);
      
      if (hasOldImage) {
        hasUpdates = true;
        // Replace the old image URL with the new one in the array
        const updatedImageUrls = imageUrls.map(url => url === oldImageUrl ? newImageUrl : url);
        // Preserve other variant properties (size, quantity, price, discountPrice, inStock)
        return {
          ...variant,
          imageUrls: updatedImageUrls,
          color: newColor,
        };
      }
      return variant;
    });

    // If no variants were updated, return null
    if (!hasUpdates) {
      return null;
    }

    // Save the updated product
    const updatedProduct = await product.save();

    return updatedProduct;
  }

  public async editProductById(input: IEditProductInput) {
    const { productId, productVariant, ...updateData } = input;

    // IMPORTANT:
    // productVariant updates replace the whole array. If we don't explicitly preserve
    // `reservedQuantity` for existing variants, admin edits can accidentally wipe
    // active checkout reservations and cause overselling.
    const existingProduct = await Product.findById(productId)
      .select("productVariant._id productVariant.reservedQuantity")
      .lean();

    const reservedByVariantId = new Map<string, number>();
    if (existingProduct?.productVariant && Array.isArray(existingProduct.productVariant)) {
      for (const v of existingProduct.productVariant as any[]) {
        const id = v?._id?.toString?.();
        if (!id) continue;
        const rq =
          typeof v.reservedQuantity === "number" && !Number.isNaN(v.reservedQuantity) && v.reservedQuantity >= 0
            ? v.reservedQuantity
            : 0;
        reservedByVariantId.set(id, rq);
      }
    }

    // Process productVariant to ensure _id fields are properly handled
    // Convert string _id to ObjectId if present, or let Mongoose generate new ones
    const processedVariants = productVariant.map((variant: any) => {
      // Handle both new imageUrls array and old imageUrl field for backward compatibility
      const imageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
        ? variant.imageUrls
        : (variant.imageUrl ? [variant.imageUrl] : []);
      
      const processedVariant: any = {
        imageUrls: imageUrls,
        color: variant.color,
        size: variant.size,
        quantity: variant.quantity,
        // Preserve existing reservedQuantity for variants that already exist
        // (new variants default to 0)
        reservedQuantity: (() => {
          const id =
            variant._id && typeof variant._id === "object" && typeof variant._id.toString === "function"
              ? variant._id.toString()
              : typeof variant._id === "string"
                ? variant._id
                : undefined;
          return id ? (reservedByVariantId.get(id) ?? 0) : 0;
        })(),
        price: variant.price,
        discountPrice: variant.discountPrice,
        inStock: variant.inStock,
      };

      // Preserve measurements exactly as sent from the validated input
      if (variant.measurements && typeof variant.measurements === 'object') {
        processedVariant.measurements = {
          neck: variant.measurements.neck,
          shoulder: variant.measurements.shoulder,
          chest: variant.measurements.chest,
          shortSleeve: variant.measurements.shortSleeve,
          longSleeve: variant.measurements.longSleeve,
          roundSleeve: variant.measurements.roundSleeve,
          tummy: variant.measurements.tummy,
          topLength: variant.measurements.topLength,
          waist: variant.measurements.waist,
          laps: variant.measurements.laps,
          kneelLength: variant.measurements.kneelLength,
          roundKneel: variant.measurements.roundKneel,
          trouserLength: variant.measurements.trouserLength,
          quarterLength: variant.measurements.quarterLength,
          ankle: variant.measurements.ankle,
        };
      }

      // If _id exists and is valid, convert to ObjectId for Mongoose to match existing variants
      if (variant._id && Types.ObjectId.isValid(variant._id)) {
        processedVariant._id = new Types.ObjectId(variant._id);
      }

      return processedVariant;
    });

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId },
      { 
        $set: {
          ...updateData,
          productVariant: processedVariants,
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return null;
    }

    // Convert Mongoose document to plain object and ensure all ObjectId fields are converted to strings
    // This ensures that all variant _id fields (including newly generated ones) are properly serialized
    // Use toObject() with getters: true to ensure _id fields are included
    const productObj: any = updatedProduct.toObject({ getters: true, virtuals: false });
    
    // Manually convert all variant _id fields from ObjectId to string
    // This is necessary because toObject() might not always convert nested ObjectIds properly
    if (productObj.productVariant && Array.isArray(productObj.productVariant)) {
      productObj.productVariant = productObj.productVariant.map((variant: any, index: number) => {
        // Create a new plain object to ensure no Mongoose artifacts remain
        // Handle both new imageUrls array and old imageUrl field for backward compatibility
        const imageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
          ? variant.imageUrls
          : (variant.imageUrl ? [variant.imageUrl] : []);
        
        const plainVariant: any = {
          imageUrls: imageUrls,
          color: variant.color,
          size: variant.size,
          quantity: variant.quantity,
          reservedQuantity:
            typeof variant.reservedQuantity === "number" &&
            !Number.isNaN(variant.reservedQuantity) &&
            variant.reservedQuantity >= 0
              ? variant.reservedQuantity
              : 0,
          price: variant.price,
          discountPrice: variant.discountPrice,
          inStock: variant.inStock,
        };

        // Preserve measurements on the response so the frontend / Redux
        // always receives the full measurements object after an edit
        if (variant.measurements && typeof variant.measurements === 'object') {
          plainVariant.measurements = {
            neck: variant.measurements.neck,
            shoulder: variant.measurements.shoulder,
            chest: variant.measurements.chest,
            shortSleeve: variant.measurements.shortSleeve,
            longSleeve: variant.measurements.longSleeve,
            roundSleeve: variant.measurements.roundSleeve,
            tummy: variant.measurements.tummy,
            topLength: variant.measurements.topLength,
            waist: variant.measurements.waist,
            laps: variant.measurements.laps,
            kneelLength: variant.measurements.kneelLength,
            roundKneel: variant.measurements.roundKneel,
            trouserLength: variant.measurements.trouserLength,
            ankle: variant.measurements.ankle,
          };
        }
        
        // Explicitly convert _id to string if it exists
        if (variant._id) {
          if (typeof variant._id === 'object' && variant._id.toString) {
            plainVariant._id = variant._id.toString();
          } else if (typeof variant._id === 'string') {
            plainVariant._id = variant._id;
          } else {
            plainVariant._id = String(variant._id);
          }
        } else {
          // Log warning if _id is missing (shouldn't happen for saved variants)
          logger.warn(`Variant at index ${index} is missing _id field`, {
            variant,
            productId: productId.toString(),
          });
        }
        
        return plainVariant;
      });
    }
    
    // Ensure the main product _id is also a string
    if (productObj._id && typeof productObj._id === 'object' && productObj._id.toString) {
      (productObj as any)._id = productObj._id.toString();
    }
    
    return productObj;
  }

  public async deleteProductById(productId: Types.ObjectId) {
    // First, find the product to get its images
    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return null;
    }

    // Extract all image URLs from all variants (flatten imageUrls arrays)
    const imageUrls = product.productVariant.flatMap((variant: any) => {
      // Handle both new imageUrls array and old imageUrl field for backward compatibility
      return Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
        ? variant.imageUrls
        : (variant.imageUrl ? [variant.imageUrl] : []);
    });

    // Delete all images from Cloudinary in parallel for better performance
    if (imageUrls.length > 0) {
      try {
        // Create delete promises for all images
        const deletePromises = imageUrls.map(async (imageUrl) => {
          try {
            // Get publicId from database first (more reliable)
            const imageMetadata = await imageUploadService.findImageByUrl(imageUrl);
            let publicId: string | null = null;

            if (imageMetadata && imageMetadata.publicId) {
              publicId = imageMetadata.publicId;
              logger.info("Using publicId from database for product deletion", {
                imageUrl,
                publicId,
                productId: productId.toString(),
              });
            } else {
              // Fallback: try to extract publicId from URL
              publicId = imageUploadService.extractPublicIdFromUrl(imageUrl);
              if (publicId) {
                logger.info("Extracted publicId from URL for product deletion", {
                  imageUrl,
                  publicId,
                  productId: productId.toString(),
                });
              }
            }

            if (publicId) {
              // Delete from Cloudinary
              const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image',
                invalidate: true, // Invalidate CDN cache
              });

              logger.info("Cloudinary destroy result during product deletion", {
                imageUrl,
                publicId,
                result: result.result,
                productId: productId.toString(),
              });
            } else {
              // If we can't get publicId, log warning
              logger.warn("Could not extract publicId for image during product deletion", {
                imageUrl,
                productId: productId.toString(),
              });
            }

            // Delete metadata from database (always attempt, even if Cloudinary deletion failed)
            await imageUploadService.deleteImageMetadata(imageUrl);
            
            return { success: true, imageUrl };
          } catch (error: any) {
            // Log error but don't throw - we want to continue with other images
            logger.error("Failed to delete image during product deletion", error, {
              imageUrl,
              productId: productId.toString(),
            });
            
            // Still try to delete metadata even if Cloudinary deletion failed
            try {
              await imageUploadService.deleteImageMetadata(imageUrl);
            } catch (metadataError: any) {
              logger.error("Failed to delete image metadata during product deletion", metadataError, {
                imageUrl,
                productId: productId.toString(),
              });
            }
            
            return { success: false, imageUrl, error: error.message };
          }
        });

        // Wait for all deletions to complete (using allSettled to handle partial failures)
        const results = await Promise.allSettled(deletePromises);
        
        // Log summary of deletion results
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        logger.info("Image deletion summary for product", {
          productId: productId.toString(),
          totalImages: imageUrls.length,
          successful,
          failed,
        });

        if (failed > 0) {
          logger.warn("Some images failed to delete during product deletion", {
            productId: productId.toString(),
            failed,
            total: imageUrls.length,
          });
        }
      } catch (error: any) {
        // Log error but continue with product deletion
        // (Images may have been partially deleted, but we still want to delete the product)
        logger.error("Failed to delete images during product deletion", error, {
          productId: productId.toString(),
        });
      }
    }

    // Delete the product from database
    const deletedProduct = await Product.findOneAndDelete({ _id: productId });

    logger.info("Product deleted successfully", {
      productId: productId.toString(),
      productName: product.name,
      imagesDeleted: imageUrls.length,
    });

    return deletedProduct;
  }

  public async deleteProductVariant(
    productId: Types.ObjectId,
    variantId: Types.ObjectId
  ) {
    // Find the product
    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return null;
    }

    // Check if product has more than one variant (at least one variant is required)
    if (product.productVariant.length <= 1) {
      throw new Error("Cannot delete the last variant. At least one variant is required.");
    }

    // Find the variant index
    const variantIndex = product.productVariant.findIndex(
      (variant: any) => variant._id && variant._id.toString() === variantId.toString()
    );

    if (variantIndex === -1) {
      return null; // Variant not found
    }

    // Get the variant to extract image URLs for cleanup
    const variantToDelete = product.productVariant[variantIndex];
    // Handle both new imageUrls array and old imageUrl field for backward compatibility
    const imageUrlsToDelete = Array.isArray(variantToDelete?.imageUrls) && variantToDelete.imageUrls.length > 0
      ? variantToDelete.imageUrls
      : (((variantToDelete as any)?.imageUrl as string | undefined) ? [((variantToDelete as any).imageUrl as string)] : []);

    // Remove the variant from the array
    product.productVariant.splice(variantIndex, 1);

    // Save the updated product
    const updatedProduct = await product.save();

    // Check if each image is still used by other variants in this product
    // Only delete from Cloudinary if it's not used by any remaining variants
    if (imageUrlsToDelete.length > 0) {
      // For each image URL, check if it's still used by other variants
      for (const imageUrl of imageUrlsToDelete) {
        const isImageStillUsed = updatedProduct.productVariant.some((variant: any) => {
          const variantImageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
            ? variant.imageUrls
            : (variant.imageUrl ? [variant.imageUrl] : []);
          return variantImageUrls.includes(imageUrl);
        });

      // If image is not used by any remaining variants, delete it from Cloudinary
      if (!isImageStillUsed) {
        try {
          // Get publicId from database first (more reliable)
          const imageMetadata = await imageUploadService.findImageByUrl(imageUrl);
          let publicId: string | null = null;

          if (imageMetadata && imageMetadata.publicId) {
            publicId = imageMetadata.publicId;
            logger.info("Using publicId from database for variant image deletion", {
              imageUrl,
              publicId,
              productId: productId.toString(),
              variantId: variantId.toString(),
            });
          } else {
            // Fallback: try to extract publicId from URL
            publicId = imageUploadService.extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              logger.info("Extracted publicId from URL for variant image deletion", {
                imageUrl,
                publicId,
                productId: productId.toString(),
                variantId: variantId.toString(),
              });
            }
          }

          if (publicId) {
            // Delete from Cloudinary
            const result = await cloudinary.uploader.destroy(publicId, {
              resource_type: 'image',
              invalidate: true, // Invalidate CDN cache
            });

            logger.info("Cloudinary destroy result during variant deletion", {
              imageUrl,
              publicId,
              result: result.result,
              productId: productId.toString(),
              variantId: variantId.toString(),
            });
          } else {
            // If we can't get publicId, log warning
            logger.warn("Could not extract publicId for image during variant deletion", {
              imageUrl,
              productId: productId.toString(),
              variantId: variantId.toString(),
            });
          }

          // Delete metadata from UploadedImage collection (always attempt, even if Cloudinary deletion failed)
          await imageUploadService.deleteImageMetadata(imageUrl);
          
          logger.info("Variant image deleted from Cloudinary and UploadedImage collection", {
            imageUrl,
            productId: productId.toString(),
            variantId: variantId.toString(),
          });
        } catch (error: any) {
          // Log error but don't throw - we want to continue even if image deletion fails
          // The variant has already been deleted from the product
          logger.error("Failed to delete image during variant deletion", error, {
            imageUrl,
            productId: productId.toString(),
            variantId: variantId.toString(),
          });
          
          // Still try to delete metadata from UploadedImage collection even if Cloudinary deletion failed
          try {
            await imageUploadService.deleteImageMetadata(imageUrl);
          } catch (metadataError: any) {
            logger.error("Failed to delete image metadata from UploadedImage collection during variant deletion", metadataError, {
              imageUrl,
              productId: productId.toString(),
              variantId: variantId.toString(),
            });
          }
        }
      } else {
        logger.info("Image still in use by other variants, skipping deletion", {
          imageUrl,
          productId: productId.toString(),
          variantId: variantId.toString(),
        });
      }
      } // Close for loop
    }

    logger.info("Product variant deleted successfully", {
      productId: productId.toString(),
      variantId: variantId.toString(),
      remainingVariants: updatedProduct.productVariant.length,
      imagesDeleted: imageUrlsToDelete.length,
    });

    // Convert to plain object and ensure all ObjectId fields are converted to strings
    const productObj = updatedProduct.toObject();
    
    // Manually convert all variant _id fields from ObjectId to string
    if (productObj.productVariant && Array.isArray(productObj.productVariant)) {
      productObj.productVariant = productObj.productVariant.map((variant: any) => {
        if (variant._id) {
          // Convert ObjectId to string if it's an ObjectId instance
          variant._id = variant._id.toString ? variant._id.toString() : String(variant._id);
        }
        return variant;
      });
    }
    
    return productObj;
  }
}

export const productService = new ProductService();
