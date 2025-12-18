import { Eye, Package, Ruler } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/store/redux/adminSlice/order-slice'
import type { MeasurementOrder } from '@/store/redux/adminSlice/measurement-order-slice'
import type { TabType, StatusOption } from './types'
import { getStatusIcon, getStatusColor, formatStatus } from './utils'

interface OrdersTableProps {
  orders: (Order | MeasurementOrder)[]
  activeTab: TabType
  statusOptions: StatusOption[]
  onViewOrder: (order: Order | MeasurementOrder) => void
  onUpdateStatus: (order: Order | MeasurementOrder, newStatus: string) => void
  isUpdatingStatus?: boolean
  updatingOrderId?: string | null
}

export default function OrdersTable({
  orders,
  activeTab,
  statusOptions,
  onViewOrder,
  onUpdateStatus,
  isUpdatingStatus = false,
  updatingOrderId = null,
}: OrdersTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto max-w-full" style={{ maxWidth: '100vw' }}>
        <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Order
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                Customer
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                Details
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                Payment Status
              </th>
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                Date
              </th>
              <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order, index) => {
              const status = activeTab === 'regular' 
                ? (order as Order).orderStatus 
                : (order as MeasurementOrder).status
              
              const paymentStatus = activeTab === 'regular'
                ? (order as Order).paymentStatus
                : (order as MeasurementOrder).paymentStatus
              
              const customerName = activeTab === 'regular'
                ? `${(order as Order).shippingAddress.firstName} ${(order as Order).shippingAddress.lastName}`
                : (order as MeasurementOrder).name
              
              const customerEmail = activeTab === 'regular'
                ? (order as Order).shippingAddress.email
                : (order as MeasurementOrder).email
              
              const total = activeTab === 'regular'
                ? (order as Order).total
                : (() => {
                    const mOrder = order as MeasurementOrder
                    if (mOrder.price == null) return null
                    const basePrice = mOrder.price || 0
                    const deliveryFee = mOrder.deliveryFee || 0
                    const tax = mOrder.tax || 0
                    return basePrice + deliveryFee + tax
                  })() // Measurement orders: show full total including tax & delivery
              
              const details = activeTab === 'regular'
                ? `${(order as Order).items.length} item${(order as Order).items.length !== 1 ? 's' : ''}`
                : `${(order as MeasurementOrder).templates.length} template${(order as MeasurementOrder).templates.length !== 1 ? 's' : ''}`

              return (
                <tr 
                  key={order._id} 
                  className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center min-w-0">
                      <div className={`p-2 rounded-lg mr-3 ${
                        activeTab === 'measurement' 
                          ? 'bg-purple-100' 
                          : 'bg-blue-100'
                      }`}>
                        {activeTab === 'measurement' ? (
                          <Ruler className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Package className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          #{order.orderNumber}
                        </div>
                        <div className="flex items-center gap-2 sm:hidden mt-0.5">
                          <div className="text-xs text-gray-500 truncate">
                            {customerName}
                          </div>
                          {order.isGuest ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                              Guest
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                              User
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {customerName}
                      </div>
                      {order.isGuest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                          Guest
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          User
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {customerEmail}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 hidden lg:table-cell">
                    <div className="text-sm text-gray-700 font-medium">
                      {details}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {activeTab === 'regular'
                        ? formatPrice(total)
                        : total !== null && total !== undefined
                          ? formatPrice(total)
                          : <span className="text-gray-400">Not set</span>
                      }
                    </div>
                    {activeTab === 'measurement' && (order as MeasurementOrder).price != null && (
                      <div className="mt-1 text-xs text-gray-500">
                        {(() => {
                          const mOrder = order as MeasurementOrder
                          const basePrice = mOrder.price || 0
                          const deliveryFee = mOrder.deliveryFee || 0
                          const tax = mOrder.tax || 0
                          const isExpired =
                            (mOrder as any).isReplaced === true ||
                            Boolean((mOrder as any).replacedByOrderId)

                          if (isExpired) {
                            return (
                              <span className="text-amber-600">
                                This measurement order has expired because the price was updated and a new receipt was issued.
                              </span>
                            )
                          }

                          return (
                            <>
                              <span>Base: {formatPrice(basePrice)}</span>
                              <span className="mx-1">•</span>
                              <span>
                                Delivery: {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                              </span>
                              <span className="mx-1">•</span>
                              <span>Tax: {formatPrice(tax)}</span>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="ml-1.5">{formatStatus(status)}</span>
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap hidden lg:table-cell">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getStatusColor(paymentStatus)}`}>
                      {getStatusIcon(paymentStatus)}
                      <span className="ml-1.5">{formatStatus(paymentStatus)}</span>
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-700">
                      {order.createdAt ? formatDate(new Date(order.createdAt)) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                        title="View Order"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <select
                        id={`status-${order._id}`}
                        value={status}
                        onChange={(e) => onUpdateStatus(order, e.target.value)}
                        disabled={isUpdatingStatus && updatingOrderId === order._id}
                        className="text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 font-medium cursor-pointer hover:border-gray-400 transition-all shadow-sm min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {statusOptions
                          .filter(opt => opt.value !== '')
                          .map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

