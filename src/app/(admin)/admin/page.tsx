'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Eye,
  Plus,
  Ruler,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import { RootState } from '@/store/redux'
import { dashboardActions, type RecentOrder } from '@/store/redux/adminSlice/dashbaord-slice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { getStatusColor, getStatusIcon, formatStatus } from '@/components/admin/orders/utils'

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { sendHttpRequest, isLoading, error } = useHttp()
  const dashboardState = useSelector((state: RootState) => state.admin.dashboard)
  const { stats, hasFetchedStats } = dashboardState
  const [mounted, setMounted] = useState(false)

  // Fetch dashboard stats
  const fetchDashboardStats = () => {
    sendHttpRequest({
      successRes: (res) => {
        try {
          const dashboardStats = res?.data?.data
          if (dashboardStats) {
            dispatch(dashboardActions.setDashboardStats(dashboardStats))
          }
        } catch (error) {
          console.error('Error processing dashboard stats response:', error)
          toast.error('Failed to process dashboard statistics')
        }
      },
      requestConfig: {
        url: '/admin/dashboard',
        method: 'GET',
      },
    })
  }

  // Initial fetch on mount
  useEffect(() => {
    setMounted(true)
    if (!hasFetchedStats) {
      fetchDashboardStats()
    }
  }, [hasFetchedStats])

  // Reset loading state when request completes
  useEffect(() => {
    if (!isLoading && mounted && !hasFetchedStats) {
      // Request completed but no data - might be an error
      // Error is handled by useHttp and shown via toast
    }
  }, [isLoading, mounted, hasFetchedStats])

  // Show loading state
  if (!mounted || (isLoading && !hasFetchedStats)) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />
  }

  // Show error state
  if (error && !hasFetchedStats) {
    const handleRetry = () => {
      fetchDashboardStats()
    }

    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error || "We couldn't load your dashboard. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  // Use stats from Redux, fallback to defaults if not available
  const totalOrders = stats?.totalOrders || 0
  const totalMeasurementOrders = stats?.totalMeasurementOrders || 0
  const totalProducts = stats?.totalProducts || 0
  const pendingOrders = stats?.pendingOrders || 0
  const processingOrders = stats?.processingOrders || 0
  const shippedOrders = stats?.shippedOrders || 0
  const deliveredOrders = stats?.deliveredOrders || 0
  const recentOrders: RecentOrder[] = stats?.recentOrders || []

  const statsCards = [
    {
      name: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart
    },
    {
      name: 'Measurement Orders',
      value: totalMeasurementOrders.toString(),
      icon: Ruler
    },
    {
      name: 'Total Products',
      value: totalProducts.toString(),
      icon: Package
    },
    {
      name: 'Pending Orders',
      value: pendingOrders.toString(),
      icon: AlertCircle
    }
  ]

  const orderStatusStats = [
    { name: 'Pending', value: pendingOrders, color: 'bg-yellow-500' },
    { name: 'Processing', value: processingOrders, color: 'bg-blue-500' },
    { name: 'Shipped', value: shippedOrders, color: 'bg-purple-500' },
    { name: 'Delivered', value: deliveredOrders, color: 'bg-green-500' }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statsCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="flex items-center">
                <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recenta Orders</h2>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      {order.type === 'measurement' ? (
                        <Ruler className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
                      ) : (
                        <Package className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">#{order.id}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {order.customerName || 'Guest'}
                        </p>
                        {order.type === 'measurement' && order.category && (
                          <p className="text-xs text-gray-400 truncate">{order.category}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(order.amount)}
                      </p>
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          <span>{formatStatus(order.status)}</span>
                        </span>
                        {order.paymentStatus && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(order.paymentStatus)}`}>
                            {getStatusIcon(order.paymentStatus)}
                            <span>{formatStatus(order.paymentStatus)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-8 text-center text-gray-500">
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Status Overview</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {orderStatusStats.map((status) => (
                <div key={status.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${status.color} mr-3`}></div>
                    <span className="text-sm font-medium text-gray-900">{status.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/admin/products')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all duration-200 group"
            >
              <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Plus className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-left min-w-0 ml-4">
                <p className="font-medium text-gray-900">Add New Product</p>
                <p className="text-sm text-gray-500">Create a new product listing</p>
              </div>
            </button>
            
            {/* <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all duration-200 group">
              <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Eye className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-left min-w-0 ml-4">
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-500">Check detailed reports</p>
              </div>
            </button> */}
            
            <button 
              onClick={() => router.push('/admin/customers')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all duration-200 group"
            >
              <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-left min-w-0 ml-4">
                <p className="font-medium text-gray-900">Manage Customers</p>
                <p className="text-sm text-gray-500">View customer information</p>
              </div>
            </button>
            
            <button 
              onClick={() => router.push('/admin/unused-images')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all duration-200 group sm:col-span-2 lg:col-span-1"
            >
              <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <ImageIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-left min-w-0 ml-4">
                <p className="font-medium text-gray-900">Unused Images</p>
                <p className="text-sm text-gray-500">Clean up unused Cloudinary images</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
