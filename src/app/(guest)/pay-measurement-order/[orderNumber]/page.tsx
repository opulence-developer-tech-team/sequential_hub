'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useHttp } from '@/hooks/useHttp'
import { toast } from 'sonner'
import { CreditCard, Loader2, AlertCircle, Package, MapPin, User, Phone, Mail, Ruler, Image as ImageIcon, FileText, Palette } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Image from 'next/image'

interface MeasurementOrder {
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
  price?: number
  status: string
  createdAt?: string
}

export default function PayMeasurementOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderNumber = params.orderNumber as string
  const [order, setOrder] = useState<MeasurementOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  
  const { sendHttpRequest: fetchOrderReq } = useHttp()
  const { isLoading: isProcessing, sendHttpRequest: processPaymentReq } = useHttp()

  // Fetch order details
  useEffect(() => {
    if (!orderNumber) {
      toast.error('Invalid order number')
      router.push('/')
      return
    }

    fetchOrderReq({
      requestConfig: {
        url: `/guest/track-order?orderNumber=${orderNumber}`,
        method: 'GET',
      },
      successRes: (response: any) => {
        const orderData = response?.data?.data
        if (orderData && orderData.orderType === 'measurement') {
          setOrder(orderData.order)
          setIsLoading(false)
        } else {
          toast.error('Order not found or invalid order type')
          router.push('/')
        }
      },
    })
  }, [orderNumber, fetchOrderReq, router])

  // Handle payment
  const handlePayment = () => {
    if (!order || !order.price || order.price <= 0) {
      toast.error('Price not set for this order')
      return
    }

    setIsProcessingPayment(true)
    processPaymentReq({
      requestConfig: {
        url: '/payment/checkout-measurement-order',
        method: 'POST',
        body: {
          orderId: order._id,
          orderNumber: order.orderNumber,
        },
      },
      successRes: (response: any) => {
        const checkoutUrl = response?.data?.data?.checkoutUrl
        if (checkoutUrl) {
          window.location.href = checkoutUrl
        } else {
          toast.error('Failed to initialize payment')
          setIsProcessingPayment(false)
        }
      },
    })
  }

  // Reset processing state when request completes
  useEffect(() => {
    if (!isProcessing && isProcessingPayment) {
      setIsProcessingPayment(false)
    }
  }, [isProcessing, isProcessingPayment])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading order details..." />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!order.price || order.price <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <Package className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Price Not Set</h2>
          <p className="text-gray-600 mb-4">
            The price for this measurement order has not been set yet. Please contact support or wait for the price to be set.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 mb-4 tracking-tight">
            Complete Your Payment
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Order #{order.orderNumber}
          </p>
        </div>

        <div className="space-y-8">
          {/* Customer Information */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="h-5 w-5 text-gray-700" />
              </div>
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Full Name</p>
                <p className="text-lg text-gray-900 font-light">{order.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </p>
                <p className="text-lg text-gray-900 font-light break-all">{order.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </p>
                <p className="text-lg text-gray-900 font-light">{order.phone}</p>
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-700" />
              </div>
              Shipping Address
            </h2>
            <div className="text-gray-900 space-y-1">
              <p className="text-lg font-light">{order.address}</p>
              <p className="text-lg font-light text-gray-600">{order.city}, {order.state} {order.zipCode}</p>
              <p className="text-lg font-light text-gray-600">{order.country}</p>
            </div>
          </section>

          {/* Measurement Templates */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Ruler className="h-5 w-5 text-gray-700" />
              </div>
              Measurement Templates
              <span className="text-lg font-normal text-gray-500">({order.templates.length})</span>
            </h2>
            <div className="space-y-6">
              {order.templates.map((template, index) => (
                <div key={template.templateId || index} className="border-t border-gray-100 pt-6 first:border-t-0 first:pt-0">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{template.templateTitle}</h3>
                    <span className="text-sm text-gray-600 bg-gray-50 px-4 py-1.5 rounded-full font-medium">
                      Qty: {template.quantity}
                    </span>
                  </div>

                  {/* Measurements */}
                  {template.measurements && template.measurements.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Measurements</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {template.measurements.map((measurement, mIndex) => (
                          <div key={mIndex} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{measurement.fieldName}</p>
                            <p className="text-lg font-semibold text-gray-900">{measurement.value} <span className="text-sm font-normal text-gray-500">cm</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Images */}
                  {template.sampleImageUrls && template.sampleImageUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Sample Images ({template.sampleImageUrls.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {template.sampleImageUrls.map((imageUrl, imgIndex) => (
                          <div key={imgIndex} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                            <Image
                              src={imageUrl}
                              alt={`Sample ${imgIndex + 1}`}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Additional Information */}
          {(order.notes || order.preferredStyle) && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-700" />
                </div>
                Additional Information
              </h2>
              <div className="space-y-6">
                {order.preferredStyle && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Preferred Style
                    </p>
                    <p className="text-lg text-gray-900 font-light">{order.preferredStyle}</p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-lg text-gray-900 font-light whitespace-pre-wrap leading-relaxed">{order.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Price Summary & Payment */}
          <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 text-white">
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/10">
              <span className="text-xl font-light text-gray-300">Total Amount</span>
              <span className="text-4xl sm:text-5xl font-semibold tracking-tight">
                {formatPrice(order.price)}
              </span>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessingPayment || isProcessing}
              className="w-full bg-white text-gray-900 py-4 px-8 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-lg"
            >
              {isProcessingPayment || isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>Pay {formatPrice(order.price)}</span>
                </>
              )}
            </button>

            <p className="mt-6 text-sm text-gray-400 text-center font-light">
              You will be redirected to a secure payment page to complete your transaction.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

