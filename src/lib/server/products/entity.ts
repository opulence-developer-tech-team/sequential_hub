import mongoose, { Schema } from "mongoose";
import { ClothingCategory, ProductSize } from "@/types/enum";
import { IProduct } from "./interface";

// Reusable product variant schema (matches IProductVariant interface)
const productVariantSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    imageUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0 && arr.every(url => typeof url === 'string' && url.trim().length > 0),
        message: "At least one image URL is required for each variant",
      },
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      enum: Object.values(ProductSize),
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    /**
     * Reserved units held for in-progress checkouts.
     * This prevents overselling without permanently reducing quantity.
     */
    reservedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true,
    },
    measurements: {
      neck: { type: Number, min: 0 },
      shoulder: { type: Number, min: 0 },
      chest: { type: Number, min: 0 },
      shortSleeve: { type: Number, min: 0 },
      longSleeve: { type: Number, min: 0 },
      roundSleeve: { type: Number, min: 0 },
      tummy: { type: Number, min: 0 },
      topLength: { type: Number, min: 0 },
      waist: { type: Number, min: 0 },
      laps: { type: Number, min: 0 },
      kneelLength: { type: Number, min: 0 },
      roundKneel: { type: Number, min: 0 },
      trouserLength: { type: Number, min: 0 },
      ankle: { type: Number, min: 0 },
      quarterLength: { type: Number, min: 0 },
    },
  },
  {
    _id: true,
  }
);

const productSchema = new Schema<IProduct>(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: Object.values(ClothingCategory),
      required: true,
      index: true,
    },
    material: {
      type: String,
      required: true,
      trim: true,
    },
    productOwner: {
      type: String,
      required: true,
      trim: true,
      default: 'self',
    },
    productVariant: {
      type: [productVariantSchema],
      required: true,
      validate: {
        validator: (arr: any[]) => arr.length > 0,
        message: "At least one product variant is required",
      },
    },

    isFeatured: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
productSchema.index({ adminId: 1, category: 1 });
productSchema.index({ name: "text", description: "text" });
// Index for variant-level queries
productSchema.index({ "productVariant.size": 1 });
productSchema.index({ "productVariant.inStock": 1 });
productSchema.index({ "productVariant.price": 1 });

const Product =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", productSchema);

export default Product;
