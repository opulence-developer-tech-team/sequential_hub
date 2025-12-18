import { Document, Types } from "mongoose";

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWishlistUserInput {
  productId: string;
}

export interface IWishlistProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  productVariant: Array<{
    _id: string;
    imageUrls: string[]; // Array of image URLs for the variant
    color: string;
    size: string;
    quantity: number | null;
    price: number | null;
    discountPrice: number | null;
    inStock: boolean;
  }>;
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWishlistResponse {
  _id: string;
  productIds: string[];
  products?: IWishlistProduct[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Optional field for when a single product is added/removed
  addedProduct?: IWishlistProduct;
}

