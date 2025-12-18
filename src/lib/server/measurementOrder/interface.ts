import { Document, Types } from "mongoose";
import { PaymentStatus } from "../order/interface";

export enum MeasurementOrderStatus {
  OrderReceived = "order_received",
  DesignReview = "design_review",
  FabricSelection = "fabric_selection",
  PatternMaking = "pattern_making",
  Cutting = "cutting",
  Sewing = "sewing",
  QualityCheck = "quality_check",
  Packed = "packed",
  Shipped = "shipped",
  InTransit = "in_transit",
  OutForDelivery = "out_for_delivery",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export { PaymentStatus };

export interface IMeasurementValue {
  fieldName: string;
  value: number;
}

export interface IMeasurementTemplateItem {
  templateId: Types.ObjectId;
  templateTitle: string;
  quantity: number;
  measurements: IMeasurementValue[];
  sampleImageUrls?: string[];
}

export interface IMeasurementOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId?: Types.ObjectId;
  isGuest: boolean;
  guestEmail?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  templates: IMeasurementTemplateItem[];
  notes?: string;
  preferredStyle?: string;
  status: MeasurementOrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentReference?: string;
  monnifyTransactionReference?: string;
  monnifyPaymentReference?: string;
  paymentUrl?: string;
  price?: number;
  priceSetAt?: Date;
  priceSetBy?: Types.ObjectId;
  shippingLocation: string;
  tax?: number;
  deliveryFee?: number;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  /**
   * When true, this order has been superseded by another measurement order
   * (typically after the price was updated). It should no longer be payable.
   */
  isReplaced?: boolean;
  /**
   * Reference to the new order that replaced this one (if any).
   */
  replacedByOrderId?: Types.ObjectId;
  /**
   * For replacement orders, reference back to the original order.
   */
  originalOrderId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMeasurementTemplateInput {
  templateId: string;
  quantity: number;
  measurements: Record<string, number>;
  sampleImageUrls?: string[];
}

export interface IMeasurementOrderUserInput {
  firstName?: string;
  lastName?: string;
  name?: string; // Deprecated, kept for backward compatibility
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  templates: IMeasurementTemplateInput[];
  notes?: string;
  preferredStyle?: string;
  // Account creation (for guest users)
  createAccount?: boolean;
  password?: string;
  confirmPassword?: string;
  shippingLocation: string;
}

export interface IMeasurementOrderResponse {
  _id: string;
  orderNumber: string;
  userId?: string;
  isGuest: boolean;
  guestEmail?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  templates: Array<{
    templateId: string;
    templateTitle: string;
    quantity: number;
    measurements: IMeasurementValue[];
    sampleImageUrls?: string[];
  }>;
      notes?: string;
      preferredStyle?: string;
      status: MeasurementOrderStatus;
      paymentStatus: PaymentStatus;
      paymentMethod: string;
      paymentReference?: string;
      monnifyTransactionReference?: string;
      monnifyPaymentReference?: string;
      paymentUrl?: string;
      price?: number;
      priceSetAt?: Date;
      priceSetBy?: string;
      shippingLocation: string;
      tax?: number;
      deliveryFee?: number;
      paidAt?: Date;
      shippedAt?: Date;
      deliveredAt?: Date;
      cancelledAt?: Date;
      cancellationReason?: string;
      isReplaced?: boolean;
      replacedByOrderId?: string;
      originalOrderId?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }
