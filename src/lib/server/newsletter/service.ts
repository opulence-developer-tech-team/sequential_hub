import { Types } from "mongoose";
import Newsletter from "./entity";
import { ICreateNewsletterInput, INewsletterResponse } from "./interface";
import { logger } from "../utils/logger";

class NewsletterService {
  /**
   * Subscribe an email to the newsletter.
   * If email already exists and is active, returns existing subscription.
   * If email exists but is inactive, reactivates it.
   * Otherwise, creates a new subscription.
   */
  public async subscribe(input: ICreateNewsletterInput): Promise<INewsletterResponse> {
    const email = input.email.toLowerCase().trim();

    // Check if email already exists
    const existing = await Newsletter.findOne({ email });

    if (existing) {
      if (existing.isActive) {
        // Already subscribed and active
        logger.info("Newsletter subscription attempt for already active email", {
          email,
          source: input.source,
        });

        return {
          _id: existing._id.toString(),
          email: existing.email,
          consent: existing.consent,
          consentDate: existing.consentDate,
          source: existing.source,
          createdAt: existing.createdAt!,
        };
      } else {
        // Reactivate subscription
        existing.isActive = true;
        existing.consent = input.consent;
        existing.consentDate = new Date();
        existing.source = input.source || existing.source;
        existing.unsubscribedAt = null;
        if (input.userId) {
          existing.userId = input.userId;
        }
        await existing.save();

        logger.info("Newsletter subscription reactivated", {
          email,
          source: input.source,
        });

        return {
          _id: existing._id.toString(),
          email: existing.email,
          consent: existing.consent,
          consentDate: existing.consentDate,
          source: existing.source,
          createdAt: existing.createdAt!,
        };
      }
    }

    // Create new subscription
    const newsletter = new Newsletter({
      email,
      consent: input.consent,
      consentDate: new Date(),
      source: input.source,
      userId: input.userId || null,
      isActive: true,
    });

    await newsletter.save();

    logger.info("New newsletter subscription created", {
      email,
      source: input.source,
      userId: input.userId?.toString(),
    });

    return {
      _id: newsletter._id.toString(),
      email: newsletter.email,
      consent: newsletter.consent,
      consentDate: newsletter.consentDate,
      source: newsletter.source,
      createdAt: newsletter.createdAt!,
    };
  }

  /**
   * Unsubscribe an email from the newsletter.
   */
  public async unsubscribe(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await Newsletter.updateOne(
      { email: normalizedEmail, isActive: true },
      {
        isActive: false,
        unsubscribedAt: new Date(),
      }
    );

    if (result.modifiedCount > 0) {
      logger.info("Newsletter subscription unsubscribed", { email: normalizedEmail });
      return true;
    }

    return false;
  }

  /**
   * Get all active subscribers (for email campaigns).
   */
  public async getActiveSubscribers(): Promise<string[]> {
    const subscribers = await Newsletter.find({ isActive: true })
      .select("email")
      .lean();

    return subscribers.map((s) => s.email);
  }
}

export const newsletterService = new NewsletterService();


























