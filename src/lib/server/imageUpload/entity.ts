import mongoose, { Schema } from "mongoose";
import { IUploadedImage } from "./interface";

const uploadedImageSchema = new Schema<IUploadedImage>(
  {
    imageUrl: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Admin",
      index: true,
    },
    fileName: {
      type: String,
      required: false,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: false,
    },
    mimeType: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups by admin and URL
uploadedImageSchema.index({ uploadedBy: 1, imageUrl: 1 });
uploadedImageSchema.index({ publicId: 1 });

// Performance tweaks
uploadedImageSchema.set("versionKey", false);
uploadedImageSchema.set("toJSON", { virtuals: true });
uploadedImageSchema.set("toObject", { virtuals: true });

const UploadedImage =
  (mongoose.models.UploadedImage as mongoose.Model<IUploadedImage>) ||
  mongoose.model<IUploadedImage>("UploadedImage", uploadedImageSchema);

export default UploadedImage;





















































