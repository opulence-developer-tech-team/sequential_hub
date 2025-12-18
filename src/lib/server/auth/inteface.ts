// Re-export user interfaces for authentication
export type { IUserSignIn } from "../user/interface";
export type { IUserSignUp } from "../user/interface";
export type { IUserResponse } from "../user/interface";
export type { IForgotPassword, IResetPassword } from "../user/interface";

// Resend OTP interfaces
export interface IResendOTP {
  email: string;
}

export interface IResendOTPResponse {
  success: boolean;
  message: string;
}

// Verify Email interfaces
export interface IVerifyEmail {
  email: string;
  otp: string;
}

export interface IVerifyEmailResponse {
  success: boolean;
  message: string;
  user?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isEmailVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

// Forgot Password interfaces
export interface IForgotPasswordResponse {
  success: boolean;
  message: string;
}

// Reset Password interfaces
export interface IResetPasswordResponse {
  success: boolean;
  message: string;
}
