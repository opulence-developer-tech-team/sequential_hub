import { Document, Types } from "mongoose";

export enum OrderStatus {
  OrderPlaced = "order_placed",
  Processing = "processing",
  Packed = "packed",
  Shipped = "shipped",
  InTransit = "in_transit",
  OutForDelivery = "out_for_delivery",
  Delivered = "delivered",
  Cancelled = "cancelled",
  Failed = "failed",
}

export enum PaymentStatus {
  Pending = "pending", // Maps to Monnify's "PENDING"
  Paid = "paid", // Maps to Monnify's "PAID"
  Failed = "failed", // Maps to Monnify's "FAILED"
  Cancelled = "cancelled", // Maps to Monnify's "CANCELLED" or "USER_CANCELLED"
}

export interface IOrderItem {
  productId: Types.ObjectId;
  variantId: string;
  productName: string;
  productSlug: string;
  variantImageUrls: string[]; // Array of image URLs for the variant
  variantColor: string;
  variantSize: string;
  variantPrice: number;
  variantDiscountPrice: number;
  quantity: number;
  itemSubtotal: number;
  itemTotal: number;
   measurements?: {
    neck?: number;
    shoulder?: number;
    chest?: number;
    shortSleeve?: number;
    longSleeve?: number;
    roundSleeve?: number;
    tummy?: number;
    topLength?: number;
    waist?: number;
    laps?: number;
    kneelLength?: number;
    roundKneel?: number;
    trouserLength?: number;
    quarterLength?: number;
    ankle?: number;
  };
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IBillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string; // Unique order number (e.g., ORD-20240115-ABC123)
  userId?: Types.ObjectId; // Optional - null for guest orders
  isGuest: boolean;
  guestEmail?: string; // For guest orders
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingLocation: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string; // e.g., "monnify"
  paymentReference?: string; // Monnify transaction reference
  monnifyTransactionReference?: string; // Monnify transaction reference
  monnifyPaymentReference?: string; // Monnify payment reference
  paymentUrl?: string; // Monnify checkout URL
  paidAt?: Date;
  /**
   * Reservation tracking (prevents oversell while user pays)
   * - inventoryReservedAt: when stock was reserved for this order
   * - inventoryReservationExpiresAt: when reservation should be released if unpaid
   * - inventoryReservationReleasedAt: when reservation was actually released
   */
  inventoryReservedAt?: Date;
  inventoryReservationExpiresAt?: Date;
  inventoryReservationReleasedAt?: Date;
  /**
   * Inventory tracking (idempotency + audit)
   * - inventoryDeductedAt: set once after variant quantities are successfully decremented
   * - inventoryDeductionFailedAt/Error: set if payment is confirmed but inventory cannot be deducted (manual intervention required)
   */
  inventoryDeductedAt?: Date;
  inventoryDeductionFailedAt?: Date;
  inventoryDeductionError?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderUserInput {
  items: Array<{
    productId: string; // MongoDB ObjectId string
    variantId: string; // MongoDB ObjectId string
    quantity: number;
  }>;
  // Optional for authenticated users (fetched from database)
  // Required for guest users
  shippingAddress?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  sameAsShipping?: boolean;
  createAccount?: boolean;
  password?: string;
  confirmPassword?: string;
  shippingLocation: string;
}

export interface IOrderResponse {
  _id: string;
  orderNumber: string;
  userId?: string;
  isGuest: boolean;
  guestEmail?: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingLocation: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentReference?: string;
  monnifyTransactionReference?: string;
  monnifyPaymentReference?: string;
  paymentUrl?: string;
  paidAt?: Date;
  inventoryReservedAt?: Date;
  inventoryReservationExpiresAt?: Date;
  inventoryReservationReleasedAt?: Date;
  inventoryDeductedAt?: Date;
  inventoryDeductionFailedAt?: Date;
  inventoryDeductionError?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMonnifyCheckoutRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber: string;
  paymentDescription: string;
  currencyCode?: string;
  contractCode: string;
  redirectUrl: string;
  paymentReference: string;
  paymentMethods?: string[]; // Optional: ["CARD", "ACCOUNT_TRANSFER", "USSD"]
  metadata?: Record<string, any>;
}

export interface IMonnifyCheckoutResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    transactionReference: string;
    paymentReference: string;
    merchantName: string;
    apiKey: string;
    enabledPaymentMethod: string[];
    checkoutUrl: string;
  };
}

export interface IMonnifyWebhookPayload {
  eventType: string;
  eventData: {
    product: {
      type: string;
      reference: string;
    };
    transactionReference: string;
    paymentReference: string;
    amountPaid: string;
    totalPayable: string;
    settlementAmount: string;
    paidOn: string;
    paymentStatus: string;
    paymentDescription: string;
    currency: string;
    paymentMethod: string;
    customer: {
      email: string;
      name: string;
    };
    metaData?: Record<string, any>;
  };
}
