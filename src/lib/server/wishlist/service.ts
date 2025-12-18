import { Types } from "mongoose";
import Wishlist from "./entity";
import Product from "../products/entity";
import { IWishlistUserInput, IWishlistResponse } from "./interface";
import { logger } from "../utils/logger";

// Maximum number of products allowed in a wishlist (prevents abuse and performance issues)
const MAX_WISHLIST_SIZE = 1000;

class WishlistService {
  /**
   * Toggle wishlist item - add if not exists, remove if exists
   * Returns the operation type and the updated wishlist
   * @param retryCount Internal parameter to prevent infinite recursion on retries
   */
  public async toggleWishlist(
    userId: Types.ObjectId,
    productId: string,
    retryCount: number = 0
  ): Promise<{ operation: "added" | "removed"; wishlistItem: IWishlistResponse | null }> {
    try {
      // Validate productId is a valid ObjectId
      if (!Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID format");
      }

      const productObjectId = new Types.ObjectId(productId);

      // Check if product exists
      const product = await Product.findById(productObjectId).lean();
      if (!product) {
        throw new Error("Product not found");
      }

      // First, try to remove the product (if it exists)
      // This is more efficient than checking first, then removing/adding
      const removedWishlist = await Wishlist.findOneAndUpdate(
        { userId, productIds: productObjectId },
        { $pull: { productIds: productObjectId } },
        { new: true }
      ).lean();

      if (removedWishlist) {
        // Product was successfully removed
        logger.info("Product removed from wishlist", {
          userId: userId.toString(),
          productId,
          remainingItems: removedWishlist.productIds.length,
        });

        return {
          operation: "removed",
          wishlistItem: {
            _id: removedWishlist._id.toString(),
            productIds: removedWishlist.productIds.map((id: any) => id.toString()),
            userId: removedWishlist.userId.toString(),
            createdAt: removedWishlist.createdAt,
            updatedAt: removedWishlist.updatedAt,
          },
        };
      }

      // Product was not in wishlist, so we need to add it
      // First check if wishlist exists and get its size
      const existingWishlist = await Wishlist.findOne({ userId }).lean();

      if (existingWishlist) {
        // Check wishlist size limit before adding
        if (existingWishlist.productIds.length >= MAX_WISHLIST_SIZE) {
          throw new Error(
            `Wishlist size limit reached. Maximum ${MAX_WISHLIST_SIZE} products allowed.`
          );
        }
      }

      // Add product to wishlist (creates wishlist if it doesn't exist)
      // Use findOneAndUpdate with upsert for atomic operation
      const updatedWishlist = await Wishlist.findOneAndUpdate(
        { userId },
        { $addToSet: { productIds: productObjectId } }, // $addToSet prevents duplicates
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      if (!updatedWishlist) {
        throw new Error("Failed to update wishlist");
      }

      // Double-check size limit after update (handles race conditions)
      if (updatedWishlist.productIds.length > MAX_WISHLIST_SIZE) {
        // Rollback: remove the product we just added
        await Wishlist.findOneAndUpdate(
          { userId },
          { $pull: { productIds: productObjectId } }
        );
        throw new Error(
          `Wishlist size limit reached. Maximum ${MAX_WISHLIST_SIZE} products allowed.`
        );
      }

      logger.info("Product added to wishlist", {
        userId: userId.toString(),
        productId,
        wishlistId: updatedWishlist._id.toString(),
        totalItems: updatedWishlist.productIds.length,
        isNewWishlist: !existingWishlist,
      });

      // Populate the added product details for the response
      // We already fetched the product earlier, so use it
      const addedProduct = product;

      // Map product to IWishlistProduct format
      const wishlistProduct = {
        _id: addedProduct._id.toString(),
        name: addedProduct.name || "",
        slug: addedProduct.slug || "",
        description: addedProduct.description || "",
        category: addedProduct.category || "",
        productVariant: (addedProduct.productVariant || []).map((variant: any) => {
          // Handle migration: support both imageUrls array and old imageUrl field
          const imageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
            ? variant.imageUrls
            : (variant.imageUrl ? [variant.imageUrl] : [])
          
          return {
            _id: variant._id?.toString() || "",
            imageUrls: imageUrls,
            color: variant.color || "",
          size: variant.size || "",
          // Use null for invalid numeric values to indicate data issues
          quantity:
            variant.quantity != null &&
            typeof variant.quantity === "number" &&
            !isNaN(variant.quantity) &&
            variant.quantity >= 0
              ? variant.quantity
              : null,
          price:
            variant.price != null &&
            typeof variant.price === "number" &&
            !isNaN(variant.price) &&
            variant.price >= 0
              ? variant.price
              : null,
          discountPrice:
            variant.discountPrice != null &&
            typeof variant.discountPrice === "number" &&
            !isNaN(variant.discountPrice) &&
            variant.discountPrice >= 0
              ? variant.discountPrice
              : null,
          inStock: typeof variant.inStock === "boolean" ? variant.inStock : false,
          }
        }),
        isFeatured: addedProduct.isFeatured || false,
        createdAt: addedProduct.createdAt,
        updatedAt: addedProduct.updatedAt,
      };

      return {
        operation: "added",
        wishlistItem: {
          _id: updatedWishlist._id.toString(),
          productIds: updatedWishlist.productIds.map((id: any) => id.toString()),
          userId: updatedWishlist.userId.toString(),
          createdAt: updatedWishlist.createdAt,
          updatedAt: updatedWishlist.updatedAt,
          // Include the added product in the response
          addedProduct: wishlistProduct,
        },
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle MongoDB duplicate key error (race condition during wishlist creation)
      if ((error.code === 11000 || error.name === "MongoServerError") && retryCount < 1) {
        // Duplicate key error - wishlist was created by another request
        // Retry the operation once (max 1 retry to prevent infinite recursion)
        logger.warn("Duplicate key error detected, retrying wishlist operation", {
          userId: userId.toString(),
          productId,
          errorCode: error.code,
          retryCount: retryCount + 1,
        });
        
        // Small delay before retry to allow the other operation to complete
        await new Promise((resolve) => setTimeout(resolve, 50));
        
        // Retry the toggle operation with incremented retry count
        return this.toggleWishlist(userId, productId, retryCount + 1);
      }
      
      logger.error("Error toggling wishlist", err, {
        userId: userId.toString(),
        productId,
        errorCode: error.code,
        errorName: error.name,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get user's wishlist items with populated product details
   */
  public async getUserWishlist(
    userId: Types.ObjectId
  ): Promise<IWishlistResponse | null> {
    try {
      const wishlist = await Wishlist.findOne({ userId })
        .populate({
          path: "productIds",
          model: "Product",
          select: "name slug description category productVariant isFeatured createdAt updatedAt",
        })
        .lean();

      if (!wishlist) {
        return null;
      }

      // Map populated products to the response format
      // Filter out null/undefined products (deleted products that are still referenced)
      const validProducts: any[] = [];
      const invalidProductIds: string[] = [];

      (wishlist.productIds as any[]).forEach((item) => {
        if (item && typeof item === "object" && item._id) {
          validProducts.push(item);
        } else if (item && typeof item === "string") {
          // Product ID that couldn't be populated (product was deleted)
          invalidProductIds.push(item);
        }
      });

      // Log orphaned product references for monitoring
      if (invalidProductIds.length > 0) {
        logger.warn("Found orphaned product references in wishlist", {
          userId: userId.toString(),
          invalidProductIds,
          wishlistId: wishlist._id.toString(),
        });
      }

      const products = validProducts.map((product: any) => ({
        _id: product._id.toString(),
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        category: product.category || "",
        productVariant: (product.productVariant || []).map((variant: any) => {
          // Handle migration: support both imageUrls array and old imageUrl field
          const imageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
            ? variant.imageUrls
            : (variant.imageUrl ? [variant.imageUrl] : [])
          
          return {
            _id: variant._id?.toString() || "",
            imageUrls: imageUrls,
            color: variant.color || "",
          size: variant.size || "",
          // Use null for invalid/missing numeric values to indicate data issues
          // Explicitly check for null, undefined, NaN, and negative values
          quantity:
            variant.quantity != null &&
            typeof variant.quantity === "number" &&
            !isNaN(variant.quantity) &&
            variant.quantity >= 0
              ? variant.quantity
              : null,
          price:
            variant.price != null &&
            typeof variant.price === "number" &&
            !isNaN(variant.price) &&
            variant.price >= 0
              ? variant.price
              : null,
          discountPrice:
            variant.discountPrice != null &&
            typeof variant.discountPrice === "number" &&
            !isNaN(variant.discountPrice) &&
            variant.discountPrice >= 0
              ? variant.discountPrice
              : null,
          inStock: typeof variant.inStock === "boolean" ? variant.inStock : false,
          }
        }),
        isFeatured: product.isFeatured || false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      // Clean up orphaned product references (optional - can be done asynchronously)
      // For now, we just filter them out in the response

      // Return only valid product IDs (filter out orphaned references)
      const validProductIds = products.map((p) => p._id);

      return {
        _id: wishlist._id.toString(),
        productIds: validProductIds,
        products,
        userId: wishlist.userId.toString(),
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching user wishlist", err, {
        userId: userId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Check if a product is in user's wishlist
   */
  public async isProductInWishlist(
    userId: Types.ObjectId,
    productId: string
  ): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(productId)) {
        return false;
      }

      const productObjectId = new Types.ObjectId(productId);
      const wishlist = await Wishlist.findOne({
        userId,
        productIds: productObjectId,
      }).lean();

      return !!wishlist;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error checking wishlist status", err, {
        userId: userId.toString(),
        productId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }
}

export const wishlistService = new WishlistService();
