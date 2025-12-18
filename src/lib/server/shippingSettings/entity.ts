import { Schema, model, models, Model } from "mongoose";
import { IShippingSettings } from "./interface";

const shippingLocationFeeSchema = new Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shippingSettingsSchema = new Schema<IShippingSettings>(
  {
    locationFees: {
      type: [shippingLocationFeeSchema],
      required: true,
      default: [],
    },
    freeShippingThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ShippingSettings: Model<IShippingSettings> =
  (models.ShippingSettings as Model<IShippingSettings>) ||
  model<IShippingSettings>("ShippingSettings", shippingSettingsSchema);

export default ShippingSettings;





























