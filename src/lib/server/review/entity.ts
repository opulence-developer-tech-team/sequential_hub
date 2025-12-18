import { Schema, model, models, Model } from "mongoose";
import { IReview } from "./interface";

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful compound index for querying reviews per product sorted by creation date
reviewSchema.index({ productId: 1, createdAt: -1 });

const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", reviewSchema);

export default Review;



























