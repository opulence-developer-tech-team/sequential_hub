import { Schema, model, models, Model } from "mongoose";
import { INewsletter } from "./interface";

const newsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
    consentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      required: false,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    unsubscribedAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active subscribers
newsletterSchema.index({ isActive: 1, email: 1 });

const Newsletter: Model<INewsletter> =
  (models.Newsletter as Model<INewsletter>) ||
  model<INewsletter>("Newsletter", newsletterSchema);

export default Newsletter;


























