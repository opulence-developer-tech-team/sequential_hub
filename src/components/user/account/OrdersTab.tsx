'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHttp } from '@/hooks/useHttp'
import { RootState } from '@/store/redux'
import { orderActions } from '@/store/redux/user/order-slice'
import { measurementOrderActions } from '@/store/redux/user/measurement-order-slice'
import { Package, Ruler, ChevronLeft, ChevronRight, CreditCard, Eye, X } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { Order } from '@/store/redux/user/order-slice'
import type { MeasurementOrder } from '@/store/redux/user/measurement-order-slice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import OrderDetails from '@/components/user/track/OrderDetails'
import type {
  TrackedOrder,
  RegularOrder as TrackedRegularOrder,
  MeasurementOrder as TrackedMeasurementOrder,
} from '@/components/user/track/types'
import { getStatusColor, getStatusIcon, formatStatus } from '@/components/user/track/utils'

type TabType = 'regular' | 'measurement'

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function OrdersTab() {
  const [activeTab, setActiveTab] = useState<TabType>('regular')
  const [mounted, setMounted] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | MeasurementOrder | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  // Store pagination separately for each tab
  const regularOrdersPaginationRef = useRef<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const measurementOrdersPaginationRef = useRef<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const dispatch = useDispatch()
  const {
    isLoading,
    error,
    sendHttpRequest: fetchOrdersReq,
  } = useHttp()
  
  const {
    isLoading: isProcessingPayment,
    sendHttpRequest: processPaymentReq,
  } = useHttp()

  // Redux state
  const ordersState = useSelector((state: RootState) => state.userOrders)
  const measurementOrdersState = useSelector((state: RootState) => state.userMeasurementOrders)

  const { hasFetchedOrders: hasFetchedRegularOrders, orders: regularOrders } = ordersState
  const { hasFetchedOrders: hasFetchedMeasurementOrders, orders: measurementOrders } = measurementOrdersState

  // Track if this is the very first mount
  const isFirstMountRef = useRef(true)

  // Fetch orders based on active tab
  const fetchOrders = useCallback(
    (page: number = 1, showTableLoading: boolean = false) => {
      const validPage = Math.max(1, Math.floor(page))
      
      if (showTableLoading || !isFirstMountRef.current) {
        setIsTableLoading(true)
      } else if (
        isFirstMountRef.current &&
        ((activeTab === 'regular' && !hasFetchedRegularOrders) ||
         (activeTab === 'measurement' && !hasFetchedMeasurementOrders))
      ) {
        setIsInitialLoading(true)
      }

      const endpoint = activeTab === 'regular'
        ? `/user/fetch-orders?page=${validPage}&limit=10`
        : `/user/fetch-measurement-orders?page=${validPage}&limit=10`

      fetchOrdersReq({
        requestConfig: {
          url: endpoint,
          method: 'GET',
        },
        successRes: (response: any) => {
          const orders = response?.data?.data?.orders || []
          const paginationData = response?.data?.data?.pagination || {}

          if (activeTab === 'regular') {
            dispatch(orderActions.setOrders(orders))
            regularOrdersPaginationRef.current = { ...paginationData }
          } else {
            dispatch(measurementOrderActions.setOrders(orders))
            measurementOrdersPaginationRef.current = { ...paginationData }
          }

          setPagination({
            page: paginationData.page || validPage,
            limit: paginationData.limit || 10,
            total: paginationData.total || 0,
            totalPages: paginationData.totalPages || 0,
            hasNextPage: paginationData.hasNextPage || false,
            hasPrevPage: paginationData.hasPrevPage || false,
          })

          if (isFirstMountRef.current) {
            isFirstMountRef.current = false
          }
        },
      })
    },
    [activeTab, hasFetchedRegularOrders, hasFetchedMeasurementOrders, fetchOrdersReq, dispatch]
  )

  // Initial fetch on mount
  useEffect(() => {
    setMounted(true)
    const hasFetched = activeTab === 'regular' 
      ? hasFetchedRegularOrders 
      : hasFetchedMeasurementOrders
    
    if (!hasFetched) {
      fetchOrders(1, false)
    } else {
      const storedPagination = activeTab === 'regular' 
        ? regularOrdersPaginationRef.current 
        : measurementOrdersPaginationRef.current
      setPagination(storedPagination)
      setCurrentPage(storedPagination.page)
    }

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
    }
  }, [fetchOrders, activeTab, hasFetchedRegularOrders, hasFetchedMeasurementOrders])

  // Handle tab change
  useEffect(() => {
    if (mounted) {
      const hasFetched = activeTab === 'regular' 
        ? hasFetchedRegularOrders 
        : hasFetchedMeasurementOrders
      
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false
      }

      // If tab changed and no data fetched, fetch it
      if (!hasFetched) {
        if (currentPage !== 1) {
          setCurrentPage(1)
        } else {
          fetchOrders(1, true)
        }
      } else {
        // Restore pagination for the active tab
        const tabPagination = activeTab === 'regular' 
          ? regularOrdersPaginationRef.current 
          : measurementOrdersPaginationRef.current
        
        setPagination(tabPagination)
        setCurrentPage(tabPagination.page)
      }
    }
  }, [activeTab, mounted, currentPage, fetchOrders, hasFetchedRegularOrders, hasFetchedMeasurementOrders])

  // Handle page change
  useEffect(() => {
    if (mounted && currentPage > 0) {
      fetchOrders(currentPage, true)
    }
  }, [currentPage, mounted, fetchOrders])

  // Reset loading states when request completes
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false)
      setIsTableLoading(false)
    }
  }, [isLoading])

  // Handle payment for measurement orders
  const handlePayment = useCallback((order: MeasurementOrder) => {
    if (!order.price || order.price <= 0) {
      toast.error('Price not set for this order')
      return
    }

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
        }
      },
    })
  }, [processPaymentReq])

  const currentOrders = activeTab === 'regular' ? regularOrders : measurementOrders

  // Build tracked order structure for the full-screen details view
  const trackedOrder: TrackedOrder | null = useMemo(() => {
    if (!selectedOrder) return null

    if (activeTab === 'regular') {
      const order = selectedOrder as Order
      const regular: TrackedRegularOrder = {
        orderType: 'regular',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            productName: item.productName,
            productSlug: item.productSlug,
            variantSize: item.variantSize,
            variantColor: item.variantColor,
            quantity: item.quantity,
            itemTotal: item.itemTotal,
            variantImageUrls: Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
              ? item.variantImageUrls
              : (((item as any).variantImageUrl as string | undefined) ? [((item as any).variantImageUrl as string)] : []), // Backward compatibility
            measurements: item.measurements || null,
          })),
          shippingAddress: order.shippingAddress,
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,
          shippingLocation: order.shippingLocation,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
          paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : undefined,
          shippedAt: order.shippedAt ? new Date(order.shippedAt).toISOString() : undefined,
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : undefined,
        },
      }
      return regular
    }

    const mOrder = selectedOrder as MeasurementOrder
    const safeTemplates = Array.isArray(mOrder.templates) ? mOrder.templates : []
    const measurement: TrackedMeasurementOrder = {
      orderType: 'measurement',
      order: {
        _id: mOrder._id,
        orderNumber: mOrder.orderNumber,
        name: mOrder.name,
        email: mOrder.email,
        phone: mOrder.phone,
        address: mOrder.address,
        city: mOrder.city,
        state: mOrder.state,
        zipCode: mOrder.zipCode,
        country: mOrder.country,
        templates: safeTemplates.map((t) => ({
          templateId: t.templateId,
          templateTitle: t.templateTitle,
          quantity: t.quantity,
          measurements: t.measurements,
          sampleImageUrls: t.sampleImageUrls,
        })),
        notes: mOrder.notes,
        preferredStyle: mOrder.preferredStyle,
        status: mOrder.status,
        paymentStatus: mOrder.paymentStatus,
        price: mOrder.price,
        shippingLocation: mOrder.shippingLocation,
        tax: mOrder.tax,
        deliveryFee: mOrder.deliveryFee,
        createdAt: mOrder.createdAt ? new Date(mOrder.createdAt).toISOString() : undefined,
        paidAt: mOrder.paidAt ? new Date(mOrder.paidAt).toISOString() : undefined,
        shippedAt: mOrder.shippedAt ? new Date(mOrder.shippedAt).toISOString() : undefined,
        deliveredAt: mOrder.deliveredAt ? new Date(mOrder.deliveredAt).toISOString() : undefined,
      },
    }
    return measurement
  }, [selectedOrder, activeTab])

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner text="Loading orders..." />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Order History</h2>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-1 min-w-max sm:min-w-0" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('regular')}
              className={`${
                activeTab === 'regular'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } group relative min-w-0 flex-1 sm:flex-1 overflow-hidden py-3 sm:py-4 px-3 sm:px-4 text-center text-xs sm:text-sm font-medium border-b-2 focus:z-10 transition-all duration-200 whitespace-nowrap`}
            >
              <div className="flex items-center justify-center">
                <Package className={`h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0 ${activeTab === 'regular' ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="hidden xs:inline">Regular Orders</span>
                <span className="xs:hidden">Regular</span>
                {hasFetchedRegularOrders && regularOrders.length > 0 && (
                  <span className={`ml-1.5 sm:ml-2 py-0.5 px-2 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                    activeTab === 'regular'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {regularOrders.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('measurement')}
              className={`${
                activeTab === 'measurement'
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } group relative min-w-0 flex-1 sm:flex-1 overflow-hidden py-3 sm:py-4 px-3 sm:px-4 text-center text-xs sm:text-sm font-medium border-b-2 focus:z-10 transition-all duration-200 whitespace-nowrap`}
            >
              <div className="flex items-center justify-center">
                <Ruler className={`h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0 ${activeTab === 'measurement' ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="hidden xs:inline">Measurement Orders</span>
                <span className="xs:hidden">Measurement</span>
                {hasFetchedMeasurementOrders && measurementOrders.length > 0 && (
                  <span className={`ml-1.5 sm:ml-2 py-0.5 px-2 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                    activeTab === 'measurement'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {measurementOrders.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Orders List */}
      {isTableLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner text="Loading orders..." />
        </div>
      ) : currentOrders.length > 0 ? (
        <>
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <div key={order._id} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">Order #{order.orderNumber}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ${getStatusColor(
                          activeTab === 'regular'
                            ? (order as Order).orderStatus
                            : (order as MeasurementOrder).status
                        )}`}
                      >
                        {getStatusIcon(
                          activeTab === 'regular'
                            ? (order as Order).orderStatus
                            : (order as MeasurementOrder).status
                        )}
                        <span className="whitespace-nowrap">
                          {formatStatus(
                            activeTab === 'regular'
                              ? ((order as Order).orderStatus as string)
                              : ((order as MeasurementOrder).status as string)
                          )}
                        </span>
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      Placed on {order.createdAt ? formatDate(new Date(order.createdAt)) : 'N/A'}
                    </p>
                    {activeTab === 'regular' ? (
                      <>
                        <p className="text-gray-600 text-sm mb-1">
                          {(order as Order).items.length} item(s)
                        </p>
                        <p className="font-semibold text-gray-900 mt-2 text-lg">
                          {formatPrice((order as Order).total)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-600 text-sm mb-1">
                          {(order as MeasurementOrder).templates.length} template(s)
                        </p>
                        {(order as MeasurementOrder).price !== undefined && (order as MeasurementOrder).price !== null ? (
                          <p className="font-semibold text-gray-900 mt-2 text-lg">
                            {formatPrice((order as MeasurementOrder).price!)}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm mt-2">Price not set yet</p>
                        )}
                      </>
                    )}
                    {/* Payment status badge */}
                    {'paymentStatus' in order && (order as any).paymentStatus && (
                      <div className="mt-3">
                        <span className="text-xs text-gray-500 mr-2">Payment:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                            (order as any).paymentStatus as string
                          )}`}
                        >
                          {getStatusIcon((order as any).paymentStatus as string)}
                          <span>{formatStatus((order as any).paymentStatus as string)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto">
                    {activeTab === 'measurement' && (() => {
                      const mOrder = order as MeasurementOrder
                      const hasPrice =
                        mOrder.price !== undefined &&
                        mOrder.price !== null &&
                        mOrder.price > 0
                      const isReplaced =
                        (mOrder as any).isReplaced === true ||
                        Boolean((mOrder as any).replacedByOrderId)
                      const isPaid =
                        (mOrder.paymentStatus as any)?.toString?.().toLowerCase?.() === 'paid'

                      if (!hasPrice) {
                        return null
                      }

                      if (isReplaced) {
                        return (
                          <p className="text-xs text-amber-600 sm:max-w-xs">
                            This order is no longer valid because the price was updated and a new
                            receipt was generated. Please use the latest order details sent to your
                            email.
                          </p>
                        )
                      }

                      if (isPaid) {
                        // Payment badge already shows the status; no extra button here
                        return null
                      }

                      return (
                        <button
                          onClick={() => handlePayment(mOrder)}
                          disabled={isProcessingPayment}
                          className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <CreditCard className="h-4 w-4" />
                          {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                        </button>
                      )
                    })()}
                    <button 
                      onClick={() => {
                        setSelectedOrder(order)
                        setIsViewModalOpen(true)
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span> to{' '}
                <span className="font-semibold text-gray-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-4 py-2 border rounded-lg font-medium text-sm transition-all duration-200 ${
                    pagination.hasPrevPage
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 inline mr-1" />
                  Previous
                </button>
                <div className="px-4 py-2 text-sm text-gray-700">
                  Page <span className="font-semibold">{pagination.page}</span> of{' '}
                  <span className="font-semibold">{pagination.totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-4 py-2 border rounded-lg font-medium text-sm transition-all duration-200 ${
                    pagination.hasNextPage
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                      : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {activeTab === 'regular' 
              ? "You haven't placed any orders yet."
              : "You haven't placed any measurement orders yet."
            }
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedOrder && trackedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md w-10 h-10"
                aria-label="Close order details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Content */}
            <div
              className="flex-1 overflow-y-auto px-4 pb-8 flex justify-center"
              onClick={() => setIsViewModalOpen(false)}
            >
              <div
                className="w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <OrderDetails trackedOrder={trackedOrder} />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
