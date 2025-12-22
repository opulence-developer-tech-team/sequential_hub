import ShippingSettings from "./entity";
import { IUpdateShippingSettingsInput, IShippingSettingsResponse } from "./interface";
import { logger } from "../utils/logger";

class ShippingSettingsService {
  /**
   * Get shipping settings. Returns default values if no settings exist.
   */
  public async getSettings(): Promise<IShippingSettingsResponse> {
    try {
      const settings = await ShippingSettings.findOne().lean();

      if (!settings) {
        // Return default settings if none exist
        return {
          locationFees: [],
          freeShippingThreshold: 0,
        };
      }

      return {
        locationFees: settings.locationFees || [],
        freeShippingThreshold: settings.freeShippingThreshold || 0,
      };
    } catch (error: any) {
      logger.error("Failed to fetch shipping settings", error);
      throw error;
    }
  }

  /**
   * Update shipping settings. Creates if doesn't exist.
   */
  public async updateSettings(
    input: IUpdateShippingSettingsInput
  ): Promise<IShippingSettingsResponse> {
    try {
      // Use findOneAndUpdate with upsert to create if doesn't exist
      const settings = await ShippingSettings.findOneAndUpdate(
        {},
        {
          locationFees: input.locationFees,
          freeShippingThreshold: input.freeShippingThreshold,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      ).lean();

      logger.info("Shipping settings updated", {
        locationFeesCount: input.locationFees.length,
        freeShippingThreshold: input.freeShippingThreshold,
      });

      return {
        locationFees: settings.locationFees || [],
        freeShippingThreshold: settings.freeShippingThreshold || 0,
      };
    } catch (error: any) {
      logger.error("Failed to update shipping settings", error);
      throw error;
    }
  }
}

export const shippingSettingsService = new ShippingSettingsService();
































