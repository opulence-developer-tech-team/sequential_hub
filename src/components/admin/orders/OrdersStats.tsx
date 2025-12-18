'use client'

import { Package, Ruler, AlertCircle, Clock, Truck, CheckCircle, XCircle, CreditCard, MapPin, TruckIcon, Scissors, Ruler as RulerIcon, Sparkles, Palette, CheckSquare } from 'lucide-react'
import type { TabType } from './types'

interface RegularOrderStats {
  orderPlaced: number
  processing: number
  packed: number
  shipped: number
  inTransit: number
  outForDelivery: number
  delivered: number
  cancelled: number
  failed: number
}

interface MeasurementOrderStats {
  orderReceived: number
  designReview: number
  fabricSelection: number
  patternMaking: number
  cutting: number
  sewing: number
  qualityCheck: number
  packed: number
  shipped: number
  inTransit: number
  outForDelivery: number
  delivered: number
  cancelled: number
}

interface OrdersStatsProps {
  activeTab: TabType
  totalOrders: number
  orderStats: RegularOrderStats | MeasurementOrderStats
}

export default function OrdersStats({ activeTab, totalOrders, orderStats }: OrdersStatsProps) {
  const regularStats = orderStats as RegularOrderStats
  const measurementStats = orderStats as MeasurementOrderStats

  const stats = activeTab === 'regular' 
    ? [
        { label: 'Total Orders', value: totalOrders, color: 'blue', icon: Package },
        { label: 'Order Placed', value: regularStats.orderPlaced, color: 'yellow', icon: Clock },
        { label: 'Processing', value: regularStats.processing, color: 'blue', icon: Package },
        { label: 'Packed', value: regularStats.packed, color: 'blue', icon: Package },
        { label: 'Shipped', value: regularStats.shipped, color: 'purple', icon: Truck },
        { label: 'In Transit', value: regularStats.inTransit, color: 'purple', icon: TruckIcon },
        { label: 'Out for Delivery', value: regularStats.outForDelivery, color: 'purple', icon: MapPin },
        { label: 'Delivered', value: regularStats.delivered, color: 'green', icon: CheckCircle },
        { label: 'Cancelled', value: regularStats.cancelled, color: 'red', icon: XCircle },
        { label: 'Failed', value: regularStats.failed, color: 'red', icon: AlertCircle },
      ]
    : [
        { label: 'Total Orders', value: totalOrders, color: 'blue', icon: Ruler },
        { label: 'Order Received', value: measurementStats.orderReceived, color: 'yellow', icon: Clock },
        { label: 'Design Review', value: measurementStats.designReview, color: 'blue', icon: Sparkles },
        { label: 'Fabric Selection', value: measurementStats.fabricSelection, color: 'blue', icon: Palette },
        { label: 'Pattern Making', value: measurementStats.patternMaking, color: 'purple', icon: RulerIcon },
        { label: 'Cutting', value: measurementStats.cutting, color: 'purple', icon: Scissors },
        { label: 'Sewing', value: measurementStats.sewing, color: 'purple', icon: Sparkles },
        { label: 'Quality Check', value: measurementStats.qualityCheck, color: 'yellow', icon: CheckSquare },
        { label: 'Packed', value: measurementStats.packed, color: 'blue', icon: Package },
        { label: 'Shipped', value: measurementStats.shipped, color: 'purple', icon: Truck },
        { label: 'In Transit', value: measurementStats.inTransit, color: 'purple', icon: TruckIcon },
        { label: 'Out for Delivery', value: measurementStats.outForDelivery, color: 'purple', icon: MapPin },
        { label: 'Delivered', value: measurementStats.delivered, color: 'green', icon: CheckCircle },
        { label: 'Cancelled', value: measurementStats.cancelled, color: 'red', icon: XCircle },
      ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; iconBg: string; iconText: string }> = {
      blue: {
        bg: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-700',
        iconBg: 'bg-blue-200',
        iconText: 'text-blue-700',
      },
      yellow: {
        bg: 'from-yellow-50 to-amber-100',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        iconBg: 'bg-yellow-200',
        iconText: 'text-yellow-700',
      },
      green: {
        bg: 'from-green-50 to-green-100',
        border: 'border-green-200',
        text: 'text-green-700',
        iconBg: 'bg-green-200',
        iconText: 'text-green-700',
      },
      purple: {
        bg: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
        text: 'text-purple-700',
        iconBg: 'bg-purple-200',
        iconText: 'text-purple-700',
      },
      red: {
        bg: 'from-red-50 to-red-100',
        border: 'border-red-200',
        text: 'text-red-700',
        iconBg: 'bg-red-200',
        iconText: 'text-red-700',
      },
    }
    return colors[color] || colors.blue
  }

  // Filter out stats with value 0, but always show Total Orders
  const visibleStats = stats.filter((stat) => stat.value > 0 || stat.label === 'Total Orders')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {visibleStats.map((stat, index) => {
        const Icon = stat.icon
        const colors = getColorClasses(stat.color)
        const valueColor = stat.color === 'blue' ? 'text-blue-900' : 
                          stat.color === 'yellow' ? 'text-yellow-900' :
                          stat.color === 'green' ? 'text-green-900' :
                          stat.color === 'purple' ? 'text-purple-900' :
                          'text-red-900'
        
        return (
          <div
            key={index}
            className={`bg-gradient-to-br ${colors.bg} rounded-xl shadow-sm border ${colors.border} p-6 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${colors.text} mb-1`}>
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${valueColor}`}>{stat.value}</p>
              </div>
              <div className={`p-3 ${colors.iconBg} rounded-xl`}>
                <Icon className={`h-7 w-7 ${colors.iconText}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

