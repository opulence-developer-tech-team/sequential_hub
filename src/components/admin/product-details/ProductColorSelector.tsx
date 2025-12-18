'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ProductColorSelectorProps {
  colors: string[]
  selectedColor: string
  onColorSelect: (color: string) => void
}

export default function ProductColorSelector({
  colors,
  selectedColor,
  onColorSelect,
}: ProductColorSelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          // Check if color is a valid hex color
          const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
          const colorStyle = isValidHex ? { backgroundColor: color } : {}
          const isSelected = selectedColor === color
          
          return (
            <motion.button
              key={color}
              onClick={() => onColorSelect(color)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: isSelected ? 1.1 : 1,
                borderColor: isSelected ? '#3b82f6' : '#d1d5db',
              }}
              transition={{ duration: 0.2 }}
              className={`relative w-12 h-12 rounded-full border-2 ${
                isSelected
                  ? 'ring-2 ring-primary-200 ring-offset-2'
                  : 'hover:border-gray-400'
              }`}
              style={colorStyle}
              aria-label={`Select color ${isValidHex ? color : color}`}
              title={isValidHex ? color : color}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}


















































