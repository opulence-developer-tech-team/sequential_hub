import mongoose, { Schema } from "mongoose";
import {
  IOrder,
  OrderStatus,
  PaymentStatus,
} from "./interface";

export type { IOrder };
export { OrderStatus, PaymentStatus };

const orderItemSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSlug: {
      type: String,
      required: true,
    },
    variantImageUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0 && arr.every(url => typeof url === 'string' && url.trim().length > 0),
        message: "At least one image URL is required for each order item",
      },
    },
    variantColor: {
      type: String,
      required: true,
    },
    variantSize: {
      type: String,
      required: true,
    },
    variantPrice: {
      type: Number,
      required: true,
    },
    variantDiscountPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    itemSubtotal: {
      type: Number,
      required: true,
    },
    itemTotal: {
      type: Number,
      required: true,
    },
    measurements: {
      neck: { type: Number, min: 0 },
      shoulder: { type: Number, min: 0 },
      chest: { type: Number, min: 0 },
      shortSleeve: { type: Number, min: 0 },
      longSleeve: { type: Number, min: 0 },
      roundSleeve: { type: Number, min: 0 },
      tummy: { type: Number, min: 0 },
      topLength: { type: Number, min: 0 },
      waist: { type: Number, min: 0 },
      laps: { type: Number, min: 0 },
      kneelLength: { type: Number, min: 0 },
      roundKneel: { type: Number, min: 0 },
      trouserLength: { type: Number, min: 0 },
      quarterLength: { type: Number, min: 0 },
      ankle: { type: Number, min: 0 },
    },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
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
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items: any[]) {
          return items.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingLocation: {
      type: String,
      trim: true,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.OrderPlaced,
      index: true,
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
    paidAt: {
      type: Date,
    },
    /**
     * Reservation tracking (prevents oversell while user pays)
     */
    inventoryReservedAt: {
      type: Date,
      index: true,
    },
    inventoryReservationExpiresAt: {
      type: Date,
      index: true,
    },
    inventoryReservationReleasedAt: {
      type: Date,
      index: true,
    },
    /**
     * Inventory tracking (idempotency + audit)
     */
    inventoryDeductedAt: {
      type: Date,
      index: true,
    },
    inventoryDeductionFailedAt: {
      type: Date,
      index: true,
    },
    inventoryDeductionError: {
      type: String,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// Note: orderNumber already has an index from unique: true, so we don't need to add it again
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ guestEmail: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ monnifyTransactionReference: 1 });
orderSchema.index({ monnifyPaymentReference: 1 });

// Performance optimizations
orderSchema.set("versionKey", false);
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>("Order", orderSchema);

export default Order;
