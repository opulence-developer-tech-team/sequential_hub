'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, AlertCircle, Package, Sparkles } from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import { TrackedOrder } from '@/components/user/track/types'
import OrderDetails from '@/components/user/track/OrderDetails'

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { sendHttpRequest, isLoading } = useHttp()
  const orderDetailsRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTrackedOrder(null)

    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }

    sendHttpRequest({
      requestConfig: {
        method: 'GET',
        url: `/guest/track-order?orderNumber=${encodeURIComponent(orderNumber.trim())}`,
      },
      successRes: (response: any) => {
        if (response?.data?.data) {
          setTrackedOrder(response.data.data)
          // Scroll to order details after a short delay to allow rendering
          setTimeout(() => {
            if (orderDetailsRef.current) {
              const element = orderDetailsRef.current
              const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
              const offsetPosition = elementPosition - 100 // 100px offset from top
              
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              })
            }
          }, 100)
        } else {
          setError('Order not found. Please check your order number and try again.')
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          {/* Icon Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-6"
          >
            <Package className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4 tracking-tight"
          >
            Track Your Order
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Enter your order number below to check the status and details of your order
          </motion.p>
        </motion.div>

        {/* Search Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8 backdrop-blur-sm bg-opacity-90"
        >
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="Enter order number (e.g., ORD-20240115-ABC123 or MSO-20240115-ABC123)"
                  className="w-full pl-14 pr-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !orderNumber.trim()}
                className="w-full sm:w-auto sm:px-12 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-6 w-6" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </form>

            {/* Helper Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 pt-6 border-t border-gray-100"
            >
              <div className="flex items-start gap-3 text-sm text-gray-500">
                <Sparkles className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700 mb-1">Quick Tips</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Regular orders start with <span className="font-mono font-semibold">ORD-</span></li>
                    <li>• Measurement orders start with <span className="font-mono font-semibold">MSO-</span></li>
                    <li>• Order numbers are case-insensitive</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-lg"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Order Not Found</h3>
                <p className="text-red-800">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Details */}
        <AnimatePresence mode="wait">
          {trackedOrder && (
            <motion.div
              ref={orderDetailsRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <OrderDetails trackedOrder={trackedOrder} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
