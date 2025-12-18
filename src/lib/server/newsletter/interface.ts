import { Document, Types } from "mongoose";

export interface INewsletter extends Document {
  _id: Types.ObjectId;
  email: string;
  consent: boolean;
  consentDate: Date;
  source?: string; // e.g., "footer", "homepage", "checkout"
  userId?: Types.ObjectId | null;
  isActive: boolean;
  unsubscribedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNewsletterInput {
  email: string;
  consent: boolean;
  source?: string;
  userId?: Types.ObjectId | null;
}

export interface INewsletterResponse {
  _id: string;
  email: string;
  consent: boolean;
  consentDate: Date;
  source?: string;
  createdAt: Date;
}


























