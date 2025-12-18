import { Product } from "@/types";
import { ProductSize } from "@/types/enum";
import { productService } from "@/lib/server/products/service";
import { connectDB } from "@/lib/server/utils/db";
import { logger } from "@/lib/server/utils/logger";

export interface GetProductsQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  category?: string;
  featured?: boolean;
  inStock?: boolean;
}

export interface GetProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Server-side function to fetch products directly from the service layer
 * This avoids HTTP overhead and is more efficient for server-side rendering
 * @param query - Query parameters for filtering and pagination
 * @returns Array of products or empty array on error
 */
export async function getProducts(
  query: GetProductsQueryParams = {}
): Promise<Product[]> {
  try {
    // Ensure database connection
    await connectDB();

    // Validate and sanitize input parameters
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const limit = Math.min(Math.max(1, Math.floor(query.limit ?? 10)), 100); // Max 100 items

    const filters: {
      searchTerm?: string;
      category?: string;
      featured?: boolean;
      inStock?: boolean;
    } = {};

    if (query.searchTerm && typeof query.searchTerm === 'string') {
      filters.searchTerm = query.searchTerm.trim();
    }

    if (query.category && typeof query.category === 'string') {
      filters.category = query.category.trim();
    }

    if (typeof query.featured === "boolean") {
      filters.featured = query.featured;
    }

    if (typeof query.inStock === "boolean") {
      filters.inStock = query.inStock;
    }

    const result = await productService.fetchProducts(page, limit, filters);

    if (!result?.products || !Array.isArray(result.products)) {
      logger.warn("Invalid products response from service", {
        hasResult: !!result,
        hasProducts: !!result?.products,
        isArray: Array.isArray(result?.products),
      });
      return [];
    }

    // Map API products to Product type with validation
    // Map to match the Product interface structure with productVariant array
    const mappedProducts: Product[] = result.products
      .filter((p: any) => p && p.slug && p.name) // Filter out invalid products
      .map((p: any) => {
        const variants = Array.isArray(p.productVariant) ? p.productVariant : []
        
        // Map variants to IProductVariant format, ensuring _id is included
        // Use null for invalid numeric values to indicate data issues
        // Handle both new imageUrls array and old imageUrl field for backward compatibility
        const productVariants = variants.map((v: any, index: number) => ({
          _id: v._id?.toString() || `variant-${index}`, // Ensure _id is a string
          imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length > 0
            ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
            : (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0 ? [v.imageUrl] : []),
          color: v.color || '',
          quantity:
            typeof v.quantity === "number" && !isNaN(v.quantity) && v.quantity >= 0
              ? v.quantity
              : null,
          price:
            typeof v.price === "number" && !isNaN(v.price) && v.price >= 0
              ? v.price
              : null,
          discountPrice:
            typeof v.discountPrice === "number" &&
            !isNaN(v.discountPrice) &&
            v.discountPrice >= 0
              ? v.discountPrice
              : null,
          size: (v.size || '') as ProductSize, // Cast to ProductSize enum
          inStock: typeof v.inStock === 'boolean' ? v.inStock : false,
        }))
        
        return {
          _id: p._id?.toString() || p.slug || '',
          adminId: p.adminId?.toString() || '',
          name: p.name || '',
          description: p.description || '',
          slug: p.slug || '',
          category: p.category || '',
          material: p.material || '',
          productVariant: productVariants,
          isFeatured: typeof p.isFeatured === 'boolean' ? p.isFeatured : false,
          createdAt: p.createdAt ? (typeof p.createdAt === 'string' ? new Date(p.createdAt) : p.createdAt) : undefined,
          updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? new Date(p.updatedAt) : p.updatedAt) : undefined,
        } as Product
      });

    logger.info("Products fetched successfully", {
      page,
      limit,
      totalFetched: mappedProducts.length,
      filters: {
        hasSearchTerm: !!filters.searchTerm,
        category: filters.category || null,
        featured: filters.featured ?? null,
        inStock: filters.inStock ?? null,
      },
    });

    return mappedProducts;
  } catch (err: any) {
    logger.error("Unexpected error fetching products", err, {
      query,
    });
    return [];
  }
}

/**
 * Server-side function to fetch featured products
 * @param limit - Number of featured products to fetch (default: 3)
 * @returns Array of featured products or empty array on error
 */
export async function getFeaturedProducts(limit: number = 3): Promise<Product[]> {
  return getProducts({ featured: true, limit, page: 1 });
}




