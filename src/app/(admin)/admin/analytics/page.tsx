'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Package, Eye, Calendar } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  const stats = {
    totalRevenue: 45680,
    totalOrders: 1247,
    totalCustomers: 892,
    totalProducts: 156,
    conversionRate: 3.2,
    averageOrderValue: 36.64,
    pageViews: 45620,
    bounceRate: 42.1
  }

  const revenueData = [
    { month: 'Jan', revenue: 12000, orders: 320 },
    { month: 'Feb', revenue: 15000, orders: 380 },
    { month: 'Mar', revenue: 18000, orders: 420 },
    { month: 'Apr', revenue: 22000, orders: 480 },
    { month: 'May', revenue: 25000, orders: 520 },
    { month: 'Jun', revenue: 28000, orders: 580 },
    { month: 'Jul', revenue: 32000, orders: 650 },
    { month: 'Aug', revenue: 35000, orders: 720 },
    { month: 'Sep', revenue: 38000, orders: 780 },
    { month: 'Oct', revenue: 42000, orders: 850 },
    { month: 'Nov', revenue: 45000, orders: 920 },
    { month: 'Dec', revenue: 45680, orders: 1247 }
  ]

  const topProducts = [
    { name: 'Classic White Dress Shirt', sales: 156, revenue: 14004 },
    { name: 'Premium Wool Blazer', sales: 89, revenue: 31111 },
    { name: 'Elegant Black Evening Dress', sales: 78, revenue: 15599 },
    { name: 'Casual Denim Jeans', sales: 134, revenue: 10719 },
    { name: 'Silk Blouse', sales: 92, revenue: 11959 }
  ]

  const topCategories = [
    { name: 'Packet Shirts', sales: 234, revenue: 21060 },
    { name: 'Vintage Shirts', sales: 189, revenue: 17010 },
    { name: 'Plain Pants', sales: 156, revenue: 18720 },
    { name: 'Joggers', sales: 134, revenue: 10720 },
    { name: 'Senators', sales: 89, revenue: 26700 }
  ]

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: 299.98, status: 'Completed', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: 149.99, status: 'Processing', date: '2024-01-14' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: 89.99, status: 'Shipped', date: '2024-01-13' },
    { id: 'ORD-004', customer: 'Sarah Wilson', amount: 199.99, status: 'Completed', date: '2024-01-12' },
    { id: 'ORD-005', customer: 'David Brown', amount: 349.99, status: 'Pending', date: '2024-01-11' }
  ]

  const StatCard = ({ title, value, icon: Icon, change, changeType }: {
    title: string
    value: string | number
    icon: any
    change?: string
    changeType?: 'positive' | 'negative'
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-100 rounded-full">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-primary-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Track your store performance and insights</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-col">
                <label htmlFor="time-range-select" className="text-xs text-gray-500 mb-1">Time Range</label>
                      <select
                        id="time-range-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                        style={{ color: '#111827', backgroundColor: 'white' }}
                      >
                        <option value="7d" style={{ color: '#111827', backgroundColor: 'white' }}>Last 7 days</option>
                        <option value="30d" style={{ color: '#111827', backgroundColor: 'white' }}>Last 30 days</option>
                        <option value="90d" style={{ color: '#111827', backgroundColor: 'white' }}>Last 90 days</option>
                        <option value="1y" style={{ color: '#111827', backgroundColor: 'white' }}>Last year</option>
                      </select>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatPrice(stats.totalRevenue)}
            icon={DollarSign}
            change="+12.5% from last month"
            changeType="positive"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            change="+8.2% from last month"
            changeType="positive"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            icon={Users}
            change="+15.3% from last month"
            changeType="positive"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
            change="+3 new products"
            changeType="positive"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            icon={TrendingUp}
            change="+0.5% from last month"
            changeType="positive"
          />
          <StatCard
            title="Average Order Value"
            value={formatPrice(stats.averageOrderValue)}
            icon={DollarSign}
            change="+$2.10 from last month"
            changeType="positive"
          />
          <StatCard
            title="Page Views"
            value={stats.pageViews.toLocaleString()}
            icon={Eye}
            change="+5.8% from last month"
            changeType="positive"
          />
          <StatCard
            title="Bounce Rate"
            value={`${stats.bounceRate}%`}
            icon={TrendingUp}
            change="-2.1% from last month"
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="space-y-4">
              {revenueData.slice(-6).map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{data.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(data.revenue / 50000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-20 text-right">
                      {formatPrice(data.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 text-xs font-medium rounded-full flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Top Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
            <div className="space-y-4">
              {topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 text-xs font-medium rounded-full flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-500">{category.sales} sales</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(category.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                    <p className="text-xs text-gray-500">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatPrice(order.amount)}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900">Growth Rate</h4>
              <p className="text-2xl font-semibold text-green-600">+18.5%</p>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900">Customer Retention</h4>
              <p className="text-2xl font-semibold text-blue-600">78.2%</p>
              <p className="text-xs text-gray-500">returning customers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900">Cart Abandonment</h4>
              <p className="text-2xl font-semibold text-purple-600">24.8%</p>
              <p className="text-xs text-gray-500">abandonment rate</p>
            </div>
          </div>
        </div>
    </div>
  )
}
