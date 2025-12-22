'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Loader2, Package, Ruler, ArrowRight, Home, Receipt, LogIn } from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import { formatPrice, formatDate } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Image from 'next/image'
import ProductReviewsSection from '@/components/user/reviews/ProductReviewsSection'
import { MapPin, Mail, Phone, Calendar, CreditCard, FileText, User, Package as PackageIcon } from 'lucide-react'

interface ShippingAddress {
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

interface BillingAddress {
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

interface OrderData {
  order: {
    _id: string
    orderNumber: string
    userId?: string
    isGuest?: boolean
    guestEmail?: string
    total?: number
    price?: number
    subtotal?: number
    shipping?: number
    tax?: number
    shippingLocation?: string
    deliveryFee?: number
    paymentStatus: string
    orderStatus?: string
    status?: string
    paymentMethod?: string
    shippingAddress?: ShippingAddress
    billingAddress?: BillingAddress
    items?: Array<{
      productId: string
      productName: string
      productSlug?: string
      variantSize: string
      variantColor: string
      quantity: number
      itemTotal: number
      variantImageUrls: string[] // Array of image URLs for the variant
      variantPrice?: number
      variantDiscountPrice?: number
      itemSubtotal?: number
    }>
    templates?: Array<{
      templateId?: string
      templateTitle: string
      quantity: number
      measurements?: any
      sampleImageUrls?: string[]
    }>
    // Measurement order specific fields
    name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    notes?: string
    preferredStyle?: string
    // Dates
    paidAt?: string | Date
    shippedAt?: string | Date
    deliveredAt?: string | Date
    cancelledAt?: string | Date
    cancellationReason?: string
    createdAt?: string | Date
    updatedAt?: string | Date
    orderType?: 'regular' | 'measurement'
  }
  transaction?: any
  orderType?: 'regular' | 'measurement'
}

type PaymentStatus = 'success' | 'failed' | 'pending' | 'processing'

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('processing')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  
  const { sendHttpRequest, isLoading } = useHttp()

