import { Document, Types } from "mongoose";
import { AdminRole } from "./enum";

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  adminRole: AdminRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdminLogin {
  email: string;
  password: string;
  rememberMe?: boolean;
}