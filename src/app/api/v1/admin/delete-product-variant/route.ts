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

  // Get productId and variantId from query parameters
  const { searchParams } = new URL(request.url);
  const productIdParam = searchParams.get("productId");
  const variantIdParam = searchParams.get("variantId");

  // Validate query parameters
  const validationResponse = productValidator.deleteProductVariant({
    productId: productIdParam || undefined,
    variantId: variantIdParam || undefined,
  });
  if (!validationResponse.valid) return validationResponse.response! as NextResponse;

  const admin = await GeneralMiddleware.doesAdminExist(auth.adminId!);
  if (!admin.valid) return admin.response!;

  const isSuperAdmin = await GeneralMiddleware.isSuperAdmin({
    adminRole: admin.adminUser?.adminRole,
  });
  if (!isSuperAdmin.valid) return isSuperAdmin.response!;

  // Convert IDs to ObjectId (validation ensures they are valid strings)
  const productIdObjectId = new Types.ObjectId(productIdParam!);
  const variantIdObjectId = new Types.ObjectId(variantIdParam!);

  return await productController.deleteProductVariant(productIdObjectId, variantIdObjectId);
}

export const DELETE = utils.withErrorHandling(handler);













































