import { Document, Types } from "mongoose";

export interface IDeleteImage {
  imageUrl: string;
}

export interface IUploadedImage extends Document {
  imageUrl: string;
  publicId: string;
  uploadedBy: Types.ObjectId;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReplaceImage {
  image: File;
  color: string;
  oldImageUrl: string;
  productId: string;
  imageIndex: number;
}