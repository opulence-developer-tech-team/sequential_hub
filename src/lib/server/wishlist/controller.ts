import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { wishlistService } from "./service";
import { IWishlistUserInput } from "./interface";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

class WishlistController {
  public async toggleWishlist(userId: Types.ObjectId, body: IWishlistUserInput) {
    try {
      const result = await wishlistService.toggleWishlist(userId, body.productId);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description:
          result.operation === "added"
            ? "Product added to wishlist successfully!"
            : "Product removed from wishlist successfully!",
        data: {
          operation: result.operation,
          wishlistItem: result.wishlistItem,
        },
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Handle specific error cases
      if (err.message === "Product not found") {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Product not found.",
          data: null,
        });
      }

      if (err.message === "Invalid product ID format") {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid product ID format.",
          data: null,
        });
      }

      if (err.message?.includes("Wishlist size limit reached")) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: err.message,
          data: null,
        });
      }

      logger.error("Error in wishlist controller while toggling wishlist", err, {
        userId: userId.toString(),
        productId: body.productId,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while updating wishlist. Please try again.",
        data: null,
      });
    }
  }

  public async getUserWishlist(userId: Types.ObjectId) {
    try {
      const wishlist = await wishlistService.getUserWishlist(userId);

      if (!wishlist) {
        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "Wishlist is empty.",
          data: {
            _id: "",
            productIds: [],
            userId: userId.toString(),
            createdAt: null,
            updatedAt: null,
          },
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Wishlist fetched successfully!",
        data: wishlist,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in wishlist controller while fetching wishlist", err, {
        userId: userId.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while fetching wishlist. Please try again.",
        data: null,
      });
    }
  }
}

export const wishlistController = new WishlistController();
