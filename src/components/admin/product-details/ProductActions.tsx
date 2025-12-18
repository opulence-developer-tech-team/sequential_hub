'use client'

import { Heart, Share2 } from 'lucide-react'

interface ProductActionsProps {
  isInStock: boolean
  hasSelectedSize: boolean
  hasSelectedColor: boolean
  isLiked: boolean
  onAddToCart: () => void
  onToggleLike: () => void
  canAddToCart?: boolean
}

export default function ProductActions({
  isInStock,
  hasSelectedSize,
  hasSelectedColor,
  isLiked,
  onAddToCart,
  onToggleLike,
  canAddToCart = true,
}: ProductActionsProps) {
  const isDisabled = !isInStock || !hasSelectedSize || !hasSelectedColor || !canAddToCart
  
  return (
    <div className="space-y-4">
      <button
        onClick={onAddToCart}
        disabled={isDisabled}
        className="w-full bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Add to Cart
      </button>

      <div className="flex space-x-4">
        <button
          onClick={onToggleLike}
          className={`flex-1 py-2 px-4 border rounded-md transition-colors ${
            isLiked
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Heart className={`h-4 w-4 mx-auto ${isLiked ? 'fill-current' : ''}`} />
        </button>
        <button className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:border-gray-400 transition-colors">
          <Share2 className="h-4 w-4 mx-auto" />
        </button>
      </div>
    </div>
  )
}













































