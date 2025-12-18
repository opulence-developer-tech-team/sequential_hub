import { Types } from "mongoose";
import crypto from "crypto";
import User from "../user/entity";
import { emailService } from "../utils/email";
import { logger } from "../utils/logger";
import { hashPassCode } from "../utils/auth";

class AuthService {
  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate OTP expiry time (10 minutes from now)
   */
  generateOTPExpiry(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  }

  /**
   * Send OTP to user's email (with optional verification token link)
   */
  async sendOTPToEmail(
    email: string,
    firstName: string,
    otp: string,
    verificationToken?: string
  ): Promise<boolean> {
    try {
      const emailHtml = emailService.generateOTPEmailTemplate(otp, firstName, verificationToken);
      const emailSent = await emailService.sendEmail({
        to: email,
        subject: "Verify Your Email - Sequential Hub",
        html: emailHtml,
      });

      if (!emailSent) {
        logger.error(
          "Failed to send OTP email",
          new Error("Email service returned false"),
          { email }
        );
        return false;
      }

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error sending OTP email", err, { email });
      return false;
    }
  }

  /**
   * Save OTP to user document
   */
  async saveOTPToUser(
    userId: Types.ObjectId,
    otp: string,
    otpExpiry: Date
  ): Promise<boolean> {
    try {
      await User.findByIdAndUpdate(userId, {
        otp,
        otpExpiry,
      });

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error saving OTP to user", err, { userId });
      return false;
    }
  }

