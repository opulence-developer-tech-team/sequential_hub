import { AdminRole } from "@/lib/server/admin/enum";
import GeneralMiddleware from "@/lib/server/middleware";
import { productController } from "@/lib/server/products/controller";
import { productValidator } from "@/lib/server/products/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

async function handler(request: Request) {
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  await connectDB();

  // Get productId from query parameters
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  // Validate productId
  const validationResponse = productValidator.deleteProduct(productId);
  if (!validationResponse.valid) return validationResponse.response! as NextResponse;

  const admin = await GeneralMiddleware.doesAdminExist(auth.adminId!);
  if (!admin.valid) return admin.response!;

  const isSuperAdmin = await GeneralMiddleware.isSuperAdmin({
    adminRole: admin.adminUser?.adminRole,
  });
  if (!isSuperAdmin.valid) return isSuperAdmin.response!;

  // Convert productId string to ObjectId
  const productIdObjectId = new Types.ObjectId(productId!);

  return await productController.deleteProduct(productIdObjectId);
}

export const DELETE = utils.withErrorHandling(handler);
