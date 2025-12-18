import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationState } from './types'

interface OrdersPaginationProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
}

export default function OrdersPagination({ pagination, onPageChange }: OrdersPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null
  }

  const startItem = (pagination.page - 1) * pagination.limit + 1
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4">
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
        <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
        <span className="font-semibold text-gray-900">{pagination.total}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
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
          onClick={() => onPageChange(pagination.page + 1)}
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
  )
}

