import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { Types } from "mongoose";

import { CustomRequest } from "../utils/interface";
import { productService } from "./service";
import { reviewService } from "../review/service";
import { logger } from "../utils/logger";
import { IAddProductUserInput, IEditProductUserInput } from "./interface";
import { IAdmin } from "../admin/interface";

class ProductController {
  public async addProduct(body: IAddProductUserInput, adminData: IAdmin) {
    const slug = utils.slugify(body.name);

    const slugExist = await productService.findProductBySlug(slug);

    if (slugExist) {
      return utils.customResponse({
        status: 409,
        message: MessageResponse.Success,
        description: "Product name exist!",
        data: null,
      });
    }

    const addedProduct = await productService.addProducts({
      ...body,
      slug,
      adminId: adminData._id,
    });

    return utils.customResponse({
      status: 201,
      message: MessageResponse.Success,
      description: "Product added successfully!",
      data: addedProduct,
    });
  }

  public async editProduct(body: IEditProductUserInput) {
    const slug = utils.slugify(body.name);

    // Convert productId string to ObjectId
    let productId: Types.ObjectId = new Types.ObjectId(body.productId);

    const slugExist = await productService.findProductBySlug(slug);

    // Only return error if slug exists AND it belongs to a different product
    // (i.e., another product already has this slug/name)
    if (slugExist && slugExist._id.toString() !== productId.toString()) {
      return utils.customResponse({
        status: 409,
        message: MessageResponse.Error,
        description: "Product name already exists!",
        data: null,
      });
    }

    const editedProduct = await productService.editProductById({
      ...body,
      productId, // Use converted ObjectId
      slug, // Include the slug in the update
    });

    if (!editedProduct) {
      return utils.customResponse({
        status: 404,
        message: MessageResponse.Error,
        description: "Product not found",
        data: null,
      });
    }

    return utils.customResponse({
      status: 201,
      message: MessageResponse.Success,
      description: "Product edited successfully!",
      data: editedProduct,
    });
  }

  public async deleteProduct(productId: Types.ObjectId) {
    const deletedProduct = await productService.deleteProductById(productId);

    if (!deletedProduct) {
      return utils.customResponse({
        status: 404,
        message: MessageResponse.Error,
        description: "Product not found",
        data: null,
      });
    }

    // Best-effort cleanup of associated reviews; product deletion already succeeded.
    try {
      const deletedReviewsCount = await reviewService.deleteReviewsForProduct(productId);
      logger.info("Associated reviews deleted for product", {
        productId: productId.toString(),
        deletedReviews: deletedReviewsCount,
      });
    } catch (error: any) {
      logger.error("Failed to delete associated reviews for product", error?.stack || error, {
        productId: productId.toString(),
        error: error?.message,
      });
    }

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Product deleted successfully!",
      data: deletedProduct,
    });
  }

  public async fetchAllProducts(
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
    const result = await productService.fetchProducts(page, limit, filters, sortBy);

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Products fetched successfully!",
      data: { products: result.products, pagination: result.pagination },
    });
  }

  public async getProductBySlug(slug: string) {
    const product = await productService.findProductBySlug(slug);

    if (!product) {
      return utils.customResponse({
        status: 404,
        message: MessageResponse.Error,
        description: "Product not found.",
        data: null,
      });
    }

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Product fetched successfully!",
      data: product,
    });
  }

  public async deleteProductVariant(productId: Types.ObjectId, variantId: Types.ObjectId) {
    try {
      const updatedProduct = await productService.deleteProductVariant(productId, variantId);

      if (!updatedProduct) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Product or variant not found.",
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Product variant deleted successfully!",
        data: updatedProduct,
      });
    } catch (error: any) {
      // Handle the case where we try to delete the last variant
      if (error.message && error.message.includes("last variant")) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: error.message,
          data: null,
        });
      }

      // Re-throw other errors to be handled by error middleware
      throw error;
    }
  }
}

export const productController = new ProductController();
