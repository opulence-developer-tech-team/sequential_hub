import { shippingSettingsController } from "@/lib/server/shippingSettings/controller";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { NextResponse } from "next/server";

async function handler(request: Request) {
  await connectDB();

  return await shippingSettingsController.getSettings();
}

export const GET = utils.withErrorHandling(handler);





























