import { connectDB } from "@/lib/server/utils/db";
import { shippingSettingsService } from "@/lib/server/shippingSettings/service";
import { logger } from "@/lib/server/utils/logger";

/**
 * Server-side function to fetch shipping settings directly from the service layer
 * This avoids HTTP overhead and is more efficient for server-side rendering
 * @returns Shipping settings with freeShippingThreshold and locationFees
 */
export async function getShippingSettings(): Promise<{
  freeShippingThreshold: number;
  locationFees: Array<{ location: string; fee: number }>;
}> {
  try {
    // Ensure database connection
    await connectDB();

    const settings = await shippingSettingsService.getSettings();

    logger.info("Shipping settings fetched successfully", {
      hasFreeShippingThreshold: typeof settings.freeShippingThreshold === 'number',
      locationFeesCount: settings.locationFees?.length || 0,
    });

    return {
      freeShippingThreshold: settings.freeShippingThreshold || 0,
      locationFees: settings.locationFees || [],
    };
  } catch (err: any) {
    logger.error("Unexpected error fetching shipping settings", err);
    // Return default values on error
    return {
      freeShippingThreshold: 0,
      locationFees: [],
    };
  }
}



















