import { MessageResponse } from "../utils/enum";
import { utils } from "../utils";
import { cartService } from "./service";
import { ICartUserInput } from "./interface";
import { logger } from "../utils/logger";
import { shippingSettingsService } from "../shippingSettings/service";

class CartController {
  public async calculateCart(body: ICartUserInput[] | { items: ICartUserInput[]; shippingLocation?: string }) {
    try {
      // Handle both old format (array) and new format (object with items and shippingLocation)
      let cartItems: ICartUserInput[];
      let shippingLocation: string | undefined;
      
      if (Array.isArray(body)) {
        // Old format: just array of items
        cartItems = body;
      } else if (body && typeof body === 'object' && Array.isArray(body.items)) {
        // New format: object with items and optional shippingLocation
        cartItems = body.items;
        shippingLocation = body.shippingLocation;
      } else {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Cart items are required and must be a non-empty array or object with items array.",
          data: null,
        });
      }

      // Validate input
      if (!cartItems || cartItems.length === 0) {
        return utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: "Cart items are required and must be a non-empty array.",
          data: null,
        });
      }

      // Always fetch shipping settings to check free shipping threshold
      let freeShippingThreshold: number | undefined;
      let locationFees: Array<{ location: string; fee: number }> | undefined;
      
      try {
        const shippingSettings = await shippingSettingsService.getSettings();
        freeShippingThreshold = shippingSettings.freeShippingThreshold;
        // Only fetch location fees if shipping location is provided
        if (shippingLocation) {
          locationFees = shippingSettings.locationFees;
        }
      } catch (error) {
        logger.warn("Failed to fetch shipping settings for cart calculation", {
          shippingLocation,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      const result = await cartService.calculateCart(cartItems, shippingLocation, freeShippingThreshold, locationFees);

      if (!result) {
        logger.error("Cart calculation returned null", undefined, {
          itemCount: cartItems.length,
        });
        return utils.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "Failed to calculate cart. Please try again.",
          data: null,
        });
      }

      // Return 200 even if items array is empty - empty cart is a valid state
      // The service already returns a valid structure with empty items array
      return utils.customResponse({
        status: 200,
        message: MessageResponse.Success,
        description:
          result.items.length > 0
            ? "Cart calculated successfully!"
            : "Cart is empty or no valid items found.",
        data: result,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Error in cart controller while calculating cart", err, {
        itemCount: Array.isArray(body) ? body.length : (body?.items?.length || 0),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return utils.customResponse({
        status: 500,
        message: MessageResponse.Error,
        description: "An error occurred while calculating the cart. Please try again.",
        data: null,
      });
    }
  }
}

export const cartController = new CartController();




















































