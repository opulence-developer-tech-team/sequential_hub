'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { formatPrice, isPlaceholderImage, isValidHexColor } from '@/lib/utils'

interface CartItem {
  productId: string
  variantId: string
  productName: string
  variantImageUrls: string[] // Array of image URLs for the variant
  variantImageUrl?: string // Backward compatibility (legacy single image)
  variantSize: string
  variantColor: string
  quantity: number
  itemTotal: number
}

interface CartData {
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  freeShippingThreshold?: number
}

interface OrderSummaryProps {
  cartData: CartData
}

export default function OrderSummary({ cartData }: OrderSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-8 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Order Summary</h2>
      </div>
      
      <div className="p-6">
        {/* Cart Items */}
        <div className="space-y-5 mb-6 max-h-80 overflow-y-auto pr-2">
          {cartData.items.map((item, index) => (
            <motion.div
              key={`${item.productId}-${item.variantId}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0"
            >
              <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
                    ? item.variantImageUrls[0]
                    : (item.variantImageUrl || 'https://via.placeholder.com/80x80?text=Product')} // Backward compatibility
                  alt={item.productName}
                  fill
                  className="object-cover"
                  unoptimized={isPlaceholderImage(Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
                    ? item.variantImageUrls[0]
                    : (item.variantImageUrl || ''))}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Product'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                  {item.productName}
                </p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">{item.variantSize}</span>
                  {isValidHexColor(item.variantColor) && (
                    <span
                      className="w-3 h-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: item.variantColor }}
                      title={item.variantColor}
                      aria-label={`Color: ${item.variantColor}`}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatPrice(item.itemTotal)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-3 border-t border-gray-100 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatPrice(cartData.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-900">
              {cartData.freeShippingThreshold !== undefined && 
               cartData.subtotal >= cartData.freeShippingThreshold 
                ? 'Free' 
                : cartData.shipping === 0 
                  ? formatPrice(0) 
                  : formatPrice(cartData.shipping)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium text-gray-900">{formatPrice(cartData.tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-4 mt-4">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatPrice(cartData.total)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}






































