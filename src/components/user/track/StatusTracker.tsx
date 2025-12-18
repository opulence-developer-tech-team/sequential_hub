'use client'

import { motion } from 'framer-motion'
import { 
  Clock, 
  Package, 
  Truck, 
  TruckIcon, 
  MapPin, 
  CheckCircle2,
  Sparkles,
  Palette,
  Ruler,
  Scissors,
  CheckSquare
} from 'lucide-react'
import { formatStatus } from './utils'
import { OrderStatus } from '@/lib/server/order/interface'
import { MeasurementOrderStatus } from '@/lib/server/measurementOrder/interface'

interface StatusTrackerProps {
  status: string
  orderType: 'regular' | 'measurement'
}

// Regular order status steps
const regularOrderSteps = [
  { status: OrderStatus.OrderPlaced, icon: Clock, label: 'Order Placed' },
  { status: OrderStatus.Processing, icon: Package, label: 'Processing' },
  { status: OrderStatus.Packed, icon: Package, label: 'Packed' },
  { status: OrderStatus.Shipped, icon: Truck, label: 'Shipped' },
  { status: OrderStatus.InTransit, icon: TruckIcon, label: 'In Transit' },
  { status: OrderStatus.OutForDelivery, icon: MapPin, label: 'Out for Delivery' },
  { status: OrderStatus.Delivered, icon: CheckCircle2, label: 'Delivered' },
]

// Measurement order status steps
const measurementOrderSteps = [
  { status: MeasurementOrderStatus.OrderReceived, icon: Clock, label: 'Order Received' },
  { status: MeasurementOrderStatus.DesignReview, icon: Sparkles, label: 'Design Review' },
  { status: MeasurementOrderStatus.FabricSelection, icon: Palette, label: 'Fabric Selection' },
  { status: MeasurementOrderStatus.PatternMaking, icon: Ruler, label: 'Pattern Making' },
  { status: MeasurementOrderStatus.Cutting, icon: Scissors, label: 'Cutting' },
  { status: MeasurementOrderStatus.Sewing, icon: Sparkles, label: 'Sewing' },
  { status: MeasurementOrderStatus.QualityCheck, icon: CheckSquare, label: 'Quality Check' },
  { status: MeasurementOrderStatus.Packed, icon: Package, label: 'Packed' },
  { status: MeasurementOrderStatus.Shipped, icon: Truck, label: 'Shipped' },
  { status: MeasurementOrderStatus.InTransit, icon: TruckIcon, label: 'In Transit' },
  { status: MeasurementOrderStatus.OutForDelivery, icon: MapPin, label: 'Out for Delivery' },
  { status: MeasurementOrderStatus.Delivered, icon: CheckCircle2, label: 'Delivered' },
]

export default function StatusTracker({ status, orderType }: StatusTrackerProps) {
  const steps = orderType === 'regular' ? regularOrderSteps : measurementOrderSteps
  const currentStatusIndex = steps.findIndex(step => step.status === status || step.status.toLowerCase() === status.toLowerCase())
  const isCompleted = currentStatusIndex === steps.length - 1 || status.toLowerCase() === 'completed' || status.toLowerCase() === 'delivered'
  const isCancelled = status.toLowerCase() === 'cancelled' || status.toLowerCase() === 'failed'

  if (isCancelled) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-red-200">
        <div className="flex items-center justify-center gap-4 text-red-600">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Package className="h-12 w-12" />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold">Order Cancelled</h3>
            <p className="text-sm text-red-500">This order has been cancelled</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-2xl shadow-lg p-8 border border-primary-100">
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          {orderType === 'regular' ? 'Delivery Status' : 'Production Status'}
        </h3>
        <p className="text-primary-600 text-sm">
          Track your {orderType === 'regular' ? 'order' : 'custom clothing'} journey
        </p>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200">
          <motion.div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary-500 to-primary-600"
            initial={{ height: '0%' }}
            animate={{ 
              height: currentStatusIndex >= 0 ? `${(currentStatusIndex / (steps.length - 1)) * 100}%` : '0%' 
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}
          />
        </div>

        {/* Status Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const isActive = index === currentStatusIndex
            const isCompleted = index < currentStatusIndex
            const isUpcoming = index > currentStatusIndex
            const Icon = step.icon

            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-6"
              >
                {/* Icon Circle */}
                <div className="relative z-10">
                  <motion.div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      border-2 transition-all duration-300
                      ${isCompleted 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/50' 
                        : isActive 
                        ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/50' 
                        : 'bg-white border-gray-300 text-gray-400'
                      }
                    `}
                    animate={isActive ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0.4)',
                        '0 0 0 10px rgba(59, 130, 246, 0)',
                        '0 0 0 0 rgba(59, 130, 246, 0)',
                      ],
                    } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: isActive ? Infinity : 0,
                      ease: 'easeInOut'
                    }}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <CheckCircle2 className="h-8 w-8" />
                      </motion.div>
                    ) : (
                      <Icon className={`h-8 w-8 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </motion.div>
                  
                  {/* Pulsing ring for active status */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary-400"
                      animate={{
                        scale: [1, 1.5, 1.5],
                        opacity: [0.8, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <motion.div
                    animate={isActive ? {
                      x: [0, 5, 0],
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  >
                    <h4 className={`
                      text-lg font-semibold mb-1
                      ${isCompleted || isActive 
                        ? 'text-primary-700' 
                        : 'text-gray-400'
                      }
                    `}>
                      {step.label}
                    </h4>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-sm text-primary-600 font-medium"
                      >
                        In progress...
                      </motion.p>
                    )}
                    {isCompleted && (
                      <p className="text-sm text-gray-500">
                        Completed
                      </p>
                    )}
                    {isUpcoming && (
                      <p className="text-sm text-gray-400">
                        Upcoming
                      </p>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Current Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 pt-6 border-t border-primary-200"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 text-white">
          <div>
            <p className="text-sm text-primary-100 mb-1">Current Status</p>
            <p className="text-xl font-semibold">{formatStatus(status)}</p>
          </div>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {orderType === 'regular' ? (
              <Truck className="h-8 w-8 text-primary-200" />
            ) : (
              <Sparkles className="h-8 w-8 text-primary-200" />
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}



















