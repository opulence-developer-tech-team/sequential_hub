import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { IResendOTP, IVerifyEmail, IForgotPassword, IResetPassword } from "./inteface";
import { authService } from "./service";

class AuthController {
  /**
   * Resend OTP to user's email
   */
  public async resendOTP(body: IResendOTP) {
    try {
      const result = await authService.resendOTP(body.email);

      if (!result.success) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: result.message,
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: result.message,
        data: null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to resend OTP. Please try again.",
        data: null,
      });
    }
  }

  /**
   * Verify user's email with OTP
   */
  public async verifyEmail(body: IVerifyEmail) {
    try {
      const result = await authService.verifyOTP(body.email, body.otp);

      if (!result.success) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: result.message,
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: result.message,
        data: result.user || null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to verify email. Please try again.",
        data: null,
      });
    }
  }

  /**
   * Verify email by token
   */
  public async verifyEmailByToken(token: string) {
    try {
      const result = await authService.verifyEmailByToken(token);

      if (!result.success) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: result.message,
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: result.message,
        data: result.user || null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to verify email. Please try again.",
        data: null,
      });
    }
  }

  /**
   * Request password reset
   */
  public async forgotPassword(body: IForgotPassword) {
    try {
      const result = await authService.requestPasswordReset(body.email);

      if (!result.success) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: result.message,
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: result.message,
        data: null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to process password reset request. Please try again.",
        data: null,
      });
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(body: IResetPassword) {
    try {
      const result = await authService.resetPassword(body.token, body.password);

      if (!result.success) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: result.message,
          data: null,
        });
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: result.message,
        data: null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "Failed to reset password. Please try again.",
        data: null,
      });
    }
  }
}

export const authController = new AuthController();
