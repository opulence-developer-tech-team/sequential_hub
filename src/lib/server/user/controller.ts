import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { MessageResponse, UserRole, UserType } from "../utils/enum";
import { utils } from "../utils";
import { IUserSignIn, IUserSignUp, IUserResponse, IUpdatePersonalInfo, IUpdateAddress } from "./interface";
import { comparePassCode, hashPassCode } from "../utils/auth";
import { userService } from "./service";
import { authService } from "../auth/service";
import { logger } from "../utils/logger";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

const jwtSecret = process.env.JWT_SECRET || "";

class UserController {
  public async signUp(body: IUserSignUp) {
    try {
      // Check if user already exists
      const userExists = await userService.userExists(body.email);

      if (userExists) {
        return utils.customResponse({
          status: 409,
          message: MessageResponse.Error,
          description: "User with this email already exists.",
          data: null,
        });
      }

      // Hash password
      const hashedPassword = (await hashPassCode(body.password)) as string;

      // Create user
      const newUser = await userService.createUser({
        ...body,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser._id.toString(),
          userRole: UserRole.User,
          userType: UserType.Customer,
          ownerId: newUser._id.toString(),
        },
        jwtSecret,
        {
          expiresIn: "30d",
        }
      );

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("user_auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      // Generate and send OTP to user's email
      const otpResult = await authService.generateAndSendOTP(
        newUser._id,
        newUser.email,
        newUser.firstName
      );

      if (!otpResult.success) {
        logger.warn("Account created but OTP sending failed", {
          userId: newUser._id.toString(),
          email: newUser.email,
        });
        // Still return success, but inform user to request OTP resend
        return utils.customResponse({
          status: 201,
          message: MessageResponse.Success,
          description:
            "Account created successfully! However, we couldn't send the verification email. Please use the resend OTP feature.",
          data: {
            _id: newUser._id.toString(),
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phoneNumber: newUser.phoneNumber,
            isEmailVerified: false,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
          },
        });
      }

      // Prepare user response
      const userResponse: IUserResponse = {
        _id: newUser._id.toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        isEmailVerified: false,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      return utils.customResponse({
        status: 201,
        message: MessageResponse.Success,
        description:
          "Account created successfully! Please check your email for the verification link.",
        // SECURITY: Never return verification tokens to the client.
        // Verification happens via OTP/link delivered to the user's email only.
        data: userResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to create account. Please try again.",
        data: null,
      });
    }
  }

  public async signIn(body: IUserSignIn) {
    try {
      const { password, email, rememberMe = false } = body;

      // Find user by email
      const user = await userService.findUserByEmail(email);

      if (!user) {
        return utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "Invalid email or password.",
          data: null,
        });
      }

      // Compare password
      const match = comparePassCode(password, user.password);

      if (!match) {
        return utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "Invalid email or password.",
          data: null,
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        // Generate and send OTP for email verification
        const otpResult = await authService.generateAndSendOTP(
          user._id,
          user.email,
          user.firstName
        );

        if (!otpResult.success) {
          logger.warn("Failed to send verification email during sign-in", {
            userId: user._id.toString(),
            email: user.email,
          });
        }

        // Return response indicating email needs verification
        return utils.customResponse({
          status: 403,
          message: MessageResponse.Error,
          description: "Please verify your email address to continue. A verification link has been sent to your email.",
          data: {
            requiresVerification: true,
            email: user.email,
            // SECURITY: Never return verification tokens to the client.
          },
        });
      }

      // Set token expiration based on rememberMe
      const tokenExpiration = rememberMe ? "30d" : "1d";
      const cookieMaxAge = rememberMe
        ? 60 * 60 * 24 * 30 // 30 days
        : 60 * 60 * 24; // 1 day

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          userRole: UserRole.User,
          userType: UserType.Customer,
          ownerId: user._id.toString(),
        },
        jwtSecret,
        {
          expiresIn: tokenExpiration,
        }
      );

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("user_auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: cookieMaxAge,
      });

      // Prepare user response
      const userResponse: IUserResponse = {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        isEmailVerified: user.isEmailVerified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Signed in successfully!",
        data: userResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to sign in. Please try again.",
        data: null,
      });
    }
  }

  public async getUserDetails(userId: Types.ObjectId) {
    try {
      const user = await userService.getUserById(userId);

      if (!user) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "User not found.",
          data: null,
        });
      }

      // Prepare user response
      const userResponse: IUserResponse = {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        street: user.street || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        isEmailVerified: user.isEmailVerified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "User details fetched successfully.",
        data: userResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error fetching user details", err, { userId });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to fetch user details. Please try again.",
        data: null,
      });
    }
  }

  public async updatePersonalInfo(userId: Types.ObjectId, body: IUpdatePersonalInfo) {
    try {
      const updatedUser = await userService.updatePersonalInfo(userId, body);

      if (!updatedUser) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "User not found.",
          data: null,
        });
      }

      // Prepare user response
      const userResponse: IUserResponse = {
        _id: updatedUser._id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        street: updatedUser.street || '',
        city: updatedUser.city || '',
        state: updatedUser.state || '',
        zipCode: updatedUser.zipCode || '',
        country: updatedUser.country || '',
        isEmailVerified: updatedUser.isEmailVerified || false,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Personal information updated successfully.",
        data: userResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating personal information", err, { userId });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to update personal information. Please try again.",
        data: null,
      });
    }
  }

  public async updateAddress(userId: Types.ObjectId, body: IUpdateAddress) {
    try {
      const updatedUser = await userService.updateAddress(userId, body);

      if (!updatedUser) {
        return utils.customResponse({
          status: 404,
          message: MessageResponse.Error,
          description: "User not found.",
          data: null,
        });
      }

      // Prepare user response
      const userResponse: IUserResponse = {
        _id: updatedUser._id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        street: updatedUser.street || '',
        city: updatedUser.city || '',
        state: updatedUser.state || '',
        zipCode: updatedUser.zipCode || '',
        country: updatedUser.country || '',
        isEmailVerified: updatedUser.isEmailVerified || false,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Address updated successfully.",
        data: userResponse,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error updating address", err, { userId });
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to update address. Please try again.",
        data: null,
      });
    }
  }

  public async fetchUsers(
    page: number,
    limit: number,
    filters: { searchTerm?: string; status?: string }
  ) {
    try {
      const { users, pagination } = await userService.fetchUsers(page, limit, filters);

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Users fetched successfully",
        data: {
          users,
          pagination,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to fetch users", err, {
        page,
        limit,
        filters,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to fetch users. Please try again.",
        data: null,
      });
    }
  }
}

export const userController = new UserController();
