'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getProductDisplayData } from '@/lib/product-display'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'

interface DeleteProductModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  product: Product | null
  isDeleting?: boolean
}

export default function DeleteProductModal({
  isOpen,
  onClose,
  onConfirm,
  product,
  isDeleting = false,
}: DeleteProductModalProps) {
  if (!isOpen || !product) return null

  const display = getProductDisplayData(product)
  const primaryImage = display.images[0] || 'https://via.placeholder.com/48x48?text=Product'
  const price = display.price

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="mt-3 text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          
          {/* Modal Content */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Product
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <strong>"{product.name}"</strong>? 
              This action cannot be undone.
            </p>
            
            {/* Product Preview */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                    sizes="48px"
                    unoptimized={primaryImage.includes('via.placeholder.com')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/48x48?text=Product'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {product.category} • {formatPrice(price)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal Actions */}
          <div className="flex items-center justify-center space-x-3 px-4 py-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <SewingMachineLoader size="sm" inline className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



















