  useEffect(() => {
    // Get reference from query params
    const transactionReference = searchParams.get('transactionReference')
    const paymentReference = searchParams.get('paymentReference')
    const orderNumber = searchParams.get('orderNumber')

    // Use the first available reference
    const reference = transactionReference || paymentReference || orderNumber

    if (!reference) {
      setError('No payment reference found. Please check your payment confirmation.')
      setPaymentStatus('failed')
      return
    }

    // Verify payment
    sendHttpRequest({
      requestConfig: {
        method: 'GET',
        url: `/payment/verify?${transactionReference ? `transactionReference=${transactionReference}` : ''}${paymentReference ? `&paymentReference=${paymentReference}` : ''}${orderNumber ? `&orderNumber=${orderNumber}` : ''}`,
      },
      successRes: (response: any) => {
        if (response?.data?.data) {
          const data = response.data.data
          setOrderData(data)
          
          // Determine payment status
          const status = data.order?.paymentStatus?.toLowerCase()
          if (status === 'paid') {
            setPaymentStatus('success')
          } else if (status === 'failed' || status === 'cancelled') {
            setPaymentStatus('failed')
          } else if (status === 'pending') {
            setPaymentStatus('pending')
          } else {
            setPaymentStatus('success') // Default to success if status is unclear
          }
        } else {
          setError('Unable to verify payment. Please contact support.')
          setPaymentStatus('failed')
        }
      },
    })
  }, [searchParams, sendHttpRequest])

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: CheckCircle2,
          title: 'Payment Successful!',
          description: 'Your payment has been confirmed and your order is being processed.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBg: 'bg-green-100',
        }
      case 'failed':
        return {
          icon: XCircle,
          title: 'Payment Failed',
          description: error || 'Your payment could not be processed. Please try again or contact support.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconBg: 'bg-red-100',
        }
      case 'pending':
        return {
          icon: Clock,
          title: 'Payment Pending',
          description: 'Your payment is being processed. Please wait a few moments and refresh this page.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
        }
      default:
        return {
          icon: Loader2,
          title: 'Verifying Payment...',
          description: 'Please wait while we verify your payment.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBg: 'bg-blue-100',
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon
  const isMeasurementOrder = orderData?.orderType === 'measurement' || (orderData?.order?.templates && orderData.order.templates.length > 0)
  const orderTotal = orderData?.order?.total || orderData?.order?.price || 0
  const order = orderData?.order
  
  // Check if user has an account (userId exists means they have an account, even if not currently logged in)
  const hasAccount = order?.userId && !order?.isGuest
  const isGuest = order?.isGuest === true || !order?.userId
  
  // Format dates
  const formatDateTime = (date: string | Date | undefined): string => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Local placeholder lives in /public; avoids broken `/placeholder-image.jpg`.
  const FALLBACK_IMAGE_SRC = '/file.svg'

  type OrderItem = NonNullable<OrderData['order']['items']>[number]

  const normalizeImageUrl = (url: string) => {
    const trimmed = url.trim()
    // Next/Image remotePatterns allow https; upgrade http if present.
    if (trimmed.startsWith('http://')) return `https://${trimmed.slice('http://'.length)}`
    return trimmed
  }

  const getOrderItemImageSrc = (item: OrderItem) => {
    if (Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0) {
      const first = item.variantImageUrls[0]
      if (typeof first === 'string' && first.trim().length > 0) return normalizeImageUrl(first)
    }

    // Backward compatibility: check for variantImageUrl (singular)
    const itemAny = item as any
    if (typeof itemAny.variantImageUrl === 'string' && itemAny.variantImageUrl.trim().length > 0) {
      return normalizeImageUrl(itemAny.variantImageUrl)
    }

    return FALLBACK_IMAGE_SRC
  }
  
  // Check if billing address is different from shipping
  const hasDifferentBilling = order?.billingAddress && 
    order?.shippingAddress &&
    JSON.stringify(order.billingAddress) !== JSON.stringify(order.shippingAddress)

  if (isLoading && !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner text="Verifying your payment..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8"
        >
          {/* Status Header */}
          <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-b-2 p-8 sm:p-12 text-center`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
              className={`inline-flex items-center justify-center w-24 h-24 ${statusConfig.iconBg} rounded-full mb-6`}
            >
              <StatusIcon 
                className={`h-12 w-12 ${statusConfig.color} ${paymentStatus === 'processing' ? 'animate-spin' : ''}`} 
              />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl sm:text-5xl font-semibold ${statusConfig.color} mb-4 tracking-tight`}
            >
              {statusConfig.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-700 font-light max-w-2xl mx-auto leading-relaxed"
            >
              {statusConfig.description}
            </motion.p>
          </div>

          {/* Order Details */}
          {orderData?.order && (
            <div className="p-8 sm:p-12">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Order Number */}
                <div className="text-center pb-8 border-b border-gray-200">
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-2">Order Number</p>
                  <p className="text-2xl font-mono font-semibold text-gray-900">{orderData.order.orderNumber}</p>
                </div>

                {/* Customer Information (for measurement orders) */}
                {isMeasurementOrder && order && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.name && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                          <p className="text-sm font-medium text-gray-900">{order.name}</p>
                        </div>
                      )}
                      {order.email && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {order.email}
                          </p>
                        </div>
                      )}
                      {order.phone && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.phone}
                          </p>
                        </div>
                      )}
                      {order.address && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                          <p className="text-sm font-medium text-gray-900 flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>
                              {order.address}, {order.city}, {order.state} {order.zipCode}, {order.country}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Notes and Preferred Style */}
                    {(order.notes || order.preferredStyle) && (
                      <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                        {order.notes && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Notes
                            </p>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                          </div>
                        )}
                        {order.preferredStyle && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preferred Style</p>
                            <p className="text-sm text-gray-700">{order.preferredStyle}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Type & Items */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    {isMeasurementOrder ? (
                      <Ruler className="h-6 w-6 text-gray-400" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isMeasurementOrder ? 'Measurement Order' : 'Product Order'}
                    </h2>
                  </div>

                  {isMeasurementOrder && orderData.order.templates ? (
                    <div className="space-y-4">
                      {orderData.order.templates.map((template, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{template.templateTitle}</p>
                              {template.templateId && (
                                <p className="text-xs text-gray-500 font-mono mt-1">ID: {template.templateId}</p>
                              )}
                            </div>
                            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full flex-shrink-0">
                              Qty: {template.quantity}
                            </span>
                          </div>
                          {template.sampleImageUrls && template.sampleImageUrls.length > 0 && (
                            <div className="mt-3 flex gap-2">
                              {template.sampleImageUrls.map((url, imgIndex) => (
                                <div key={imgIndex} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                  <Image
                                    src={url}
                                    alt={`Sample ${imgIndex + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : orderData.order.items ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {orderData.order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {(() => {
                                const itemKey = `${item.productId}-${index}`
                                const src = imageErrors[itemKey] ? FALLBACK_IMAGE_SRC : getOrderItemImageSrc(item)
                                return (
                              <Image
                                src={src}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                sizes="64px"
                                onError={() => {
                                  // Avoid loops if fallback itself fails
                                  if (!imageErrors[itemKey]) {
                                    setImageErrors((prev) => ({ ...prev, [itemKey]: true }))
                                  }
                                }}
                              />
                                )
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-600">
                                <span className="inline-flex flex-wrap items-center gap-2">
                                  <span>{item.variantSize}</span>
                                  <span aria-hidden="true">•</span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <span>Color:</span>
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-gray-200"
                                      style={{ backgroundColor: item.variantColor || '#ffffff' }}
                                      aria-label={`Color: ${item.variantColor || 'N/A'}`}
                                      title={item.variantColor || 'N/A'}
                                    />
                                  </span>
                                  <span aria-hidden="true">•</span>
                                  <span>Qty: {item.quantity}</span>
                                </span>
                              </p>
                              {item.variantPrice && item.variantDiscountPrice && item.variantDiscountPrice < item.variantPrice && (
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">{formatPrice(item.variantPrice)}</span>
                                  <span className="text-xs font-medium text-green-600">{formatPrice(item.variantDiscountPrice)} each</span>
                                </div>
                              )}
                              {item.itemSubtotal && item.itemSubtotal !== item.itemTotal && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Subtotal: {formatPrice(item.itemSubtotal)} → Total: {formatPrice(item.itemTotal)}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-gray-900">{formatPrice(item.itemTotal)}</p>
                              {item.itemSubtotal && item.itemSubtotal !== item.itemTotal && (
                                <p className="text-xs text-gray-400 line-through">{formatPrice(item.itemSubtotal)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ) : null}
                </div>

                {/* Shipping Address */}
                {order?.shippingAddress && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      Shipping Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {order.shippingAddress.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.shippingAddress.phone}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Address (if different) */}
                {hasDifferentBilling && order?.billingAddress && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      Billing Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.billingAddress.firstName} {order.billingAddress.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {order.billingAddress.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.billingAddress.phone}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.billingAddress.address}, {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}, {order.billingAddress.country}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                {orderTotal > 0 && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
                    {!isMeasurementOrder && orderData.order.subtotal !== undefined && (
                      <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Subtotal</span>
                          <span className="font-medium">{formatPrice(orderData.order.subtotal)}</span>
                        </div>
                        {orderData.order.shipping !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Shipping</span>
                            <span className="font-medium">
                              {orderData.order.shipping === 0 ? 'Free' : formatPrice(orderData.order.shipping)}
                            </span>
                          </div>
                        )}
                        {orderData.order.shippingLocation && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Shipping Location</span>
                            <span className="font-medium">{orderData.order.shippingLocation}</span>
                          </div>
                        )}
                        {orderData.order.tax !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Tax</span>
                            <span className="font-medium">{formatPrice(orderData.order.tax)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {isMeasurementOrder && orderData.order.price && (
                      <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Price</span>
                          <span className="font-medium">{formatPrice(orderData.order.price)}</span>
                        </div>
                        {orderData.order.shippingLocation && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Shipping Location</span>
                            <span className="font-medium">{orderData.order.shippingLocation}</span>
                          </div>
                        )}
                        {orderData.order.deliveryFee !== undefined && orderData.order.deliveryFee !== null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Delivery Fee</span>
                            <span className="font-medium">{formatPrice(orderData.order.deliveryFee)}</span>
                          </div>
                        )}
                        {orderData.order.tax !== undefined && orderData.order.tax !== null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Tax</span>
                            <span className="font-medium">{formatPrice(orderData.order.tax)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t border-white/20">
                      <span className="text-xl font-semibold text-white">Total Paid:</span>
                      <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                        {formatPrice(orderTotal)}
                      </span>
                    </div>
                    {orderData.order.paidAt && (
                      <p className="text-sm text-gray-400 mt-4 text-center">
                        Paid on {new Date(orderData.order.paidAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Information */}
                {order && order.paymentMethod && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{order.paymentMethod}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Timeline */}
                {order && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      Order Timeline
                    </h3>
                    <div className="space-y-3">
                      {order.createdAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <PackageIcon className="h-4 w-4" />
                            Order Created
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatDateTime(order.createdAt)}</span>
                        </div>
                      )}
                      {order.paidAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Confirmed
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatDateTime(order.paidAt)}</span>
                        </div>
                      )}
                      {order.shippedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Shipped
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatDateTime(order.shippedAt)}</span>
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Delivered
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatDateTime(order.deliveredAt)}</span>
                        </div>
                      )}
                      {order.cancelledAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Cancelled
                          </span>
                          <span className="text-sm font-medium text-red-900">{formatDateTime(order.cancelledAt)}</span>
                        </div>
                      )}
                      {order.cancellationReason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Cancellation Reason</p>
                          <p className="text-sm text-red-900">{order.cancellationReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 pt-6">
                  {/* Primary Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {isGuest ? (
                      // Guest user: Show Track Order button
                      <button
                        onClick={() => router.push(`/track-order/${orderData.order.orderNumber}`)}
                        className="flex-1 bg-gray-900 text-white py-4 px-8 rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <Receipt className="h-5 w-5" />
                        Track Order
                      </button>
                    ) : (
                      // User with account: Show both Track Order and Log In buttons
                      <>
                        <button
                          onClick={() => router.push(`/track-order/${orderData.order.orderNumber}`)}
                          className="flex-1 bg-gray-900 text-white py-4 px-8 rounded-xl hover:bg-gray-800 transition-all duration-200 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <Receipt className="h-5 w-5" />
                          Track Order
                        </button>
                        <button
                          onClick={() => router.push('/account?tab=orders')}
                          className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <LogIn className="h-5 w-5" />
                          View Orders
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Secondary Action */}
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-white text-gray-900 py-3 px-8 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-base border-2 border-gray-200 flex items-center justify-center gap-2"
                  >
                    <Home className="h-5 w-5" />
                    Go Home
                  </button>
                </div>
                
                {/* Info message for users with accounts */}
                {hasAccount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-4">
                    <p className="text-blue-900 text-sm font-medium text-center">
                      Want to see all your orders? Log in and go to <strong>Account</strong> → <strong>Orders</strong>
                    </p>
                  </div>
                )}

                {/* Additional Info for Success */}
                {paymentStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center"
                  >
                    <p className="text-blue-900 font-medium mb-2">What's Next?</p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {isMeasurementOrder 
                        ? 'Our master tailors will begin crafting your custom clothing. You\'ll receive updates on your order status via email.'
                        : 'Your order is being prepared for shipment. You\'ll receive a confirmation email with tracking information soon.'
                      }
                    </p>
                  </motion.div>
                )}

                {/* Additional Info for Failed */}
                {paymentStatus === 'failed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
                  >
                    <p className="text-red-900 font-medium mb-2">Need Help?</p>
                    <p className="text-red-800 text-sm leading-relaxed mb-4">
                      If you were charged but your payment failed, please contact our support team with your order number.
                    </p>
                    <a
                      href="mailto:support@sequentialhub.com"
                      className="inline-flex items-center gap-2 text-red-700 font-semibold hover:text-red-800 transition-colors"
                    >
                      Contact Support
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </motion.div>
                )}

                {/* Product Reviews Section - Last */}
                {paymentStatus === 'success' &&
                  !isMeasurementOrder &&
                  orderData.order.items &&
                  orderData.order.items.length > 0 &&
                  orderData.order.items[0]?.productId && (
                    <div className="mt-8">
                      <ProductReviewsSection
                        productId={orderData.order.items[0].productId}
                        productName={orderData.order.items[0].productName}
                      />
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !orderData && (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-900 text-white py-3 px-8 rounded-xl hover:bg-gray-800 transition-colors font-semibold"
              >
                Go Home
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}













































