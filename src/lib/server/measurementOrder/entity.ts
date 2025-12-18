import mongoose, { Schema } from "mongoose";
import {
  IMeasurementOrder,
  IMeasurementTemplateItem,
  MeasurementOrderStatus,
  PaymentStatus,
} from "./interface";

export type { IMeasurementOrder };
export { MeasurementOrderStatus };

const measurementValueSchema = new Schema(
  {
    fieldName: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const measurementTemplateItemSchema = new Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementTemplate",
      required: true,
    },
    templateTitle: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
      default: 1,
    },
    measurements: {
      type: [measurementValueSchema],
      required: true,
      validate: {
        validator: function (measurements: any[]) {
          return measurements.length > 0;
        },
        message: "At least one measurement is required for each template",
      },
    },
    sampleImageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: function (urls: string[]) {
          return urls.length <= 2;
        },
        message: "Maximum 2 images allowed per template",
      },
    },
  },
  { _id: false }
);

const measurementOrderSchema = new Schema<IMeasurementOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isGuest: {
      type: Boolean,
      required: true,
      default: false,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    templates: {
      type: [measurementTemplateItemSchema],
      required: true,
      validate: {
        validator: function (templates: any[]) {
          return templates.length > 0;
        },
        message: "At least one template is required",
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    preferredStyle: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(MeasurementOrderStatus),
      default: MeasurementOrderStatus.OrderReceived,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "monnify",
    },
    paymentReference: {
      type: String,
      trim: true,
      index: true,
    },
    monnifyTransactionReference: {
      type: String,
      trim: true,
    },
    monnifyPaymentReference: {
      type: String,
      trim: true,
    },
    paymentUrl: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
    priceSetAt: {
      type: Date,
      default: null,
    },
    priceSetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    shippingLocation: {
      type: String,
      trim: true,
      required: true,
    },
    tax: {
      type: Number,
      min: 0,
      default: null,
    },
    deliveryFee: {
      type: Number,
      min: 0,
      default: null,
    },
    paidAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    // When true, this order has been superseded by another one and is no longer payable
    isReplaced: {
      type: Boolean,
      default: false,
      index: true,
    },
    // The new order that replaced this one (if any)
    replacedByOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementOrder",
      default: null,
    },
    // For replacement orders, reference back to the original order
    originalOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementOrder",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

measurementOrderSchema.index({ userId: 1, createdAt: -1 });
measurementOrderSchema.index({ guestEmail: 1, createdAt: -1 });
// Compound index on email (no simple index on email field - compound index provides prefix index)
measurementOrderSchema.index({ email: 1, createdAt: -1 });
// Note: orderNumber already has an index from unique: true, so we don't need to add it again
measurementOrderSchema.index({ status: 1, createdAt: -1 });
measurementOrderSchema.index({ paymentStatus: 1, status: 1 });
measurementOrderSchema.index({ monnifyTransactionReference: 1 });
measurementOrderSchema.index({ monnifyPaymentReference: 1 });
measurementOrderSchema.index({ "templates.templateId": 1 });

measurementOrderSchema.set("versionKey", false);
measurementOrderSchema.set("toJSON", { virtuals: true });
measurementOrderSchema.set("toObject", { virtuals: true });

const MeasurementOrder =
  (mongoose.models.MeasurementOrder as mongoose.Model<IMeasurementOrder>) ||
  mongoose.model<IMeasurementOrder>("MeasurementOrder", measurementOrderSchema);

export default MeasurementOrder;
