'use client'

import { OrderStatus, PaymentStatus } from '@/lib/server/order/interface'
import { MeasurementOrderStatus } from '@/lib/server/measurementOrder/interface'
import type { StatusOption, TabType } from './types'
import { Clock, Truck, CheckCircle, XCircle, Package, MapPin, TruckIcon, Home, Scissors, Ruler, CheckSquare, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export const getStatusOptions = (activeTab: TabType): StatusOption[] => {
  if (activeTab === 'regular') {
    return [
      { value: '', label: 'All Statuses' },
      { value: OrderStatus.OrderPlaced, label: 'Order Placed' },
      { value: OrderStatus.Processing, label: 'Processing' },
      { value: OrderStatus.Packed, label: 'Packed' },
      { value: OrderStatus.Shipped, label: 'Shipped' },
      { value: OrderStatus.InTransit, label: 'In Transit' },
      { value: OrderStatus.OutForDelivery, label: 'Out for Delivery' },
      { value: OrderStatus.Delivered, label: 'Delivered' },
      { value: OrderStatus.Cancelled, label: 'Cancelled' },
      { value: PaymentStatus.Paid, label: 'Paid' },
      { value: PaymentStatus.Failed, label: 'Payment Failed' },
    ]
  } else {
    return [
      { value: '', label: 'All Statuses' },
      { value: MeasurementOrderStatus.OrderReceived, label: 'Order Received' },
      { value: MeasurementOrderStatus.DesignReview, label: 'Design Review' },
      { value: MeasurementOrderStatus.FabricSelection, label: 'Fabric Selection' },
      { value: MeasurementOrderStatus.PatternMaking, label: 'Pattern Making' },
      { value: MeasurementOrderStatus.Cutting, label: 'Cutting' },
      { value: MeasurementOrderStatus.Sewing, label: 'Sewing' },
      { value: MeasurementOrderStatus.QualityCheck, label: 'Quality Check' },
      { value: MeasurementOrderStatus.Packed, label: 'Packed' },
      { value: MeasurementOrderStatus.Shipped, label: 'Shipped' },
      { value: MeasurementOrderStatus.InTransit, label: 'In Transit' },
      { value: MeasurementOrderStatus.OutForDelivery, label: 'Out for Delivery' },
      { value: MeasurementOrderStatus.Delivered, label: 'Delivered' },
      { value: MeasurementOrderStatus.Cancelled, label: 'Cancelled' },
    ]
  }
}

export const getStatusIcon = (status: string): ReactNode => {
  switch (status) {
    // Regular order statuses
    case 'order_placed':
      return <Clock className="h-4 w-4" />
    case 'processing':
      return <Package className="h-4 w-4" />
    case 'packed':
      return <Package className="h-4 w-4" />
    case 'shipped':
      return <Truck className="h-4 w-4" />
    case 'in_transit':
      return <TruckIcon className="h-4 w-4" />
    case 'out_for_delivery':
      return <MapPin className="h-4 w-4" />
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />
    case 'cancelled':
      return <XCircle className="h-4 w-4" />
    case 'failed':
      return <XCircle className="h-4 w-4" />
    // Measurement order statuses
    case 'order_received':
      return <Clock className="h-4 w-4" />
    case 'design_review':
      return <Sparkles className="h-4 w-4" />
    case 'fabric_selection':
      return <Ruler className="h-4 w-4" />
    case 'pattern_making':
      return <Ruler className="h-4 w-4" />
    case 'cutting':
      return <Scissors className="h-4 w-4" />
    case 'sewing':
      return <Sparkles className="h-4 w-4" />
    case 'quality_check':
      return <CheckSquare className="h-4 w-4" />
    case 'completed':
      return <CheckCircle className="h-4 w-4" />
    // Payment statuses
    case 'paid':
      return <CheckCircle className="h-4 w-4" />
    // Legacy support
    case 'pending':
      return <Clock className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    // Regular order statuses
    case 'order_placed':
      return 'bg-yellow-100 text-yellow-800'
    case 'processing':
      return 'bg-primary-100 text-primary-800'
    case 'packed':
      return 'bg-blue-100 text-blue-800'
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800'
    case 'in_transit':
      return 'bg-purple-100 text-purple-800'
    case 'out_for_delivery':
      return 'bg-pink-100 text-pink-800'
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    // Measurement order statuses
    case 'order_received':
      return 'bg-yellow-100 text-yellow-800'
    case 'design_review':
      return 'bg-primary-100 text-primary-800'
    case 'fabric_selection':
      return 'bg-blue-100 text-blue-800'
    case 'pattern_making':
      return 'bg-indigo-100 text-indigo-800'
    case 'cutting':
      return 'bg-purple-100 text-purple-800'
    case 'sewing':
      return 'bg-pink-100 text-pink-800'
    case 'quality_check':
      return 'bg-amber-100 text-amber-800'
    case 'packed':
      return 'bg-blue-100 text-blue-800'
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800'
    case 'in_transit':
      return 'bg-purple-100 text-purple-800'
    case 'out_for_delivery':
      return 'bg-pink-100 text-pink-800'
    case 'delivered':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    // Payment statuses
    case 'paid':
      return 'bg-green-100 text-green-800'
    // Legacy support
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const formatStatus = (status: string): string => {
  switch (status) {
    // Regular order statuses
    case 'order_placed':
      return 'Order Placed'
    case 'processing':
      return 'Processing'
    case 'packed':
      return 'Packed'
    case 'shipped':
      return 'Shipped'
    case 'in_transit':
      return 'In Transit'
    case 'out_for_delivery':
      return 'Out for Delivery'
    case 'delivered':
      return 'Delivered'
    // Measurement order statuses
    case 'order_received':
      return 'Order Received'
    case 'design_review':
      return 'Design Review'
    case 'fabric_selection':
      return 'Fabric Selection'
    case 'pattern_making':
      return 'Pattern Making'
    case 'cutting':
      return 'Cutting'
    case 'sewing':
      return 'Sewing'
    case 'quality_check':
      return 'Quality Check'
    case 'packed':
      return 'Packed'
    case 'shipped':
      return 'Shipped'
    case 'in_transit':
      return 'In Transit'
    case 'out_for_delivery':
      return 'Out for Delivery'
    case 'delivered':
      return 'Delivered'
    case 'cancelled':
      return 'Cancelled'
    case 'failed':
      return 'Failed'
    // Payment statuses
    case 'paid':
      return 'Paid'
    case 'pending':
      return 'Pending'
    case 'processing':
      return 'Processing'
    // Legacy support
    default:
      return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }
}

