import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { logger } from "../utils/logger";
import { shippingSettingsService } from "./service";
import { shippingSettingsValidator } from "./validator";

class ShippingSettingsController {
  public async getSettings() {
    try {
      const settings = await shippingSettingsService.getSettings();

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Shipping settings retrieved successfully",
        data: settings,
      });
    } catch (error: any) {
      logger.error("Failed to get shipping settings", error);
      throw error;
    }
  }

  public async updateSettings(body: any) {
    // Validate input
    const validation = shippingSettingsValidator.updateSettings(body);
    if (!validation.valid) {
      return validation.response!;
    }

    try {
      const settings = await shippingSettingsService.updateSettings({
        locationFees: body.locationFees,
        freeShippingThreshold: body.freeShippingThreshold,
      });

      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description: "Shipping settings updated successfully",
        data: settings,
      });
    } catch (error: any) {
      logger.error("Failed to update shipping settings", error);
      throw error;
    }
  }
}

export const shippingSettingsController = new ShippingSettingsController();



















