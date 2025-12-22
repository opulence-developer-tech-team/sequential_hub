import { Document, Types } from "mongoose";

export interface IShippingLocationFee {
  location: string;
  fee: number;
}

export interface IShippingSettings extends Document {
  _id: Types.ObjectId;
  locationFees: IShippingLocationFee[];
  freeShippingThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateShippingSettingsInput {
  locationFees: IShippingLocationFee[];
  freeShippingThreshold: number;
}

export interface IShippingSettingsResponse {
  locationFees: IShippingLocationFee[];
  freeShippingThreshold: number;
}































