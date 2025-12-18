'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { TrackedOrder } from '@/components/user/track/types'
import OrderDetails from '@/components/user/track/OrderDetails'

export default function TrackOrderByNumberPage() {
  const params = useParams()
  const router = useRouter()
  const orderNumber = params.orderNumber as string
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { sendHttpRequest, isLoading } = useHttp()

  useEffect(() => {
    if (!orderNumber) {
      setError('Invalid order number')
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
        } else {
          setError('Order not found. Please check your order number and try again.')
        }
      },
    })
  }, [orderNumber, sendHttpRequest])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading order details..." />
      </div>
    )
  }

  if (error || !trackedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you\'re looking for doesn\'t exist or has been removed.'}</p>
          <button
            onClick={() => router.push('/track-order')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Try Another Order Number
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <OrderDetails trackedOrder={trackedOrder} />
      </div>
    </div>
  )
}

