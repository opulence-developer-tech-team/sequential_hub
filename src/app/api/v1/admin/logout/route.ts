import { cookies } from "next/headers";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { MessageResponse } from "@/lib/server/utils/enum";

async function handler(request: Request) {
  await connectDB();

  const cookieStore = await cookies();
  
  // Clear the admin auth token cookie
  cookieStore.set("admin_auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return utils.customResponse({
    status: 200,
    message: MessageResponse.Success,
    description: "Logged out successfully",
    data: null,
  });
}

export const POST = utils.withErrorHandling(handler);














































