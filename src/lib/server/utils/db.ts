import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  // Read MONGODB_URI dynamically and strip quotes if present
  let mongoUri = process.env.MONGODB_URI || "";
  if (mongoUri) {
    // Remove surrounding quotes if present
    mongoUri = mongoUri.replace(/^["']|["']$/g, '').trim();
  }

  if (!mongoUri) {
    console.error("Please define MONGODB_URI in .env.local");
    isConnected = true;
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(mongoUri);
}
