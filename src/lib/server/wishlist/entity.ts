import mongoose, { Schema } from "mongoose";
import { IWishlist } from "./interface";

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wishlist document per user
    },
    productIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [], // Default to empty array
      validate: {
        validator: function (arr: mongoose.Types.ObjectId[]) {
          // Ensure no duplicate productIds in the array
          return arr.length === new Set(arr.map((id) => id.toString())).size;
        },
        message: "Duplicate product IDs are not allowed in wishlist",
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Performance Tweaks
wishlistSchema.set("versionKey", false);
wishlistSchema.set("toJSON", { virtuals: true });
wishlistSchema.set("toObject", { virtuals: true });

const Wishlist =
  (mongoose.models.Wishlist as mongoose.Model<IWishlist>) ||
  mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist;
