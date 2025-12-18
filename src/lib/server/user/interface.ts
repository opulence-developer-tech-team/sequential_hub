import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  otp?: string | null;
  otpExpiry?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpiry?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiry?: Date | null;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserSignUp {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface IUserSignIn {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface IUpdatePersonalInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface IUpdateAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IUserResponse {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IForgotPassword {
  email: string;
}

export interface IResetPassword {
  token: string;
  password: string;
  confirmPassword: string;
}
