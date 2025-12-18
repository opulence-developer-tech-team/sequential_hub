'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Edit, Trash2, Eye, Star, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import { Product } from '@/types'
import { getCategoryLabel } from '@/lib/utils'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface ProductsTableProps {
  products: Product[]
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  deletingProductId?: string | null // Product ID (slug) that is currently being deleted
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
  currentPage?: number
}

export default function ProductsTable({
  products,
  onView,
  onEdit,
  onDelete,
  deletingProductId,
  pagination,
  onPageChange,
  currentPage = 1,
}: ProductsTableProps) {
  const [imageErrors] = useState<Record<string, boolean>>({})

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-w-full" style={{ maxWidth: '100vw' }}>
        <table className="w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                Product
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/6">
                Category
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const descriptionPreview =
                product.description && product.description.length > 60
                  ? `${product.description.slice(0, 60)}...`
                  : product.description || ''
              
              const variants = Array.isArray(product.productVariant) ? product.productVariant : []
              const totalQty = variants.reduce((sum, v) => sum + (typeof v.quantity === 'number' ? v.quantity : 0), 0)
              const totalReserved = variants.reduce((sum, v) => {
                const rq = (v as any).reservedQuantity
                return sum + (typeof rq === 'number' && !Number.isNaN(rq) && rq >= 0 ? rq : 0)
              }, 0)
              const totalAvailable = variants.reduce((sum, v) => {
                const q = typeof v.quantity === 'number' ? v.quantity : 0
                const rq = (v as any).reservedQuantity
                const reserved = typeof rq === 'number' && !Number.isNaN(rq) && rq >= 0 ? rq : 0
                return sum + Math.max(0, q - reserved)
              }, 0)

              return (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      <span className="truncate">{product.name}</span>
                      {product.isFeatured && (
                        <Star className="h-4 w-4 text-yellow-400 fill-current ml-2 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {descriptionPreview}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Stock: <span className="font-semibold text-gray-700">{totalAvailable}</span> available •{' '}
                      <span className="font-medium text-gray-600">{totalReserved}</span> reserved •{' '}
                      <span className="text-gray-500">{totalQty}</span> total
                    </div>
                    {/* Show category on mobile */}
                    <div className="text-xs text-gray-400 sm:hidden">
                      {getCategoryLabel(product.category)}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="text-sm text-gray-900">{getCategoryLabel(product.category)}</div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                    <button
                      onClick={() => onView(product)}
                      className="text-gray-400 hover:text-gray-600"
                      title="View Product"
                      aria-label="View product"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="text-primary-600 hover:text-primary-700"
                      title="Edit Product"
                      aria-label="Edit product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      disabled={deletingProductId === product._id}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Product"
                      aria-label="Delete product"
                    >
                      {deletingProductId === product._id ? (
                        <SewingMachineLoader size="sm" inline />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          {/* Mobile pagination */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange?.(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



















































