import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { MessageResponse } from "@/lib/server/utils/enum";

async function handler(request: Request) {
  await connectDB();

  const authResult = await utils.verifyAdminAuth();

  if (!authResult.valid) {
    return authResult.response!;
  }

  return utils.customResponse({
    status: 200,
    message: MessageResponse.Success,
    description: "Authenticated",
    data: {
      authenticated: true,
      adminId: authResult.adminId?.toString(),
      adminRole: authResult.adminRole,
    },
  });
}

export const GET = utils.withErrorHandling(handler);



















































