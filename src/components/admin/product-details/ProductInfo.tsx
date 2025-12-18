'use client'

import { Product } from '@/types'
import { formatPrice, calculateDiscount, getCategoryLabel } from '@/lib/utils'

interface ProductInfoProps {
  product: Product & {
    price?: number | null
    originalPrice?: number | null
    inStock?: boolean
  }
}

export default function ProductInfo({ product }: ProductInfoProps) {
  // Handle null prices - use 0 as fallback for display, but formatPrice will show "N/A" for null
  const price = product.price ?? 0
  const originalPrice = product.originalPrice
  const inStock = product.inStock ?? false
  
  // Only calculate discount if both prices are valid (not null)
  const discount = 
    originalPrice !== null && 
    originalPrice !== undefined && 
    price !== null && 
    price !== undefined &&
    originalPrice > price
      ? calculateDiscount(originalPrice, price)
      : 0

  return (
    <div>
      <div className="mb-2">
        <span className="text-sm text-gray-500 capitalize">{getCategoryLabel(product.category)}</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
      
      <p className="text-gray-600 mb-4">{product.description}</p>

      <div className="mb-6">
        <span className="text-sm font-medium text-gray-700">Material: </span>
        <span className="text-sm text-gray-600">{product.material || 'N/A'}</span>
      </div>

      {/* Price */}
      <div className="flex items-center space-x-4 mb-6">
        {product.price !== null && product.price !== undefined ? (
          <>
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {originalPrice !== null && 
             originalPrice !== undefined && 
             price !== null && 
             price !== undefined &&
             originalPrice > price && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  -{discount > 0 ? `${discount.toFixed(1)}%` : '0%'}
                </span>
              </>
            )}
          </>
        ) : (
          <span className="text-lg font-semibold text-amber-600">
            Price unavailable
          </span>
        )}
      </div>

      {/* Stock Status */}
      <div className="mb-6">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          inStock 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
    </div>
  )
}


