'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Package, Ruler, User, Mail, Phone, MapPin, Calendar, CreditCard, Truck, CheckCircle, XCircle, Clock, FileText, Image as ImageIcon, DollarSign, Save, Loader2 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/store/redux/adminSlice/order-slice'
import type { MeasurementOrder } from '@/store/redux/adminSlice/measurement-order-slice'
import type { TabType } from './types'
import { getStatusIcon, getStatusColor } from './utils'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'
import { toast } from 'sonner'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { adminActions } from '@/store/redux/adminSlice'
import ErrorState from '@/components/ui/ErrorState'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | MeasurementOrder | null
  activeTab: TabType
  onOrderUpdate?: (updatedOrder: Order | MeasurementOrder) => void
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  activeTab,
  onOrderUpdate,
}: OrderDetailsModalProps) {
  const dispatch = useAppDispatch()
  const [price, setPrice] = useState<string>('')
  const [isSettingPrice, setIsSettingPrice] = useState(false)
  const [isFetchingFullDetails, setIsFetchingFullDetails] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fullOrderDetails, setFullOrderDetails] = useState<Order | MeasurementOrder | null>(null)
  const { isLoading: isUpdatingPrice, sendHttpRequest: setPriceReq } = useHttp()
  const { sendHttpRequest: fetchFullDetailsReq } = useHttp()

  // Determine which order to display (use full details if fetched, otherwise use order from props)
  const displayOrder = fullOrderDetails || order

  // Fetch full order details when modal opens to ensure we have all data including Monnify fields
  const fetchFullOrderDetails = useCallback(() => {
    if (!order) return

    setIsFetchingFullDetails(true)
    setFetchError(null)
    const endpoint = activeTab === 'regular'
      ? `/admin/get-order/${order._id}`
      : `/admin/get-measurement-order/${order._id}`

    fetchFullDetailsReq({
      requestConfig: {
        url: endpoint,
        method: 'GET',
      },
      successRes: (response: any) => {
        const fetchedOrder = response?.data?.data
        if (fetchedOrder) {
          setFullOrderDetails(fetchedOrder)
          setFetchError(null)
          // Update Redux state with full details
          if (activeTab === 'regular') {
            dispatch(adminActions.updateOrder({
              _id: fetchedOrder._id,
              updated: fetchedOrder as Order,
            }))
          } else {
            dispatch(adminActions.updateMeasurementOrder({
              _id: fetchedOrder._id,
              updated: fetchedOrder as MeasurementOrder,
            }))
          }
          // Notify parent component
          if (onOrderUpdate) {
            onOrderUpdate(fetchedOrder)
          }
        }
        setIsFetchingFullDetails(false)
      },
      errorRes: (errorResponse: any) => {
        setIsFetchingFullDetails(false)
        // useHttp passes error.response to errorRes callback
        const errorMessage = errorResponse?.data?.description || errorResponse?.message || `Failed to load ${activeTab === 'regular' ? 'order' : 'measurement order'} details. Please try again.`
        setFetchError(errorMessage)
      },
    })
  }, [order, activeTab, fetchFullDetailsReq, dispatch, onOrderUpdate])

  useEffect(() => {
    if (!isOpen || !order) {
      setFullOrderDetails(null)
      setIsFetchingFullDetails(false)
      setFetchError(null)
      return
    }

    // Always fetch full details when modal opens to get the latest data
    // This ensures we have all Monnify fields and any other updated information
    if (!isFetchingFullDetails && !fullOrderDetails && !fetchError) {
      fetchFullOrderDetails()
    }
  }, [isOpen, order?._id, activeTab, isFetchingFullDetails, fullOrderDetails, fetchError, fetchFullOrderDetails])

  // Retry handler for fetching full order details
  const handleRetryFetch = () => {
    setFetchError(null)
    setFullOrderDetails(null)
    fetchFullOrderDetails()
  }

  // Initialize price when order changes
  useEffect(() => {
    const currentOrder = displayOrder
    if (currentOrder && activeTab === 'measurement') {
      const measurementOrder = currentOrder as MeasurementOrder
      setPrice(measurementOrder.price?.toString() || '')
    } else {
      setPrice('')
    }
  }, [displayOrder, activeTab])

  const handleSetPrice = () => {
    if (!displayOrder || activeTab !== 'measurement') return

    const priceValue = parseFloat(price)
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Please enter a valid price (0 or greater)')
      return
    }

    // Prevent setting price on an order that has already been superseded
    if ((displayOrder as any).isReplaced || (displayOrder as any).replacedByOrderId) {
      toast.error('This measurement order has expired because the price was updated earlier. Please open the latest measurement order to change the price.')
      return
    }

    setIsSettingPrice(true)
    setPriceReq({
      requestConfig: {
        url: '/admin/set-measurement-order-price',
        method: 'PATCH',
        body: {
          orderId: displayOrder._id,
          price: priceValue,
        },
      },
      successRes: (response: any) => {
        // The response structure is: response.data = { status, message, description, data: updatedOrder }
        const updatedOrder = response?.data?.data as MeasurementOrder | undefined
        
        if (updatedOrder) {
          // Update Redux state via parent component callback
          if (onOrderUpdate) {
            onOrderUpdate(updatedOrder)
          }
          
          // Update local price state to reflect the new price
          setPrice(updatedOrder.price?.toString() || '')
          
          toast.success(
            updatedOrder.originalOrderId
              ? 'Price updated. A new measurement order has been created and emailed to the customer.'
              : 'Price set successfully and email sent to customer'
          )
        } else {
          toast.error('Failed to update order. Please try again.')
        }
        setIsSettingPrice(false)
      },
    })
  }

  // Reset setting price state when request completes
  useEffect(() => {
    if (!isUpdatingPrice && isSettingPrice) {
      setIsSettingPrice(false)
    }
  }, [isUpdatingPrice, isSettingPrice])
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !order) return null

  const isRegularOrder = activeTab === 'regular'
  const regularOrder = displayOrder && isRegularOrder ? (displayOrder as Order) : null
  const measurementOrder = displayOrder && !isRegularOrder ? (displayOrder as MeasurementOrder) : null

  // Show error state if fetch failed and we don't have full details
  if (fetchError && !fullOrderDetails) {
    return (
      <div 
        className="fixed inset-0 z-50 overflow-hidden h-screen w-screen"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm h-full w-full" />
        
        {/* Modal Container */}
        <div className="relative h-screen w-screen flex flex-col bg-white">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isRegularOrder ? 'bg-blue-100' : 'bg-purple-100'}`}>
                {isRegularOrder ? (
                  <Package className={`h-5 w-5 ${isRegularOrder ? 'text-blue-600' : 'text-purple-600'}`} />
                ) : (
                  <Ruler className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-500">#{order.orderNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error State */}
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="max-w-md w-full px-4">
              <ErrorState
                title={`Failed to load ${activeTab === 'regular' ? 'order' : 'measurement order'} details`}
                message={fetchError}
                onRetry={handleRetryFetch}
                retryLabel="Retry"
                fullScreen={false}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while fetching
  if (isFetchingFullDetails && !fullOrderDetails) {
    return (
      <div 
        className="fixed inset-0 z-50 overflow-hidden h-screen w-screen"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm h-full w-full" />
        
        {/* Modal Container */}
        <div className="relative h-screen w-screen flex flex-col bg-white">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isRegularOrder ? 'bg-blue-100' : 'bg-purple-100'}`}>
                {isRegularOrder ? (
                  <Package className={`h-5 w-5 ${isRegularOrder ? 'text-blue-600' : 'text-purple-600'}`} />
                ) : (
                  <Ruler className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-500">#{order.orderNumber}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading full details...</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Loading State */}
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!displayOrder) return null

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden h-screen w-screen"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm h-full w-full" />
      
      {/* Modal Container */}
      <div className="relative h-screen w-screen flex flex-col bg-white">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRegularOrder ? 'bg-blue-100' : 'bg-purple-100'}`}>
              {isRegularOrder ? (
                <Package className={`h-5 w-5 ${isRegularOrder ? 'text-blue-600' : 'text-purple-600'}`} />
              ) : (
                <Ruler className="h-5 w-5 text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <p className="text-sm text-gray-500">#{displayOrder.orderNumber}</p>
              {isFetchingFullDetails && (
                <div className="flex items-center gap-2 mt-1 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading full details...</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${getStatusColor(isRegularOrder ? regularOrder!.orderStatus : measurementOrder!.status)}`}>
                        {getStatusIcon(isRegularOrder ? regularOrder!.orderStatus : measurementOrder!.status)}
                        <span className="ml-2 capitalize">{isRegularOrder ? regularOrder!.orderStatus : measurementOrder!.status}</span>
                      </span>
                      {displayOrder.isGuest ? (
                        <span className="inline-flex items-center px-3 py-1 rounded text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                          Guest Order
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                          User Order
                        </span>
                      )}
                    </div>
                    {!isRegularOrder && measurementOrder && ((measurementOrder as any).isReplaced || (measurementOrder as any).replacedByOrderId) && (
                      <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        This measurement order has expired because the price was updated and a new receipt was issued. The customer should use the most recent order to make payment.
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items / Templates */}
                {isRegularOrder ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                    <div className="space-y-4">
                      {regularOrder!.items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
                                ? item.variantImageUrls[0]
                                : (((item as any).variantImageUrl as string | undefined) || '/file.svg')} // Backward compatibility
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 64px, 80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <h5 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 break-words">{item.productName}</h5>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                              <span>Color: <span className="font-medium">{item.variantColor}</span></span>
                              <span className="hidden sm:inline">|</span>
                              <span>Size: <span className="font-medium">{item.variantSize}</span></span>
                              <span className="hidden sm:inline">|</span>
                              <span>Qty: <span className="font-medium">{item.quantity}</span></span>
                            </div>
                            <p className="text-sm sm:text-base font-semibold text-gray-900 mt-2 sm:mt-1">
                              {formatPrice(item.itemTotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Measurement Templates</h4>
                    <div className="space-y-4 sm:space-y-6">
                      {measurementOrder!.templates.map((template, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2">
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{template.templateTitle}</h5>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">Quantity: {template.quantity}</p>
                            </div>
                          </div>
                          
                          {/* Measurements */}
                          <div className="mb-3 sm:mb-4">
                            <h6 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Measurements</h6>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                              {template.measurements.map((measurement, mIndex) => (
                                <div key={mIndex} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                                  <p className="text-[10px] sm:text-xs text-gray-500 capitalize truncate">{measurement.fieldName}</p>
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">{measurement.value} cm</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sample Images */}
                          {template.sampleImageUrls && template.sampleImageUrls.length > 0 && (
                            <div>
                              <h6 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Sample Images
                              </h6>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                {template.sampleImageUrls.map((imageUrl, imgIndex) => (
                                  <div key={imgIndex} className="relative w-full h-24 sm:h-32 rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                      src={imageUrl}
                                      alt={`Sample ${imgIndex + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50vw, 33vw"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {measurementOrder && (measurementOrder.notes || measurementOrder.preferredStyle) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                    {measurementOrder.notes && (
                      <div className="mb-4">
                        <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Notes
                        </h6>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{measurementOrder.notes}</p>
                      </div>
                    )}
                    {measurementOrder.preferredStyle && (
                      <div>
                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Preferred Style</h6>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{measurementOrder.preferredStyle}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {isRegularOrder 
                          ? `${regularOrder!.shippingAddress.firstName} ${regularOrder!.shippingAddress.lastName}`
                          : measurementOrder!.name
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {isRegularOrder 
                          ? regularOrder!.shippingAddress.email
                          : measurementOrder!.email
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {isRegularOrder 
                          ? regularOrder!.shippingAddress.phone
                          : measurementOrder!.phone
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {isRegularOrder ? (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Shipping Address
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>{regularOrder!.shippingAddress.address}</p>
                        <p>{regularOrder!.shippingAddress.city}, {regularOrder!.shippingAddress.state}</p>
                        <p>{regularOrder!.shippingAddress.zipCode}</p>
                        <p>{regularOrder!.shippingAddress.country}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Billing Address
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>{regularOrder!.billingAddress.address}</p>
                        <p>{regularOrder!.billingAddress.city}, {regularOrder!.billingAddress.state}</p>
                        <p>{regularOrder!.billingAddress.zipCode}</p>
                        <p>{regularOrder!.billingAddress.country}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>{measurementOrder!.address}</p>
                      <p>{measurementOrder!.city}, {measurementOrder!.state}</p>
                      <p>{measurementOrder!.zipCode}</p>
                      <p>{measurementOrder!.country}</p>
                    </div>
                  </div>
                )}

                {/* Order Summary / Payment Information */}
                {isRegularOrder ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal</span>
                        <span className="text-sm font-medium text-gray-900">{formatPrice(regularOrder!.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Shipping</span>
                        <span className="text-sm font-medium text-gray-900">{formatPrice(regularOrder!.shipping)}</span>
                      </div>
                      {regularOrder!.shippingLocation && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Shipping Location</span>
                          <span className="text-sm font-medium text-gray-900">{regularOrder!.shippingLocation}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tax</span>
                        <span className="text-sm font-medium text-gray-900">{formatPrice(regularOrder!.tax)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-base font-bold text-gray-900">{formatPrice(regularOrder!.total)}</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Status</span>
                          <span className={`text-sm font-medium ${regularOrder!.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {regularOrder!.paymentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Method</span>
                          <span className="text-sm font-medium text-gray-900">{regularOrder!.paymentMethod}</span>
                        </div>
                        {regularOrder!.paymentReference && (
                          <div>
                            <span className="text-sm text-gray-600">Payment Reference</span>
                            <p className="text-xs font-medium text-gray-900 break-all font-mono">{regularOrder!.paymentReference}</p>
                          </div>
                        )}
                        {regularOrder!.monnifyTransactionReference && (
                          <div>
                            <span className="text-sm text-gray-600">Monnify Transaction Reference</span>
                            <p className="text-xs font-medium text-gray-900 break-all font-mono">{regularOrder!.monnifyTransactionReference}</p>
                          </div>
                        )}
                        {regularOrder!.monnifyPaymentReference && (
                          <div>
                            <span className="text-sm text-gray-600">Monnify Payment Reference</span>
                            <p className="text-xs font-medium text-gray-900 break-all font-mono">{regularOrder!.monnifyPaymentReference}</p>
                          </div>
                        )}
                        {regularOrder!.paymentUrl && (
                          <div>
                            <span className="text-sm text-gray-600">Payment URL</span>
                            <a 
                              href={regularOrder!.paymentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 break-all font-mono underline"
                            >
                              {regularOrder!.paymentUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Set Price
                    </h4>
                    <div className="space-y-4">
                      {measurementOrder!.price !== undefined && measurementOrder!.price !== null ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Current Price</p>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(measurementOrder!.price)}</p>
                            {measurementOrder!.priceSetAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Set on {formatDate(new Date(measurementOrder!.priceSetAt))}
                              </p>
                            )}
                          </div>
                          {measurementOrder!.shippingLocation && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Shipping Location</p>
                              <p className="text-sm font-medium text-gray-900">{measurementOrder!.shippingLocation}</p>
                            </div>
                          )}
                          {measurementOrder!.deliveryFee !== undefined && measurementOrder!.deliveryFee !== null && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Delivery Fee</p>
                              <p className="text-sm font-medium text-gray-900">{formatPrice(measurementOrder!.deliveryFee)}</p>
                            </div>
                          )}
                          {measurementOrder!.tax !== undefined && measurementOrder!.tax !== null && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Tax</p>
                              <p className="text-sm font-medium text-gray-900">{formatPrice(measurementOrder!.tax)}</p>
                            </div>
                          )}
                          {(measurementOrder!.deliveryFee !== undefined && measurementOrder!.deliveryFee !== null) || 
                           (measurementOrder!.tax !== undefined && measurementOrder!.tax !== null) ? (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Total</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatPrice(
                                  measurementOrder!.price! + 
                                  (measurementOrder!.deliveryFee || 0) + 
                                  (measurementOrder!.tax || 0)
                                )}
                              </p>
                            </div>
                          ) : null}
                          {/* Payment Information */}
                          <div className="pt-3 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Payment Status</span>
                              <span className={`text-xs font-medium ${measurementOrder!.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {measurementOrder!.paymentStatus}
                              </span>
                            </div>
                            {measurementOrder!.paymentMethod && (
                              <div className="flex justify-between">
                                <span className="text-xs text-gray-600">Payment Method</span>
                                <span className="text-xs font-medium text-gray-900">{measurementOrder!.paymentMethod}</span>
                              </div>
                            )}
                            {measurementOrder!.paymentReference && (
                              <div>
                                <span className="text-xs text-gray-600">Payment Reference</span>
                                <p className="text-xs font-medium text-gray-900 break-all font-mono">{measurementOrder!.paymentReference}</p>
                              </div>
                            )}
                            {measurementOrder!.monnifyTransactionReference && (
                              <div>
                                <span className="text-xs text-gray-600">Monnify Transaction Reference</span>
                                <p className="text-xs font-medium text-gray-900 break-all font-mono">{measurementOrder!.monnifyTransactionReference}</p>
                              </div>
                            )}
                            {measurementOrder!.monnifyPaymentReference && (
                              <div>
                                <span className="text-xs text-gray-600">Monnify Payment Reference</span>
                                <p className="text-xs font-medium text-gray-900 break-all font-mono">{measurementOrder!.monnifyPaymentReference}</p>
                              </div>
                            )}
                            {measurementOrder!.paymentUrl && (
                              <div>
                                <span className="text-xs text-gray-600">Payment URL</span>
                                <a 
                                  href={measurementOrder!.paymentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800 break-all font-mono underline block"
                                >
                                  {measurementOrder!.paymentUrl}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">No price set yet</p>
                          {measurementOrder!.shippingLocation && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Shipping Location</p>
                              <p className="text-sm font-medium text-gray-900">{measurementOrder!.shippingLocation}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {measurementOrder!.price !== undefined && measurementOrder!.price !== null ? 'Update Price' : 'Set Price'}
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleSetPrice}
                            disabled={isUpdatingPrice || isSettingPrice}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isUpdatingPrice || isSettingPrice ? (
                              <>
                                <Clock className="h-4 w-4 animate-spin" />
                                <span>Setting...</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                <span>{measurementOrder!.price !== undefined && measurementOrder!.price !== null ? 'Update' : 'Set'}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          An email will be sent to the customer with the payment link
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Order Timeline
                  </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {displayOrder.createdAt ? formatDate(new Date(displayOrder.createdAt)) : 'N/A'}
                        </p>
                      </div>
                      {isRegularOrder && regularOrder!.paidAt && (
                        <div>
                          <p className="text-xs text-gray-500">Paid</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(regularOrder!.paidAt))}
                          </p>
                        </div>
                      )}
                      {!isRegularOrder && measurementOrder!.paidAt && (
                        <div>
                          <p className="text-xs text-gray-500">Paid</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(measurementOrder!.paidAt))}
                          </p>
                        </div>
                      )}
                      {isRegularOrder && regularOrder!.shippedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Shipped</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(regularOrder!.shippedAt))}
                          </p>
                        </div>
                      )}
                      {!isRegularOrder && measurementOrder!.shippedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Shipped</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(measurementOrder!.shippedAt))}
                          </p>
                        </div>
                      )}
                      {isRegularOrder && regularOrder!.deliveredAt && (
                        <div>
                          <p className="text-xs text-gray-500">Delivered</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(regularOrder!.deliveredAt))}
                          </p>
                        </div>
                      )}
                      {!isRegularOrder && measurementOrder!.deliveredAt && (
                        <div>
                          <p className="text-xs text-gray-500">Delivered</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(measurementOrder!.deliveredAt))}
                          </p>
                        </div>
                      )}
                      {isRegularOrder && regularOrder!.cancelledAt && (
                        <div>
                          <p className="text-xs text-gray-500">Cancelled</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(regularOrder!.cancelledAt))}
                          </p>
                          {regularOrder!.cancellationReason && (
                            <p className="text-sm text-gray-600 mt-1">{regularOrder!.cancellationReason}</p>
                          )}
                        </div>
                      )}
                      {!isRegularOrder && measurementOrder!.cancelledAt && (
                        <div>
                          <p className="text-xs text-gray-500">Cancelled</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(measurementOrder!.cancelledAt))}
                          </p>
                          {measurementOrder!.cancellationReason && (
                            <p className="text-sm text-gray-600 mt-1">{measurementOrder!.cancellationReason}</p>
                          )}
                        </div>
                      )}
                      {displayOrder.updatedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(new Date(displayOrder.updatedAt))}
                          </p>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

