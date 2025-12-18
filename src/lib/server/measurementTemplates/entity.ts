import mongoose, { Schema } from "mongoose";
import { IMeasurementTemplate } from "./interface";

const measurementFieldSchema = new Schema<{ name: string }>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const measurementTemplateSchema = new Schema<IMeasurementTemplate>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    fields: {
      type: [measurementFieldSchema],
      required: true,
      validate: {
        validator: function (fields: { name: string }[]) {
          return fields.length > 0;
        },
        message: "At least one measurement field is required",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
measurementTemplateSchema.index({ adminId: 1, createdAt: -1 });
measurementTemplateSchema.index({ title: 1 });

// Performance tweaks
measurementTemplateSchema.set("versionKey", false);

const MeasurementTemplate =
  (mongoose.models.MeasurementTemplate as mongoose.Model<IMeasurementTemplate>) ||
  mongoose.model<IMeasurementTemplate>("MeasurementTemplate", measurementTemplateSchema);

export default MeasurementTemplate;










































