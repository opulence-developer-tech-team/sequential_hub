import { productController } from "@/lib/server/products/controller";
import { productValidator } from "@/lib/server/products/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { rateLimiter, RATE_LIMITS } from "@/lib/server/utils/rateLimiter";
import { logger } from "@/lib/server/utils/logger";
import { MessageResponse } from "@/lib/server/utils/enum";
import { NextResponse } from "next/server";

async function handler(request: Request): Promise<NextResponse> {
  try {
    await connectDB();

    // Rate limiting - use IP address for guest users
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitResult = rateLimiter.checkLimit(
      clientIp,
      RATE_LIMITS.FETCH.maxRequests,
      RATE_LIMITS.FETCH.windowMs
    );

    if (!rateLimitResult.allowed) {
      logger.warn("Rate limit exceeded for guest products fetch", {
        clientIp,
      });
      return utils.customResponse({
        status: 429,
        message: MessageResponse.Error,
        description: `Too many requests. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before trying again.`,
        data: {
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
      }) as NextResponse;
    }

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      searchTerm: url.searchParams.get('searchTerm') || undefined,
      category: url.searchParams.get('category') || undefined,
      featured: url.searchParams.get('featured') || undefined,
      inStock: url.searchParams.get('inStock') || undefined,
      size: url.searchParams.get('size') || undefined,
      minPrice: url.searchParams.get('minPrice') || undefined,
      maxPrice: url.searchParams.get('maxPrice') || undefined,
      sortBy: url.searchParams.get('sortBy') || undefined,
    };

    // Validate query parameters
    const validation = productValidator.fetchProducts(queryParams);
    if (!validation.valid) {
      return validation.response! as NextResponse;
    }

    // Parse and validate pagination parameters
    const page = parseInt(queryParams.page || '1', 10);
    const limit = parseInt(queryParams.limit || '10', 10);
    const validPage = page > 0 ? page : 1;
    // Limit max items per page to prevent excessive data transfer
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;

    // Parse filter parameters
    const filters: {
      searchTerm?: string;
      category?: string;
      featured?: boolean;
      inStock?: boolean;
      size?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {};

    if (queryParams.searchTerm && queryParams.searchTerm.trim()) {
      filters.searchTerm = queryParams.searchTerm.trim();
    }

    if (queryParams.category && queryParams.category.trim()) {
      filters.category = queryParams.category;
    }

    if (queryParams.featured !== undefined && queryParams.featured !== '') {
      filters.featured = queryParams.featured === 'true';
    }

    if (queryParams.inStock !== undefined && queryParams.inStock !== '') {
      filters.inStock = queryParams.inStock === 'true';
    }

    if (queryParams.size && queryParams.size.trim()) {
      filters.size = queryParams.size.trim();
    }

    if (queryParams.minPrice !== undefined && queryParams.minPrice !== '') {
      const minPrice = parseFloat(queryParams.minPrice);
      if (!isNaN(minPrice) && minPrice >= 0) {
        filters.minPrice = minPrice;
      }
    }

    if (queryParams.maxPrice !== undefined && queryParams.maxPrice !== '') {
      const maxPrice = parseFloat(queryParams.maxPrice);
      if (!isNaN(maxPrice) && maxPrice >= 0) {
        filters.maxPrice = maxPrice;
      }
    }

    // Parse sort parameter
    const sortBy = queryParams.sortBy || 'name';

    // Log the request for monitoring/auditing
    logger.info("Fetching products (guest)", {
      clientIp,
      page: validPage,
      limit: validLimit,
      filters: {
        hasSearchTerm: !!filters.searchTerm,
        category: filters.category || null,
        featured: filters.featured ?? null,
        inStock: filters.inStock ?? null,
        size: filters.size || null,
        minPrice: filters.minPrice ?? null,
        maxPrice: filters.maxPrice ?? null,
      },
    });

    return await productController.fetchAllProducts(validPage, validLimit, filters, sortBy);
  } catch (error: any) {
    // This catch block is a safety net, though utils.withErrorHandling should catch most errors
    console.error("Unexpected error in guest products route:", error);
    return utils.customResponse({
      status: 500,
      message: MessageResponse.Error,
      description: "An unexpected error occurred while fetching products.",
      data: null,
    }) as NextResponse;
  }
}

export const GET = utils.withErrorHandling(handler);





















































