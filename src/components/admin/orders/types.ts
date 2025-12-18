import type { Order } from '@/store/redux/adminSlice/order-slice'
import type { MeasurementOrder } from '@/store/redux/adminSlice/measurement-order-slice'
import { OrderStatus, PaymentStatus } from '@/lib/server/order/interface'
import { MeasurementOrderStatus } from '@/lib/server/measurementOrder/interface'

export type TabType = 'regular' | 'measurement'

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface StatusOption {
  value: string
  label: string
}

export type OrderItem = Order | MeasurementOrder

export { OrderStatus, PaymentStatus, MeasurementOrderStatus }
