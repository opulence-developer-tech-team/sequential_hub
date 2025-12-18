'use client'

interface ProductSizeSelectorProps {
  sizes: string[]
  selectedSize: string
  onSizeSelect: (size: string) => void
}

export default function ProductSizeSelector({
  sizes,
  selectedSize,
  onSizeSelect,
}: ProductSizeSelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeSelect(size)}
            className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
              selectedSize === size
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}













































