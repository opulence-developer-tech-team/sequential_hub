import { Types } from "mongoose";
import Product from "../products/entity";
import { ICartUserInput, ICartItemResponse, ICartCalculationResponse } from "./interface";
import { logger } from "../utils/logger";

// In-memory cache for product hash mappings (consider Redis for production)
// Cache structure: Map<productIdHash, Array<{ productId: string, variants: Map<variantIdHash, Array<variantId>> }>>
// Using arrays to handle hash collisions - if multiple products hash to same number, store all
const productHashCache = new Map<
  number,
  Array<{ productId: string; variants: Map<number, string[]> }>
>();

// Cache TTL: 5 minutes (300000ms)
const CACHE_TTL = 5 * 60 * 1000;
let cacheExpiry = Date.now() + CACHE_TTL;

// Mutex for cache building to prevent race conditions
let cacheBuildingPromise: Promise<void> | null = null;

class CartService {
  /**
   * Hash function to match the frontend's stringIdToNumber
   */
  private hashStringToNumber(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Build and cache product hash mappings
   * This is called once and cached to avoid repeated database queries
   * Includes collision detection and race condition prevention
   */
  private async buildProductHashCache(): Promise<void> {
    // Check if cache is still valid
    if (Date.now() < cacheExpiry && productHashCache.size > 0) {
      return;
    }

    // If cache is already being built, wait for that promise
    if (cacheBuildingPromise) {
      return cacheBuildingPromise;
    }

    // Create a new cache building promise
    cacheBuildingPromise = (async () => {
      try {
        // Double-check after acquiring lock (double-checked locking pattern)
        if (Date.now() < cacheExpiry && productHashCache.size > 0) {
          return;
        }

        // Clear existing cache
        productHashCache.clear();

        // Fetch all products with only necessary fields
        const products = await Product.find({})
          .select("_id productVariant._id")
          .lean();

        // Track hash collisions for monitoring
        const hashCollisions: Array<{ hash: number; productIds: string[] }> = [];
        const hashToProductIds = new Map<number, string[]>();

        // Build hash mappings with proper collision handling
        for (const product of products) {
          const productId = product._id.toString();
          const productHash = this.hashStringToNumber(productId);

          // Track potential collisions
          if (!hashToProductIds.has(productHash)) {
            hashToProductIds.set(productHash, []);
          }
          hashToProductIds.get(productHash)!.push(productId);

          // Build variant mappings with collision handling
          const variants = new Map<number, string[]>();

          if (product.productVariant && Array.isArray(product.productVariant)) {
            for (const variant of product.productVariant) {
              const variantId = (variant as any)._id?.toString();
              if (variantId) {
                const variantHash = this.hashStringToNumber(variantId);
                
                // Store all variant IDs that hash to the same number
                if (!variants.has(variantHash)) {
                  variants.set(variantHash, []);
                }
                variants.get(variantHash)!.push(variantId);
              }
            }
          }

          // Store product - handle collisions by storing all products with same hash
          if (!productHashCache.has(productHash)) {
            productHashCache.set(productHash, []);
          }
          productHashCache.get(productHash)!.push({ productId, variants });
        }

        // Log collisions for monitoring
        for (const [hash, productIds] of hashToProductIds.entries()) {
          if (productIds.length > 1) {
            hashCollisions.push({ hash, productIds });
          }
        }

        if (hashCollisions.length > 0) {
          logger.warn("Hash collisions detected in product cache", {
            collisionCount: hashCollisions.length,
            collisions: hashCollisions.slice(0, 10), // Log first 10 collisions
          });
        }

        // Update cache expiry
        cacheExpiry = Date.now() + CACHE_TTL;

        logger.info("Product hash cache built", {
          productCount: productHashCache.size,
          totalProducts: products.length,
          collisionCount: hashCollisions.length,
        });
      } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error("Error building product hash cache", err);
        throw error;
      } finally {
        // Clear the building promise
        cacheBuildingPromise = null;
      }
    })();

    return cacheBuildingPromise;
  }

