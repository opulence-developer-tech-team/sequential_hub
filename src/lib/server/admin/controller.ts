import jwt from "jsonwebtoken";

import { cookies } from "next/headers";

import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { AdminRole } from "./enum";
import { Types } from "mongoose";
import { IAdminLogin } from "./interface";
import { comparePassCode } from "../utils/auth";
import { adminService } from "./service";

const adminJwtSecret = process.env.ADMIN_JWT_SECRET || "";

class AdminController {
  public async logIn(body: IAdminLogin) {
    const { password, email, rememberMe = false } = body;

    const adminExists = await adminService.findAdminByEmail(email);

    if (!adminExists) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Wrong user credentials!",
        data: null,
      });
    }

    const match = comparePassCode(password, adminExists.password);

    if (!match) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "Wrong user credentials!",
        data: null,
      });
    }

    // Set token expiration based on rememberMe
    // If rememberMe is true: 30 days, otherwise: 1 day (session-like)
    const tokenExpiration = rememberMe ? "30d" : "1d";
    const cookieMaxAge = rememberMe 
      ? 60 * 60 * 24 * 30 // 30 days in seconds
      : 60 * 60 * 24; // 1 day in seconds

    const token = jwt.sign(
      {
        adminId: adminExists._id,
        adminRole: adminExists.adminRole
      },
      adminJwtSecret,
      {
        expiresIn: tokenExpiration,
      }
    );

    const cookieStore = await cookies();
    cookieStore.set("admin_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: cookieMaxAge,
    });

    // Create response with user data
    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Logged in successfully",
      data: null,
    });
  }
}

export const adminController = new AdminController();
