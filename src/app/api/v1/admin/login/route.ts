import { adminController } from "@/lib/server/admin/controller";
import { IAdminLogin } from "@/lib/server/admin/interface";
import { adminValidator } from "@/lib/server/admin/validator";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";

async function handler(request: Request) {
  await connectDB();

  const body: IAdminLogin = await request.json();

  const validationResponse = adminValidator.adminLogIn(body);
  if (!validationResponse.valid) return validationResponse.response!;

  return await adminController.logIn(body);
}

export const POST = utils.withErrorHandling(handler);
