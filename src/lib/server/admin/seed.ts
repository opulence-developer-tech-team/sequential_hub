// Load environment variables for standalone script execution
// Next.js automatically loads .env.local in API routes, but not in standalone scripts
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load environment variables (Next.js loads .env.local automatically, but we need it for standalone scripts)
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

// Load .env.local first (Next.js convention), then .env as fallback
let envLoaded = false;
if (existsSync(envLocalPath)) {
  const result = config({ path: envLocalPath, override: false });
  if (!result.error) {
    envLoaded = true;
    console.log("✅ Loaded environment variables from .env.local");
  }
}

if (!envLoaded && existsSync(envPath)) {
  const result = config({ path: envPath, override: false });
  if (!result.error) {
    envLoaded = true;
    console.log("✅ Loaded environment variables from .env");
  }
}

if (!envLoaded) {
  console.warn("⚠️  Warning: No .env.local or .env file found");
}

// Strip quotes from MONGODB_URI if present (dotenv sometimes includes them from quoted values)
if (process.env.MONGODB_URI) {
  const original = process.env.MONGODB_URI;
  process.env.MONGODB_URI = original.replace(/^["']|["']$/g, '').trim();
  if (original !== process.env.MONGODB_URI) {
    console.log("🔧 Stripped quotes from MONGODB_URI");
  }
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables");
  console.error("   Please create a .env.local file with: MONGODB_URI=your_connection_string");
  console.error("   Current working directory:", process.cwd());
  console.error("   Looking for .env.local at:", envLocalPath);
} else {
  // Show first and last few characters for verification (don't expose full connection string)
  const uri = process.env.MONGODB_URI;
  const preview = uri.length > 30 
    ? `${uri.substring(0, 20)}...${uri.substring(uri.length - 10)}`
    : uri.substring(0, 20) + "...";
  console.log("✅ MONGODB_URI is set:", preview);
}

import { connectDB } from "../utils/db";
import { hashPassCode } from "../utils/auth";
import Admin from "./entity";
import { AdminRole } from "./enum";
import { IAdmin } from "./interface";

const DEFAULT_ADMIN = {
  email: "admin@sequentialhub.com",
  password: "admin@12356#",
  adminRole: AdminRole.SuperAdmin,
};

/**
 * Seeds the database with a default admin user
 * This should be run once during initial setup
 */
export async function seedDefaultAdmin() {
  try {
    console.log("🌱 Starting admin seeder...");

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: DEFAULT_ADMIN.email,
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${DEFAULT_ADMIN.email} already exists. Skipping seed.`);
      return {
        success: false,
        message: "Admin already exists",
        admin: existingAdmin,
      };
    }

    // Hash the password
    console.log("🔐 Hashing password...");
    const hashedPassword = await hashPassCode(DEFAULT_ADMIN.password);

    // Create the admin
    console.log("👤 Creating default admin...");
    const adminData = {
      email: DEFAULT_ADMIN.email,
      password: hashedPassword as string,
      adminRole: DEFAULT_ADMIN.adminRole,
    };
    
    const admin = new Admin(adminData);
    await admin.save();

    console.log("✅ Default admin created successfully!");
    console.log(`📧 Email: ${admin.email}`);
    // SECURITY: Password should not be logged in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Password: ${DEFAULT_ADMIN.password} (please change this in production)`);
    }
    console.log(`👑 Role: ${admin.adminRole}`);

    return {
      success: true,
      message: "Default admin created successfully",
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        adminRole: admin.adminRole,
      },
    };
  } catch (error) {
    console.error("❌ Error seeding default admin:", error);
    throw error;
  }
}

/**
 * Standalone script execution
 * Run with: npx tsx src/lib/server/admin/seed.ts
 */
if (require.main === module) {
  seedDefaultAdmin()
    .then((result) => {
      if (result.success) {
        console.log("\n✨ Seeding completed successfully!");
        process.exit(0);
      } else {
        console.log("\n⚠️  Seeding skipped (admin already exists)");
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("\n❌ Seeding failed:", error);
      process.exit(1);
    });
}


















































