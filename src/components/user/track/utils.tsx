'use client'

import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Truck, 
  Loader2, 
  Package, 
  MapPin, 
  TruckIcon,
  Home,
  Scissors,
  Ruler,
  CheckSquare,
  Sparkles,
  Palette
} from 'lucide-react'

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    // Regular order statuses
    case 'order_placed':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'processing':
      return 'bg-primary-100 text-primary-800 border-primary-200'
    case 'packed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'in_transit':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'out_for_delivery':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    // Measurement order statuses
    case 'order_received':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'design_review':
      return 'bg-primary-100 text-primary-800 border-primary-200'
    case 'fabric_selection':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'pattern_making':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'cutting':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'sewing':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'quality_check':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'packed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'in_transit':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'out_for_delivery':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    // Payment statuses
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    // Legacy support
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    // Regular order statuses
    case 'order_placed':
      return <Clock className="h-4 w-4" />
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin" />
    case 'packed':
      return <Package className="h-4 w-4" />
    case 'shipped':
      return <Truck className="h-4 w-4" />
    case 'in_transit':
      return <TruckIcon className="h-4 w-4" />
    case 'out_for_delivery':
      return <MapPin className="h-4 w-4" />
    case 'delivered':
      return <CheckCircle2 className="h-4 w-4" />
    // Measurement order statuses
    case 'order_received':
      return <Clock className="h-4 w-4" />
    case 'design_review':
      return <Sparkles className="h-4 w-4" />
    case 'fabric_selection':
      return <Palette className="h-4 w-4" />
    case 'pattern_making':
      return <Ruler className="h-4 w-4" />
    case 'cutting':
      return <Scissors className="h-4 w-4" />
    case 'sewing':
      return <Sparkles className="h-4 w-4" />
    case 'quality_check':
      return <CheckSquare className="h-4 w-4" />
    case 'packed':
      return <Package className="h-4 w-4" />
    case 'shipped':
      return <Truck className="h-4 w-4" />
    case 'in_transit':
      return <TruckIcon className="h-4 w-4" />
    case 'out_for_delivery':
      return <MapPin className="h-4 w-4" />
    case 'delivered':
      return <CheckCircle2 className="h-4 w-4" />
    // Payment statuses
    case 'paid':
      return <CheckCircle2 className="h-4 w-4" />
    case 'cancelled':
    case 'failed':
      return <XCircle className="h-4 w-4" />
    // Legacy support
    case 'pending':
      return <Clock className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export const formatStatus = (status: string) => {
  switch (status.toLowerCase()) {
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
    // Legacy support
    case 'pending':
      return 'Pending'
    default:
      return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }
}











































