import { Package, Ruler } from 'lucide-react'
import type { TabType } from './types'

interface OrdersTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  regularOrdersCount: number
  measurementOrdersCount: number
  hasFetchedRegularOrders: boolean
  hasFetchedMeasurementOrders: boolean
}

export default function OrdersTabs({
  activeTab,
  onTabChange,
  regularOrdersCount,
  measurementOrdersCount,
  hasFetchedRegularOrders,
  hasFetchedMeasurementOrders,
}: OrdersTabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1" aria-label="Tabs">
          <button
            onClick={() => onTabChange('regular')}
            className={`${
              activeTab === 'regular'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            } group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium border-b-2 focus:z-10 transition-all duration-200`}
          >
            <div className="flex items-center justify-center">
              <Package className={`h-5 w-5 mr-2 ${activeTab === 'regular' ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Regular Orders</span>
              {hasFetchedRegularOrders && regularOrdersCount > 0 && (
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-semibold ${
                  activeTab === 'regular'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {regularOrdersCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => onTabChange('measurement')}
            className={`${
              activeTab === 'measurement'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            } group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium border-b-2 focus:z-10 transition-all duration-200`}
          >
            <div className="flex items-center justify-center">
              <Ruler className={`h-5 w-5 mr-2 ${activeTab === 'measurement' ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span>Measurement Orders</span>
              {hasFetchedMeasurementOrders && measurementOrdersCount > 0 && (
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-semibold ${
                  activeTab === 'measurement'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {measurementOrdersCount}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>
    </div>
  )
}
