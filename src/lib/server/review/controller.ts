import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { productService } from "../products/service";
import { userService } from "../user/service";
import { reviewService } from "./service";
import { reviewValidator } from "./validator";

class ReviewController {
  public async createReview(body: any) {
    // Validate base shape (rating, comment, identifiers)
    const validation = reviewValidator.createReview(body);
    if (!validation.valid) {
      return validation.response!;
    }

    const { productSlug, productId, rating, comment } = body;

    // Resolve product
    let resolvedProductId: Types.ObjectId | null = null;
    if (productId) {
      if (!Types.ObjectId.isValid(productId)) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Invalid productId.",
          data: null,
        });
      }
      resolvedProductId = new Types.ObjectId(productId);
    } else if (productSlug) {
      const product = await productService.findProductBySlug(productSlug.trim());
      if (!product) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Product not found.",
          data: null,
        });
      }
      resolvedProductId = product._id as Types.ObjectId;
    }

    if (!resolvedProductId) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "A valid product identifier is required.",
        data: null,
      });
    }

    // Determine if user is authenticated
    const authResult = await utils.verifyUserAuth();

    let userId: Types.ObjectId | null = null;
    let name: string | undefined = body.name;
    let email: string | undefined = body.email;

    if (authResult.valid && authResult.userId) {
      userId = authResult.userId;
      // Try to enrich name/email from user account
      const user = await userService.getUserById(authResult.userId);
      if (user) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        if (fullName) {
          name = fullName;
        }
        if (user.email) {
          email = user.email;
        }
      }
    }

    // For guest users, require name and email
    if (!userId) {
      if (!name || !email) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Name and email are required to submit a review.",
          data: null,
        });
      }
    }

    const created = await reviewService.createReview({
      productId: resolvedProductId,
      userId,
      name: name!,
      email: email!,
      rating,
      comment,
      // Mark guest reviews as unverified, signed-in user reviews as verified
      isVerified: !!userId,
    });

    return utils.customResponse({
      status: 201,
      message: MessageResponse.Success,
      description: "Review submitted successfully.",
      data: created,
    });
  }

  public async getReviewsForProduct(query: {
    productSlug?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }) {
    let resolvedProductId: Types.ObjectId | null = null;

    if (query.productId && Types.ObjectId.isValid(query.productId)) {
      resolvedProductId = new Types.ObjectId(query.productId);
    } else if (query.productSlug) {
      const product = await productService.findProductBySlug(query.productSlug.trim());
      if (!product) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "Product not found.",
          data: null,
        });
      }
      resolvedProductId = product._id as Types.ObjectId;
    }

    if (!resolvedProductId) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "A valid product identifier is required.",
        data: null,
      });
    }

    const page = query.page && Number.isFinite(query.page) ? query.page : 1;
    const limit = query.limit && Number.isFinite(query.limit) ? query.limit : 10;

    const result = await reviewService.getReviewsForProduct(
      resolvedProductId,
      page,
      limit
    );

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Reviews fetched successfully.",
      data: result,
    });
  }
}

export const reviewController = new ReviewController();







































