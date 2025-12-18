import { Document, Types } from "mongoose";

export interface IMeasurementField {
  name: string;
}

export interface IMeasurementTemplate extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  title: string;
  fields: IMeasurementField[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateMeasurementTemplateInput {
  adminId: Types.ObjectId;
  title: string;
  fields: IMeasurementField[];
}

export interface ICreateMeasurementTemplateUserInput {
  title: string;
  fields: IMeasurementField[];
}

export interface IUpdateMeasurementTemplateUserInput {
  templateId: string;
  title: string;
  fields: IMeasurementField[];
}

export interface IMeasurementTemplateResponse {
  _id: string;
  adminId: string;
  title: string;
  fields: IMeasurementField[];
  createdAt?: Date;
  updatedAt?: Date;
}










































