import mongoose, { Schema } from "mongoose";
import { IAdmin } from "./interface";
import { AdminRole } from "./enum";

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      // select: false, // 🔒 Optional: Hide password by default in queries
    },
    adminRole: {
      type: String,
      required: true,
      enum: Object.values(AdminRole),
      trim: true,
      index: true, // 🔹 Enables role-based filtering
    },
  },
  {
    timestamps: true, // 🔹 Adds createdAt and updatedAt
  }
);

// ✅ Indexes
adminSchema.index({ email: 1, adminRole: 1 }); // Compound index for fast admin filtering

// ✅ Performance Tweaks
adminSchema.set("versionKey", false);
adminSchema.set("toJSON", { virtuals: true });
adminSchema.set("toObject", { virtuals: true });

const Admin =
  (mongoose.models.Admin as mongoose.Model<IAdmin>) ||
  mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
