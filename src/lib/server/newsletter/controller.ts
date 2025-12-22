import { Types } from "mongoose";
import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { newsletterService } from "./service";
import { newsletterValidator } from "./validator";

class NewsletterController {
  public async subscribe(body: any) {
    // Validate input
    const validation = newsletterValidator.subscribe(body);
    if (!validation.valid) {
      return validation.response!;
    }

    const { email, consent, source } = body;

    // Determine if user is authenticated
    const authResult = await utils.verifyUserAuth();
    const userId = authResult.valid && authResult.userId ? authResult.userId : null;

    try {
      const subscription = await newsletterService.subscribe({
        email: email.trim().toLowerCase(),
        consent,
        source: source?.trim() || undefined,
        userId,
      });

      return utils.customResponse({
        status: 201,
        message: MessageResponse.Success,
        description: "Successfully subscribed to newsletter!",
        data: subscription,
      });
    } catch (error: any) {
      // Handle duplicate email error (shouldn't happen due to our logic, but just in case)
      if (error.code === 11000 || error.message?.includes("duplicate")) {
        return utils.customResponse({
          status: 200,
          message: MessageResponse.Success,
          description: "You are already subscribed to our newsletter.",
          data: null,
        });
      }

      throw error;
    }
  }
}

export const newsletterController = new NewsletterController();






































