import { MeasurementOrderStatus } from '@/lib/server/measurementOrder/interface'
import { OrderStatus, PaymentStatus } from '@/lib/server/order/interface'

export interface RegularOrder {
  orderType: 'regular'
  order: {
    _id: string
    orderNumber: string
    items: Array<{
      productName: string
      productSlug?: string
      variantSize: string
      variantColor: string
      quantity: number
      itemTotal: number
      variantImageUrls: string[] // Array of image URLs for the variant
      measurements?: {
        neck?: number
        shoulder?: number
        chest?: number
        shortSleeve?: number
        longSleeve?: number
        roundSleeve?: number
        tummy?: number
        topLength?: number
        waist?: number
        laps?: number
        kneelLength?: number
        roundKneel?: number
        trouserLength?: number
        quarterLength?: number
        ankle?: number
      } | null
    }>
    shippingAddress: {
      firstName: string
      lastName: string
      email: string
      phone: string
      address: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    subtotal: number
    shipping: number
    tax: number
    total: number
    shippingLocation?: string
    orderStatus: OrderStatus
    paymentStatus: PaymentStatus
    createdAt?: string
    paidAt?: string
    shippedAt?: string
    deliveredAt?: string
  }
}

export interface MeasurementOrder {
  orderType: 'measurement'
  order: {
    _id: string
    orderNumber: string
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    templates: Array<{
      templateId: string
      templateTitle: string
      quantity: number
      measurements: Array<{
        fieldName: string
        value: number
      }>
      sampleImageUrls?: string[]
    }>
    notes?: string
    preferredStyle?: string
    status: MeasurementOrderStatus
    paymentStatus: PaymentStatus
    price?: number
    shippingLocation?: string
    tax?: number
    deliveryFee?: number
    createdAt?: string
    paidAt?: string
    shippedAt?: string
    deliveredAt?: string
  }
}

export type TrackedOrder = RegularOrder | MeasurementOrder











































