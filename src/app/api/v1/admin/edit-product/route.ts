import { AdminRole } from "@/lib/server/admin/enum";
import GeneralMiddleware from "@/lib/server/middleware";
import { productController } from "@/lib/server/products/controller";
import { IAddProductUserInput, IEditProductUserInput } from "@/lib/server/products/interface";
import { productValidator } from "@/lib/server/products/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { NextResponse } from "next/server";

async function handler(request: Request) {
  const auth = await utils.verifyAdminAuth();
  if (!auth.valid) return auth.response! as NextResponse;

  await connectDB();

  const body: IEditProductUserInput = await request.json();

  const admin = await GeneralMiddleware.doesAdminExist(auth.adminId!);
  if (!admin.valid) return admin.response!;

  const isSuperAdmin = await GeneralMiddleware.isSuperAdmin({
    adminRole: admin.adminUser?.adminRole,
  });
  if (!isSuperAdmin.valid) return isSuperAdmin.response!;

  const validationResponse = productValidator.editProduct(body);
  if (!validationResponse.valid) return validationResponse.response!;

  return await productController.editProduct(body);
}

export const PUT = utils.withErrorHandling(handler);
