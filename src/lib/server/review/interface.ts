import { Document, Types } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  name: string;
  email: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateReviewInput {
  productId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  name: string;
  email: string;
  rating: number;
  comment: string;
  isVerified: boolean;
}

export interface IReviewResponse {
  _id: string;
  productId: string;
  userId?: string | null;
  name: string;
  email: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface IReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface IProductReviewsResponse {
  reviews: IReviewResponse[];
  summary: IReviewSummary;
  page: number;
  limit: number;
  totalPages: number;
}







