  /**
   * Find product and variant IDs by hashed IDs using cache
   * Properly handles hash collisions by checking all products with the same hash
   */
  private async findProductAndVariantIdsByHash(
    productIdHash: number,
    variantIdHash: number
  ): Promise<{ productId: string; variantId: string } | null> {
    // Ensure cache is built
    await this.buildProductHashCache();

    const productMappings = productHashCache.get(productIdHash);
    if (!productMappings || productMappings.length === 0) {
      return null;
    }

    // If there are multiple products with the same hash (collision), we need to check all of them
    // by re-hashing their actual IDs to find the correct match
    for (const productMapping of productMappings) {
      // Validate: Re-hash the actual productId to see if it matches the requested hash
      const actualProductHash = this.hashStringToNumber(productMapping.productId);
      if (actualProductHash !== productIdHash) {
        // This shouldn't happen, but log if it does
        logger.warn("Product hash mismatch in cache", {
          expectedHash: productIdHash,
          actualHash: actualProductHash,
          productId: productMapping.productId,
        });
        continue;
      }

      // Check variants for this product
      const variantIds = productMapping.variants.get(variantIdHash);
      if (!variantIds || variantIds.length === 0) {
        continue;
      }

      // If there are multiple variants with the same hash (collision), check all of them
      for (const variantId of variantIds) {
        const actualVariantHash = this.hashStringToNumber(variantId);
        if (actualVariantHash === variantIdHash) {
          // Found a match! Return it
          return {
            productId: productMapping.productId,
            variantId,
          };
        }
      }
    }

    // No match found
    return null;
  }

  /**
   * Batch fetch products and variants by their ObjectIds
   * This is much more efficient than fetching all products
   */
  private async fetchProductsAndVariants(
    productVariantIds: Array<{ productId: string; variantId: string }>
  ): Promise<
    Map<
      string,
      { product: any; variant: any }
    >
  > {
    try {
      if (productVariantIds.length === 0) {
        return new Map();
      }

      // Extract unique product IDs
      const uniqueProductIds = [
        ...new Set(productVariantIds.map((p) => p.productId)),
      ].map((id) => {
        try {
          return new Types.ObjectId(id);
        } catch (error) {
          logger.warn("Invalid product ID format", { productId: id });
          return null;
        }
      }).filter((id): id is Types.ObjectId => id !== null);

      if (uniqueProductIds.length === 0) {
        return new Map();
      }

      // Fetch only the products we need using $in query
      const products = await Product.find({
        _id: { $in: uniqueProductIds },
      }).lean();

      // Build a map for quick lookup
      const resultMap = new Map<
        string,
        { product: any; variant: any }
      >();

      for (const { productId, variantId } of productVariantIds) {
        const product = products.find(
          (p) => {
            const productIdStr = p._id?.toString() || '';
            return productIdStr === productId;
          }
        );

        if (!product) {
          logger.warn("Product not found", { 
            productId, 
            foundProductIds: products.map(p => p._id?.toString()) 
          });
          continue;
        }

        const variant = (product.productVariant as any[])?.find(
          (v: any) => {
            if (!v._id) return false;
            // Handle both ObjectId and string formats
            const variantIdStr = typeof v._id === 'string' ? v._id : v._id.toString();
            return variantIdStr === variantId;
          }
        );

        if (!variant) {
          logger.warn("Variant not found in product", { 
            productId, 
            variantId,
            productVariants: (product.productVariant as any[])?.map((v: any) => ({
              _id: v._id?.toString(),
              color: v.color,
              size: v.size
            }))
          });
          continue;
        }

        // Use composite key for lookup
        const key = `${productId}-${variantId}`;
        resultMap.set(key, { product, variant });
      }

      return resultMap;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching products and variants", err);
      return new Map();
    }
  }

