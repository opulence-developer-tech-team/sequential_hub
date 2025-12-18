import { Search, Filter } from 'lucide-react'
import type { StatusOption } from './types'

interface OrdersFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  statusOptions: StatusOption[]
  resultsCount: number
}

export default function OrdersFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  statusOptions,
  resultsCount,
}: OrdersFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input - Takes most space */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search orders by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all shadow-sm hover:border-gray-400"
            />
          </div>
          
          {/* Right side filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Status Filter */}
            <div className="w-full sm:w-56">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <select
                  id="status-select"
                  value={selectedStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm shadow-sm hover:border-gray-400 transition-all appearance-none cursor-pointer"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="text-sm text-gray-600 sm:border-l sm:border-gray-200 sm:pl-4 flex items-center">
              <span className="font-semibold text-gray-900 text-base">{resultsCount}</span>
              <span className="ml-1.5 text-gray-500">{resultsCount === 1 ? 'order' : 'orders'} found</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