  /**
   * Generate email verification token expiry time (24 hours from now)
   */
  generateVerificationTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry;
  }

  /**
   * Save email verification token to user document
   */
  async saveVerificationTokenToUser(
    userId: Types.ObjectId,
    verificationToken: string,
    tokenExpiry: Date
  ): Promise<boolean> {
    try {
      await User.findByIdAndUpdate(userId, {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: tokenExpiry,
      });

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error saving verification token to user", err, { userId });
      return false;
    }
  }

  /**
   * Generate and send OTP to user (also generates verification token)
   */
  async generateAndSendOTP(
    userId: Types.ObjectId,
    email: string,
    firstName: string
  ): Promise<{ success: boolean }> {
    try {
      // Generate OTP and expiry
      const otp = this.generateOTP();
      const otpExpiry = this.generateOTPExpiry();

      // Generate verification token and expiry
      const verificationToken = this.generateResetToken();
      const tokenExpiry = this.generateVerificationTokenExpiry();

      // Save OTP and verification token to user document
      const saved = await this.saveOTPToUser(userId, otp, otpExpiry);
      if (!saved) {
        return { success: false };
      }

      const tokenSaved = await this.saveVerificationTokenToUser(userId, verificationToken, tokenExpiry);
      if (!tokenSaved) {
        logger.warn("OTP saved but verification token save failed", { userId, email });
      }

      // Send OTP via email (with verification link)
      const emailSent = await this.sendOTPToEmail(email, firstName, otp, verificationToken);
      if (!emailSent) {
        // Even if email fails, OTP is saved - user can request resend
        logger.warn("OTP saved but email sending failed", { userId, email });
        return { success: false };
      }

      // SECURITY: Never return OTP or verification tokens to callers.
      // Tokens must only be delivered via email (out-of-band).
      return { success: true };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error generating and sending OTP", err, { userId, email });
      return { success: false };
    }
  }

  /**
   * Verify OTP for a user
   */
  async verifyOTP(email: string, otp: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      // Find user by email
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        return {
          success: false,
          message: "User not found.",
        };
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        // Idempotent behavior: verifying an already-verified email should not be an error.
        const userObject = user.toObject();
        const { password, ...userWithoutPassword } = userObject;
        return {
          success: true,
          message: "Email is already verified.",
          user: userWithoutPassword,
        };
      }

      // Check if OTP exists
      if (!user.otp) {
        return {
          success: false,
          message: "No OTP found. Please request a new OTP.",
        };
      }

      // Check if OTP is expired
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return {
          success: false,
          message: "OTP has expired. Please request a new OTP.",
        };
      }

      // Verify OTP
      if (user.otp !== otp) {
        return {
          success: false,
          message: "Invalid OTP. Please check and try again.",
        };
      }

      // OTP is valid - mark email as verified and clear OTP
      user.isEmailVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      // IMPORTANT:
      // Do NOT clear emailVerificationToken here.
      // We keep it (until expiry) so if a user clicks the emailed verification link again,
      // the system can respond with "Email is already verified" instead of "invalid link".
      await user.save();

      // Return user without password
      const userObject = user.toObject();
      const { password, ...userWithoutPassword } = userObject;

      return {
        success: true,
        message: "Email verified successfully!",
        user: userWithoutPassword,
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error verifying OTP", err, { email });
      return {
        success: false,
        message: "An error occurred while verifying OTP. Please try again.",
      };
    }
  }

  /**
   * Resend OTP to user
   */
  async resendOTP(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Find user by email
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (!user) {
        return {
          success: false,
          message: "User not found.",
        };
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        return {
          success: false,
          message: "Email is already verified.",
        };
      }

      // Generate and send new OTP (with verification token)
      const result = await this.generateAndSendOTP(
        user._id,
        user.email,
        user.firstName
      );

      if (!result.success) {
        return {
          success: false,
          message: "Failed to send OTP. Please try again later.",
        };
      }

      return {
        success: true,
        message: "OTP has been sent to your email.",
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error resending OTP", err, { email });
      return {
        success: false,
        message: "An error occurred while resending OTP. Please try again.",
      };
    }
  }

  /**
   * Verify email by token
   */
  async verifyEmailByToken(token: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      // Find user by verification token
      const user = await User.findOne({
        emailVerificationToken: token,
      });

      if (!user) {
        return {
          success: false,
          message: "Invalid or expired verification link.",
        };
      }

      // Check if email is already verified
      if (user.isEmailVerified) {
        // Idempotent behavior: reusing a valid token for an already verified email
        // should return a clear message instead of an error.
        const userObject = user.toObject();
        const { password, ...userWithoutPassword } = userObject;
        return {
          success: true,
          message: "Email is already verified.",
          user: userWithoutPassword,
        };
      }

      // Check if token is expired
      if (!user.emailVerificationTokenExpiry || new Date() > user.emailVerificationTokenExpiry) {
        // Clear expired token
        await User.findByIdAndUpdate(user._id, {
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        });
        return {
          success: false,
          message: "Verification link has expired. Please login to request a new verification link if email is not verified.",
        };
      }

      // Token is valid - mark email as verified and clear tokens/OTP
      user.isEmailVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      // IMPORTANT:
      // Do NOT clear emailVerificationToken here.
      // Keeping it (until expiry) makes the verification link idempotent:
      // repeated clicks can return "Email is already verified".
      await user.save();

      // Return user without password
      const userObject = user.toObject();
      const { password, ...userWithoutPassword } = userObject;

      return {
        success: true,
        message: "Email verified successfully!",
        user: userWithoutPassword,
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error verifying email by token", err, { token });
      return {
        success: false,
        message: "An error occurred while verifying your email. Please try again.",
      };
    }
  }

  /**
   * Generate a secure password reset token
   */
  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token expiry time (1 hour from now)
   */
  generateResetTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    return expiry;
  }

  /**
   * Send password reset email to user
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      const emailHtml = emailService.generatePasswordResetEmailTemplate(
        firstName,
        resetUrl
      );
      const emailSent = await emailService.sendEmail({
        to: email,
        subject: "Reset Your Password - Sequential Hub",
        html: emailHtml,
      });

      if (!emailSent) {
        logger.error(
          "Failed to send password reset email",
          new Error("Email service returned false"),
          { email }
        );
        return false;
      }

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error sending password reset email", err, { email });
      return false;
    }
  }

  /**
   * Save password reset token to user document
   */
  async saveResetTokenToUser(
    userId: Types.ObjectId,
    resetToken: string,
    resetTokenExpiry: Date
  ): Promise<boolean> {
    try {
      await User.findByIdAndUpdate(userId, {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
      });

      return true;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error saving reset token to user", err, { userId });
      return false;
    }
  }

  /**
   * Request password reset - generates token and sends email
   */
  async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Find user by email
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      // Always return success message for security (don't reveal if user exists)
      if (!user) {
        return {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent.",
        };
      }

      // Generate reset token and expiry
      const resetToken = this.generateResetToken();
      const resetTokenExpiry = this.generateResetTokenExpiry();

      // Save reset token to user document
      const saved = await this.saveResetTokenToUser(
        user._id,
        resetToken,
        resetTokenExpiry
      );
      if (!saved) {
        return {
          success: false,
          message: "Failed to process password reset request. Please try again later.",
        };
      }

      // Send password reset email
      const emailSent = await this.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetToken
      );
      if (!emailSent) {
        logger.warn("Reset token saved but email sending failed", {
          userId: user._id,
          email: user.email,
        });
        return {
          success: false,
          message: "Failed to send password reset email. Please try again later.",
        };
      }

      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error requesting password reset", err, { email });
      return {
        success: false,
        message: "An error occurred while processing your request. Please try again.",
      };
    }
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<{
    valid: boolean;
    message: string;
    userId?: Types.ObjectId;
  }> {
    try {
      // Find user by reset token
      const user = await User.findOne({
        passwordResetToken: token,
      });

      if (!user) {
        return {
          valid: false,
          message: "Invalid or expired reset token.",
        };
      }

      // Check if token is expired
      if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
        // Clear expired token
        await User.findByIdAndUpdate(user._id, {
          passwordResetToken: null,
          passwordResetExpiry: null,
        });
        return {
          valid: false,
          message: "Reset token has expired. Please request a new password reset.",
        };
      }

      return {
        valid: true,
        message: "Reset token is valid.",
        userId: user._id,
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error verifying reset token", err, { token });
      return {
        valid: false,
        message: "An error occurred while verifying the reset token. Please try again.",
      };
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify token
      const tokenVerification = await this.verifyResetToken(token);
      if (!tokenVerification.valid || !tokenVerification.userId) {
        return {
          success: false,
          message: tokenVerification.message,
        };
      }

      // Hash new password
      const hashedPassword = (await hashPassCode(newPassword)) as string;

      // Update user password and clear reset token
      await User.findByIdAndUpdate(tokenVerification.userId, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      });

      logger.info("Password reset successful", {
        userId: tokenVerification.userId.toString(),
      });

      return {
        success: true,
        message: "Password has been reset successfully. You can now sign in with your new password.",
      };
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error resetting password", err, { token });
      return {
        success: false,
        message: "An error occurred while resetting your password. Please try again.",
      };
    }
  }
}

export const authService = new AuthService();
