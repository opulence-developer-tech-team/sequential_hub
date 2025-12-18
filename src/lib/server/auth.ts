import { utils } from "./utils";
import { connectDB } from "./utils/db";

/**
 * Server-side function to check user authentication
 * This runs on the server before the client loads
 * @returns Object with authenticated status and userId if authenticated
 */
export async function checkUserAuth() {
  try {
    await connectDB();
    const authResult = await utils.verifyUserAuth();

    return {
      authenticated: authResult.valid === true,
      userId: authResult.userId?.toString() || null,
      userType: authResult.userType || null,
    };
  } catch (error) {
    // If there's any error, assume not authenticated
    return {
      authenticated: false,
      userId: null,
      userType: null,
    };
  }
}

