import { Types } from "mongoose";
import Review from "./entity";
import {
  ICreateReviewInput,
  IProductReviewsResponse,
  IReviewResponse,
} from "./interface";

class ReviewService {
  public async createReview(input: ICreateReviewInput): Promise<IReviewResponse> {
    const review = new Review({
      productId: input.productId,
      userId: input.userId ?? null,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      rating: input.rating,
      comment: input.comment.trim(),
      isVerified: input.isVerified,
    });

    await review.save();

    return {
      _id: review._id.toString(),
      productId: review.productId.toString(),
      userId: review.userId ? (review.userId as Types.ObjectId).toString() : undefined,
      name: review.name,
      email: review.email,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
    };
  }

  public async getReviewsForProduct(
    productId: Types.ObjectId,
    page: number = 1,
    limit: number = 10
  ): Promise<IProductReviewsResponse> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0 && limit <= 50 ? Math.floor(limit) : 10;
    const skip = (safePage - 1) * safeLimit;

    // Fetch paginated reviews
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const mapped: IReviewResponse[] = reviews.map((r) => ({
      _id: r._id.toString(),
      productId: (r.productId as Types.ObjectId).toString(),
      userId: r.userId ? (r.userId as Types.ObjectId).toString() : undefined,
      name: r.name,
      email: r.email,
      rating: r.rating,
      comment: r.comment,
      isVerified: r.isVerified,
      createdAt: r.createdAt!,
    }));

    // Compute global stats (across all reviews for this product)
    const [stats] = await Review.aggregate([
      { $match: { productId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const totalReviews: number = stats?.totalReviews ?? 0;
    const averageRating: number = stats?.averageRating ?? 0;
    const totalPages =
      totalReviews === 0 ? 1 : Math.max(1, Math.ceil(totalReviews / safeLimit));

    return {
      reviews: mapped,
      summary: {
        averageRating: Number(averageRating.toFixed(2)),
        totalReviews,
      },
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  /**
   * Delete all reviews associated with a given product.
   * Used when an admin permanently deletes a product.
   */
  public async deleteReviewsForProduct(productId: Types.ObjectId): Promise<number> {
    const result = await Review.deleteMany({ productId });
    return result.deletedCount ?? 0;
  }
}

export const reviewService = new ReviewService();








































