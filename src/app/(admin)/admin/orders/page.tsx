'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHttp } from '@/hooks/useHttp'
import { RootState } from '@/store/redux'
import { adminActions } from '@/store/redux/adminSlice'
import { toast } from 'sonner'
import type { Order } from '@/store/redux/adminSlice/order-slice'
import type { MeasurementOrder } from '@/store/redux/adminSlice/measurement-order-slice'
import { OrderStatus, PaymentStatus } from '@/lib/server/order/interface'
import { MeasurementOrderStatus } from '@/lib/server/measurementOrder/interface'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import OrdersHeader from '@/components/admin/orders/OrdersHeader'
import OrdersTabs from '@/components/admin/orders/OrdersTabs'
import OrdersStats from '@/components/admin/orders/OrdersStats'
import OrdersFilters from '@/components/admin/orders/OrdersFilters'
import OrdersTable from '@/components/admin/orders/OrdersTable'
import OrdersPagination from '@/components/admin/orders/OrdersPagination'
import EmptyOrdersState from '@/components/admin/orders/EmptyOrdersState'
import OrderDetailsModal from '@/components/admin/orders/OrderDetailsModal'
import type { TabType, PaginationState } from '@/components/admin/orders/types'
import { getStatusOptions } from '@/components/admin/orders/utils'

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('regular')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | MeasurementOrder | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  
  // Store pagination separately for each tab to avoid refetching when switching
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
    sendHttpRequest: fetchAdminOrdersReq,
  } = useHttp()
  
  const {
    isLoading: isUpdatingStatus,
    sendHttpRequest: updateStatusReq,
  } = useHttp()

  // Redux state
  const ordersState = useSelector((state: RootState) => state.admin.orders)
  const measurementOrdersState = useSelector((state: RootState) => state.admin.measurementOrders)

  const { hasFetchedOrders: hasFetchedRegularOrders, orders: regularOrders } = ordersState
  const { hasFetchedOrders: hasFetchedMeasurementOrders, orders: measurementOrders } = measurementOrdersState

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({ searchTerm, selectedStatus, activeTab })

  // Track if this is the very first mount (not a tab change)
  const isFirstMountRef = useRef(true)

  // Fetch orders based on active tab
  const fetchOrders = useCallback(
    (page: number = 1, showTableLoading: boolean = false) => {
      const validPage = Math.max(1, Math.floor(page))
      
      // Only use initial loading on the very first mount when no data has been fetched
      // For tab changes or subsequent fetches, use table loading
      if (showTableLoading || !isFirstMountRef.current) {
        setIsTableLoading(true)
      } else if (
        isFirstMountRef.current &&
        ((activeTab === 'regular' && !hasFetchedRegularOrders) ||
        (activeTab === 'measurement' && !hasFetchedMeasurementOrders))
      ) {
        setIsInitialLoading(true)
      }

      const onFetchOrdersRes = (res: any) => {
        try {
          const responseData = res?.data?.data
          const orders = Array.isArray(responseData?.orders) ? responseData.orders : []
          const paginationData = responseData?.pagination

          if (activeTab === 'regular') {
            dispatch(adminActions.setOrders(orders))
          } else {
            dispatch(adminActions.setMeasurementOrders(orders))
          }

          if (paginationData && typeof paginationData === 'object') {
            const newPagination = {
              page: paginationData.page || validPage,
              limit: paginationData.limit || 10,
              total: paginationData.total || 0,
              totalPages: paginationData.totalPages || 0,
              hasNextPage: paginationData.hasNextPage || false,
              hasPrevPage: paginationData.hasPrevPage || false,
            }
            
            // Store pagination for the active tab
            if (activeTab === 'regular') {
              regularOrdersPaginationRef.current = newPagination
            } else {
              measurementOrdersPaginationRef.current = newPagination
            }
            
            setPagination(newPagination)
          }
        } catch (error) {
          console.error('Error processing fetch orders response:', error)
          if (activeTab === 'regular') {
            dispatch(adminActions.setOrders([]))
          } else {
            dispatch(adminActions.setMeasurementOrders([]))
          }
        } finally {
          setIsTableLoading(false)
        }
      }

      // Build query string with filters
      const queryParams = new URLSearchParams({
        page: validPage.toString(),
        limit: '10',
      })

      if (searchTerm && searchTerm.trim()) {
        queryParams.append('searchTerm', searchTerm.trim())
      }

      if (selectedStatus && selectedStatus.trim()) {
        if (activeTab === 'regular') {
          // Check if it's orderStatus or paymentStatus
          if (Object.values(OrderStatus).includes(selectedStatus as OrderStatus)) {
            queryParams.append('orderStatus', selectedStatus)
          } else if (Object.values(PaymentStatus).includes(selectedStatus as PaymentStatus)) {
            queryParams.append('paymentStatus', selectedStatus)
          }
        } else {
          if (Object.values(MeasurementOrderStatus).includes(selectedStatus as MeasurementOrderStatus)) {
            queryParams.append('status', selectedStatus)
          }
        }
      }

      const endpoint = activeTab === 'regular' 
        ? `/admin/fetch-orders?${queryParams.toString()}`
        : `/admin/fetch-measurement-orders?${queryParams.toString()}`

      fetchAdminOrdersReq({
        successRes: onFetchOrdersRes,
        requestConfig: {
          url: endpoint,
          method: 'GET',
        },
      })
    },
    [dispatch, fetchAdminOrdersReq, searchTerm, selectedStatus, activeTab, hasFetchedRegularOrders, hasFetchedMeasurementOrders]
  )

  // Reset loading states when request completes
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false)
      setIsTableLoading(false)
    }
  }, [isLoading])

  // Initial fetch on mount or restore pagination if already fetched
  useEffect(() => {
    setMounted(true)
    const shouldFetch = activeTab === 'regular' 
      ? !hasFetchedRegularOrders 
      : !hasFetchedMeasurementOrders
    
    if (shouldFetch) {
      fetchOrders(1, false)
      // Mark that we've done the first fetch
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false
      }
    } else {
      // Data already fetched, restore pagination for this tab
      const tabPagination = activeTab === 'regular' 
        ? regularOrdersPaginationRef.current 
        : measurementOrdersPaginationRef.current
      
      if (tabPagination.total > 0) {
        setPagination(tabPagination)
        setCurrentPage(tabPagination.page)
      }
    }
  }, [fetchOrders, activeTab, hasFetchedRegularOrders, hasFetchedMeasurementOrders])

  // Fetch orders when page changes
  useEffect(() => {
    if (mounted) {
      const hasFetched = activeTab === 'regular' 
        ? hasFetchedRegularOrders 
        : hasFetchedMeasurementOrders
      
      if (hasFetched) {
        const isPageChange = currentPage !== pagination.page
        if (isPageChange) {
          if (pagination.totalPages > 0) {
            const validPage = Math.min(Math.max(1, currentPage), pagination.totalPages)
            if (validPage !== currentPage) {
              setCurrentPage(validPage)
              return
            }
          }
          fetchOrders(currentPage, true)
        }
      }
    }
  }, [currentPage, mounted, activeTab, hasFetchedRegularOrders, hasFetchedMeasurementOrders, fetchOrders, pagination.page, pagination.totalPages])

  // Fetch orders when filters or search changes (reset to page 1)
  // Only fetch on tab change if data hasn't been fetched for that tab yet
  useEffect(() => {
    if (mounted) {
      const hasFetched = activeTab === 'regular' 
        ? hasFetchedRegularOrders 
        : hasFetchedMeasurementOrders
      
      const searchChanged = prevFiltersRef.current.searchTerm !== searchTerm
      const statusChanged = prevFiltersRef.current.selectedStatus !== selectedStatus
      const tabChanged = prevFiltersRef.current.activeTab !== activeTab
      
      // Only proceed if search, status, or tab changed
      if (searchChanged || statusChanged || tabChanged) {
        // Update previous filters ref
        prevFiltersRef.current = { searchTerm, selectedStatus, activeTab }
        
        // Mark that we're no longer on first mount (tab change or filter change)
        if (isFirstMountRef.current) {
          isFirstMountRef.current = false
        }

        // If only tab changed and both tabs have been fetched, don't fetch again
        // Just restore the pagination state for the tab being switched to
        if (tabChanged && !searchChanged && !statusChanged) {
          const bothTabsFetched = hasFetchedRegularOrders && hasFetchedMeasurementOrders
          
          if (bothTabsFetched && hasFetched) {
            // Both tabs have data, restore pagination for the active tab
            const tabPagination = activeTab === 'regular' 
              ? regularOrdersPaginationRef.current 
              : measurementOrdersPaginationRef.current
            
            setPagination(tabPagination)
            setCurrentPage(tabPagination.page)
            return // Don't fetch, just switch tabs
          }
        }

        // Fetch if:
        // 1. Search or status changed (always fetch)
        // 2. Tab changed and data hasn't been fetched for the new tab
        if (searchChanged || statusChanged || !hasFetched) {
          if (currentPage !== 1) {
            setCurrentPage(1)
          } else {
            fetchOrders(1, true)
          }
        }
      }
    }
  }, [searchTerm, selectedStatus, activeTab, mounted, currentPage, fetchOrders, hasFetchedRegularOrders, hasFetchedMeasurementOrders])

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSelectedStatus('')
    setSearchTerm('')
  }

  // Get current orders based on active tab
  const currentOrders = activeTab === 'regular' ? regularOrders : measurementOrders

  // Calculate stats for all statuses
  const totalOrders = pagination.total || (activeTab === 'regular' ? regularOrders.length : measurementOrders.length)
  
  const orderStats = activeTab === 'regular' 
    ? {
        orderPlaced: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.OrderPlaced).length,
        processing: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.Processing).length,
        packed: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.Packed).length,
        shipped: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.Shipped).length,
        inTransit: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.InTransit).length,
        outForDelivery: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.OutForDelivery).length,
        delivered: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.Delivered).length,
        cancelled: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.Cancelled).length,
        failed: regularOrders.filter((o: Order) => o.orderStatus === OrderStatus.Failed).length,
      }
    : {
        orderReceived: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.OrderReceived).length,
        designReview: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.DesignReview).length,
        fabricSelection: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.FabricSelection).length,
        patternMaking: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.PatternMaking).length,
        cutting: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.Cutting).length,
        sewing: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.Sewing).length,
        qualityCheck: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.QualityCheck).length,
        packed: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.Packed).length,
        shipped: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.Shipped).length,
        inTransit: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.InTransit).length,
        outForDelivery: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.OutForDelivery).length,
        delivered: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.Delivered).length,
        cancelled: measurementOrders.filter((o: MeasurementOrder) => o.status === MeasurementOrderStatus.Cancelled).length,
      }

  // Get status options
  const statusOptions = getStatusOptions(activeTab)

  // Handlers
  const handleViewOrder = (order: Order | MeasurementOrder) => {
    setSelectedOrder(order)
    setIsOrderModalOpen(true)
  }

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false)
    setSelectedOrder(null)
  }

  const handleUpdateStatus = (order: Order | MeasurementOrder, newStatus: string) => {
    setUpdatingOrderId(order._id)
    
    const endpoint = activeTab === 'regular'
      ? '/admin/update-order-status'
      : '/admin/update-measurement-order-status'
    
    const requestBody = activeTab === 'regular'
      ? { orderId: order._id, orderStatus: newStatus }
      : { orderId: order._id, status: newStatus }

    updateStatusReq({
      requestConfig: {
        url: endpoint,
        method: 'PATCH',
        body: requestBody,
      },
      successRes: (response: any) => {
        const updatedOrder = response?.data?.data
        if (updatedOrder) {
          // Update Redux state with the updated order
          if (activeTab === 'regular') {
            dispatch(adminActions.updateOrder({
              _id: order._id,
              updated: updatedOrder as Order,
            }))
          } else {
            dispatch(adminActions.updateMeasurementOrder({
              _id: order._id,
              updated: updatedOrder as MeasurementOrder,
            }))
          }
          toast.success(`Order status updated to ${newStatus}`)
        }
      },
    })
  }

  // Reset updating order ID when request completes
  useEffect(() => {
    if (!isUpdatingStatus && updatingOrderId) {
      setUpdatingOrderId(null)
    }
  }, [isUpdatingStatus, updatingOrderId])

  // Only show page loading for initial fetch
  if (isInitialLoading || !mounted) {
    return <LoadingSpinner fullScreen text={`Loading ${activeTab === 'regular' ? 'orders' : 'measurement orders'}...`} />
  }

  if (error && isInitialLoading) {
    const handleRetry = () => {
      const hasFetched = activeTab === 'regular' 
        ? hasFetchedRegularOrders 
        : hasFetchedMeasurementOrders
      
      if (hasFetched) return

      setIsInitialLoading(true)
      fetchOrders(1)
    }

    return (
      <ErrorState
        title={`Failed to load ${activeTab === 'regular' ? 'orders' : 'measurement orders'}`}
        message={error || `We couldn't load your ${activeTab === 'regular' ? 'orders' : 'measurement orders'}. Please try again.`}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <OrdersHeader />

        <OrdersTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          regularOrdersCount={regularOrders.length}
          measurementOrdersCount={measurementOrders.length}
          hasFetchedRegularOrders={hasFetchedRegularOrders}
          hasFetchedMeasurementOrders={hasFetchedMeasurementOrders}
        />

        <OrdersStats
          activeTab={activeTab}
          totalOrders={totalOrders}
          orderStats={orderStats}
        />

        <OrdersFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusOptions={statusOptions}
          resultsCount={pagination.total || currentOrders.length}
        />

        {/* Orders Table */}
        {isTableLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <LoadingSpinner text="Loading orders..." />
          </div>
        ) : currentOrders.length > 0 ? (
          <>
            <OrdersTable
              orders={currentOrders}
              activeTab={activeTab}
              statusOptions={statusOptions}
              onViewOrder={handleViewOrder}
              onUpdateStatus={handleUpdateStatus}
              isUpdatingStatus={isUpdatingStatus}
              updatingOrderId={updatingOrderId}
            />

            <OrdersPagination
              pagination={pagination}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <EmptyOrdersState />
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        order={selectedOrder}
        activeTab={activeTab}
        onOrderUpdate={(updatedOrder) => {
          // Update Redux state with the updated order
          if (activeTab === 'regular') {
            dispatch(adminActions.updateOrder({
              _id: updatedOrder._id,
              updated: updatedOrder as Order,
            }))
          } else {
            dispatch(adminActions.updateMeasurementOrder({
              _id: updatedOrder._id,
              updated: updatedOrder as MeasurementOrder,
            }))
          }
          
          // Update the selected order in local state so the modal shows the updated data
          if (selectedOrder && selectedOrder._id === updatedOrder._id) {
            setSelectedOrder(updatedOrder)
          }
        }}
      />
    </div>
  )
}