  /**
   * Calculate cart totals and return detailed cart information
   * Production-ready with caching, batch processing, and collision detection
   * @param cartItems - Array of cart items
   * @param shippingLocation - Optional shipping location to calculate shipping fee
   * @param freeShippingThreshold - Optional free shipping threshold (if subtotal exceeds this, shipping is free)
   * @param locationFees - Optional array of location fees to lookup shipping cost
   */
  public async calculateCart(
    cartItems: ICartUserInput[],
    shippingLocation?: string,
    freeShippingThreshold?: number,
    locationFees?: Array<{ location: string; fee: number }>
  ): Promise<ICartCalculationResponse | null> {
    try {
      if (!cartItems || cartItems.length === 0) {
        return {
          items: [],
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
        };
      }

      // Step 1: Validate and prepare product/variant IDs (now using string ObjectIds directly)
      const productVariantIds: Array<{
        productId: string;
        variantId: string;
        originalItem: ICartUserInput;
      }> = [];

      // Validate ObjectId format and prepare for batch fetch
      for (const item of cartItems) {
        // Validate ObjectId format (24 hex characters)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(item.productId) && /^[0-9a-fA-F]{24}$/.test(item.variantId);
        
        if (!isValidObjectId) {
          logger.warn("Invalid ObjectId format in cart item", {
            productId: item.productId,
            variantId: item.variantId,
          });
          continue;
        }

        productVariantIds.push({
          productId: item.productId,
          variantId: item.variantId,
          originalItem: item,
        });
      }

      if (productVariantIds.length === 0) {
        return {
          items: [],
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
        };
      }

      // Step 2: Batch fetch all products and variants in a single query
      const productVariantMap = await this.fetchProductsAndVariants(
        productVariantIds.map(({ productId, variantId }) => ({
          productId,
          variantId,
        }))
      );

      // Step 3: Build cart item responses
      const cartItemResponses: ICartItemResponse[] = [];
      let subtotal = 0;

      for (const { productId, variantId, originalItem } of productVariantIds) {
        const key = `${productId}-${variantId}`;
        const productVariantData = productVariantMap.get(key);

        if (!productVariantData) {
          logger.warn("Product variant data not found after fetch", {
            productId,
            variantId,
          });
          continue;
        }

        const { product, variant } = productVariantData;

        // Validate variant data
        if (!variant || !product) {
          logger.warn("Invalid product or variant data", {
            productId,
            variantId,
            hasProduct: !!product,
            hasVariant: !!variant,
          });
          continue;
        }

        // Validate required product fields
        if (
          !product._id ||
          !product.name ||
          !product.slug ||
          product.description === undefined ||
          !product.category
        ) {
          logger.warn("Missing required product fields", {
            productId,
            variantId,
            hasId: !!product._id,
            hasName: !!product.name,
            hasSlug: !!product.slug,
            hasDescription: product.description !== undefined,
            hasCategory: !!product.category,
          });
          continue;
        }

        // Validate required variant fields
        // Check for imageUrls (new) or imageUrl (backward compatibility)
        const hasImages = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0 
          || (variant.imageUrl && typeof variant.imageUrl === 'string' && variant.imageUrl.trim().length > 0);
        
        if (
          !variant._id ||
          variant.price === undefined ||
          variant.price === null ||
          isNaN(Number(variant.price)) ||
          variant.price < 0 ||
          variant.discountPrice === undefined ||
          variant.discountPrice === null ||
          isNaN(Number(variant.discountPrice)) ||
          variant.discountPrice < 0 ||
          variant.quantity === undefined ||
          variant.quantity === null ||
          isNaN(Number(variant.quantity)) ||
          variant.quantity < 0 ||
          variant.inStock === undefined ||
          variant.inStock === null ||
          !hasImages ||
          !variant.color ||
          !variant.size
        ) {
          logger.warn("Missing or invalid variant fields", {
            productId,
            variantId,
            hasId: !!variant._id,
            price: variant.price,
            discountPrice: variant.discountPrice,
            quantity: variant.quantity,
            inStock: variant.inStock,
            hasImages,
            imageUrls: variant.imageUrls,
            imageUrl: variant.imageUrl,
            hasColor: !!variant.color,
            hasSize: !!variant.size,
          });
          continue;
        }

        // Normalize numeric values to ensure they're valid numbers
        const variantPrice = Number(variant.price);
        const variantDiscountPrice = Number(variant.discountPrice);
        const variantQuantity = Number(variant.quantity);
        const itemQuantity = Number(originalItem.quantity);

        // Validate normalized values
        if (
          isNaN(variantPrice) ||
          variantPrice < 0 ||
          isNaN(variantDiscountPrice) ||
          variantDiscountPrice < 0 ||
          isNaN(variantQuantity) ||
          variantQuantity < 0 ||
          isNaN(itemQuantity) ||
          itemQuantity <= 0
        ) {
          logger.warn("Invalid numeric values after normalization", {
            productId,
            variantId,
            variantPrice,
            variantDiscountPrice,
            variantQuantity,
            itemQuantity,
          });
          continue;
        }

        // Use discount price if available and valid, otherwise use regular price
        // Discount price is valid if it's greater than 0 and less than regular price
        const effectivePrice =
          variantDiscountPrice > 0 && variantDiscountPrice < variantPrice
            ? variantDiscountPrice
            : variantPrice;

        // Calculate item totals
        const itemSubtotal = variantPrice * itemQuantity;
        const itemTotal = effectivePrice * itemQuantity;
        subtotal += itemTotal;

        // Build cart item response
        const cartItemResponse: ICartItemResponse = {
          productId: product._id.toString(),
          variantId: variant._id.toString(),
          productName: String(product.name || ""),
          productSlug: String(product.slug || ""),
          productDescription: String(product.description || ""),
          productCategory: String(product.category || ""),
          variantImageUrls: Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0 
            ? variant.imageUrls.map((url: unknown) => String(url || ""))
            : (variant.imageUrl ? [String(variant.imageUrl)] : []), // Backward compatibility fallback
          variantColor: String(variant.color || ""),
          variantSize: String(variant.size || ""),
          variantPrice: variantPrice,
          variantDiscountPrice: variantDiscountPrice,
          quantity: itemQuantity,
          itemSubtotal, // Subtotal before discount
          itemTotal, // Total after discount
          inStock: Boolean(variant.inStock),
          availableQuantity: variantQuantity,
          measurements: variant.measurements
            ? {
                neck: typeof variant.measurements.neck === 'number' ? variant.measurements.neck : undefined,
                shoulder: typeof variant.measurements.shoulder === 'number' ? variant.measurements.shoulder : undefined,
                chest: typeof variant.measurements.chest === 'number' ? variant.measurements.chest : undefined,
                shortSleeve: typeof variant.measurements.shortSleeve === 'number' ? variant.measurements.shortSleeve : undefined,
                longSleeve: typeof variant.measurements.longSleeve === 'number' ? variant.measurements.longSleeve : undefined,
                roundSleeve: typeof variant.measurements.roundSleeve === 'number' ? variant.measurements.roundSleeve : undefined,
                tummy: typeof variant.measurements.tummy === 'number' ? variant.measurements.tummy : undefined,
                topLength: typeof variant.measurements.topLength === 'number' ? variant.measurements.topLength : undefined,
                waist: typeof variant.measurements.waist === 'number' ? variant.measurements.waist : undefined,
                laps: typeof variant.measurements.laps === 'number' ? variant.measurements.laps : undefined,
                kneelLength: typeof variant.measurements.kneelLength === 'number' ? variant.measurements.kneelLength : undefined,
                roundKneel: typeof variant.measurements.roundKneel === 'number' ? variant.measurements.roundKneel : undefined,
                trouserLength: typeof variant.measurements.trouserLength === 'number' ? variant.measurements.trouserLength : undefined,
                ankle: typeof variant.measurements.ankle === 'number' ? variant.measurements.ankle : undefined,
              }
            : undefined,
        };

        cartItemResponses.push(cartItemResponse);
      }

      // Calculate shipping based on location and free shipping threshold
      // Ensure subtotal is a valid number before comparison
      const validSubtotal = isNaN(subtotal) || subtotal < 0 ? 0 : subtotal;
      
      let shipping = 0;
      
      // First, check if subtotal meets free shipping threshold
      // Shipping is ONLY free if subtotal >= freeShippingThreshold
      if (freeShippingThreshold !== undefined && validSubtotal >= freeShippingThreshold) {
        // Subtotal meets or exceeds threshold - shipping is free
        shipping = 0;
      } else if (shippingLocation && locationFees && locationFees.length > 0) {
        // Subtotal < threshold, calculate shipping based on selected location
        const locationFee = locationFees.find(lf => lf.location === shippingLocation);
        if (locationFee) {
          shipping = locationFee.fee;
        }
        // If location not found in fees, shipping remains 0 (shouldn't happen with validation)
      }
      // If subtotal < threshold and no location provided, shipping remains 0
      // This is acceptable as location selection will be required before checkout
      // The UI will check the threshold to determine if shipping is actually free

      // Calculate tax (7.5% VAT rate for Nigeria)
      const tax = validSubtotal * 0.075;

      // Calculate total
      const total = validSubtotal + shipping + tax;

      // Round all monetary values to 2 decimal places to avoid floating point precision issues
      const roundedSubtotal = Math.round(validSubtotal * 100) / 100;
      const roundedShipping = Math.round(shipping * 100) / 100;
      const roundedTax = Math.round(tax * 100) / 100;
      const roundedTotal = Math.round(total * 100) / 100;

      return {
        items: cartItemResponses,
        subtotal: roundedSubtotal,
        shipping: roundedShipping,
        tax: roundedTax,
        total: roundedTotal,
        itemCount: cartItemResponses.length,
        freeShippingThreshold: freeShippingThreshold,
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error calculating cart", err, {
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Clear the product hash cache (useful for testing or manual cache invalidation)
   */
  public clearCache(): void {
    productHashCache.clear();
    cacheExpiry = 0;
    cacheBuildingPromise = null;
  }
}

export const cartService = new CartService();



