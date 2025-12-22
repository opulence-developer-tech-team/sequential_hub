'use client'

import { X } from 'lucide-react'

interface ProductQuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  maxQuantity?: number
  onRemove?: () => void
}

export default function ProductQuantitySelector({
  quantity,
  onQuantityChange,
  maxQuantity,
  onRemove,
}: ProductQuantitySelectorProps) {
  const handleDecrease = () => {
    const newQuantity = Math.max(1, quantity - 1)
    onQuantityChange(newQuantity)
    // If quantity reaches 0, remove from cart
    if (newQuantity === 0 && onRemove) {
      onRemove()
    }
  }

  const handleIncrease = () => {
    const newQuantity = quantity + 1
    if (maxQuantity && newQuantity > maxQuantity) {
      return // Don't allow exceeding max quantity
    }
    onQuantityChange(newQuantity)
  }
  
  const isMaxReached = maxQuantity ? quantity >= maxQuantity : false

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="px-4 py-3 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg border-r border-gray-300"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="px-6 py-3 bg-white text-gray-900 font-semibold text-base min-w-[70px] text-center border-r border-gray-300">
          {quantity}
        </span>
        <button
          onClick={handleIncrease}
          disabled={isMaxReached}
          className="px-4 py-3 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
          aria-label="Remove from cart"
        >
          <X className="h-4 w-4" />
          Remove
        </button>
      )}
    </div>
  )
}





















































