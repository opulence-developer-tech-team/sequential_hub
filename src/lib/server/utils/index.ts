import Crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { cookies } from "next/headers";

import { NextResponse } from "next/server";
import { CustomHttpResponse, DecodedToken, Handler } from "./interface";
import { MessageResponse, UserType } from "./enum";
import { AdminRole } from "../admin/enum";

class Utils {
  public customResponse({
    status,
    message,
    description,
    data,
  }: CustomHttpResponse) {
    return NextResponse.json(
      {
        message,
        description,
        data,
      },
      { status }
    );
  }

  public withErrorHandling(handler: Handler) {
    return async (request: Request) => {
      try {
        return await handler(request);
      } catch (err) {
        console.error("Route handler error:", err);

        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "Internal server error",
          data: null,
        });
      }
    };
  }

  public runMiddleware(req: any, fn: any): Promise<any> {
    return new Promise((resolve, reject) => {
      fn(req, {} as any, (result: any) => {
        if (result instanceof Error) return reject(result);
        return resolve(result);
      });
    });
  }

  public generateOtp = (): string => {
    return Array.from({ length: 6 }, () => Crypto.randomInt(0, 10)).join("");
  };

  public generateTransactionId = (prefix: string): string => {
    const timestamp = Date.now().toString(36);
    const randomPart = Crypto.randomBytes(4).toString("hex");

    return `${prefix}-${timestamp}-${randomPart}`.toUpperCase();
  };

  public async verifyUserAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_auth_token")?.value;

    if (!token) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "No token provided",
          data: null,
        }),
      };
    }

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as DecodedToken;
      if (!decodedToken?.userId || !decodedToken?.userRole || !decodedToken?.userType || !decodedToken?.ownerId) {
        return {
          valid: false,
          response: utils.customResponse({
            status: 401,
            message: MessageResponse.Error,
            description: "Not authenticated",
            data: null,
          }),
        };
      }

      console.log("decodedTokendecodedTokendecodedTokendecodedToken", decodedToken)

      return {
        valid: true,
        userId: mongoose.Types.ObjectId.createFromHexString(
          decodedToken.userId
        ),
        userType: decodedToken?.userType as UserType
      };
    } catch (err) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "Invalid token",
          data: null,
        }),
      };
    }
    
  }


   public async verifyAdminAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_auth_token")?.value;

    if (!token) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "No token provided",
          data: null,
        }),
      };
    }

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.ADMIN_JWT_SECRET!
      ) as DecodedToken;
      if (!decodedToken?.adminId || !decodedToken?.adminRole) {
        return {
          valid: false,
          response: utils.customResponse({
            status: 401,
            message: MessageResponse.Error,
            description: "Not authenticated",
            data: null,
          }),
        };
      }
      return {
        valid: true,
       adminId: mongoose.Types.ObjectId.createFromHexString(
          decodedToken.adminId
        ),
        adminRole: decodedToken.adminRole as AdminRole,
      };
    } catch (err) {
      return {
        valid: false,
        response: utils.customResponse({
          status: 401,
          message: MessageResponse.Error,
          description: "Invalid token",
          data: null,
        }),
      };
    }
    
  }
  
  public slugify = (input: string): string => {
  return input.toLowerCase().replace(/\s+/g, "-");
};
}

export const utils = new Utils();
