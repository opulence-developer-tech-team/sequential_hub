import { NextRequest, NextResponse } from "next/server";
import { seedDefaultAdmin } from "@/lib/server/admin/seed";

/**
 * API route to seed default admin
 * POST /api/admin/seed
 * 
 * This endpoint can be called to create a default admin user.
 * It's protected by checking for a secret key in the request.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const secretKey = request.headers.get("x-seed-secret");
    const expectedSecret = process.env.SEED_SECRET_KEY;

    if (expectedSecret && secretKey !== expectedSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Invalid secret key",
        },
        { status: 401 }
      );
    }

    const result = await seedDefaultAdmin();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          admin: {
            email: result.admin.email,
            adminRole: result.admin.adminRole,
          },
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error in seed route:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed admin",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

