'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Edit, ImageIcon } from 'lucide-react'
import { Product } from '@/types'
import { ProductSize } from '@/types/enum'
import { formatPrice, getCategoryLabel } from '@/lib/utils'
import { getProductDisplayData } from '@/lib/product-display'

interface ViewProductModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (product: Product) => void
  product: Product | null
}

export default function ViewProductModal({
  isOpen,
  onClose,
  onEdit,
  product,
}: ViewProductModalProps) {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  if (!isOpen || !product) return null

  // Get display data from product variants
  const displayData = getProductDisplayData(product)
  
  // Calculate total quantity from all variants
  const totalQuantity = product.productVariant.reduce((sum, variant) => sum + (variant.quantity || 0), 0)

  // Use variants directly for image-color pairs (each variant has its own image and color)
  const variants = product.productVariant || []
  
  // Calculate pricing statistics
  const prices = variants.map(v => v.price ?? 0).filter(p => p > 0)
  const discountPrices = variants.map(v => v.discountPrice ?? 0).filter(p => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const minDiscountPrice = discountPrices.length > 0 ? Math.min(...discountPrices) : undefined
  const maxDiscountPrice = discountPrices.length > 0 ? Math.max(...discountPrices) : undefined
  
  // Calculate stock statistics
  const inStockVariants = variants.filter(v => v.inStock).length
  const outOfStockVariants = variants.length - inStockVariants
  const totalInStockQuantity = variants.filter(v => v.inStock).reduce((sum, v) => sum + (v.quantity || 0), 0)

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden h-screen w-screen"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm h-full w-full" />
      
      {/* Modal Container */}
      <div className="relative h-screen w-screen flex flex-col bg-white">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Product Header Info */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">{product.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {product.isFeatured && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Featured
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    displayData.inStock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {displayData.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
              
              {/* Pricing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Starting Price</span>
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(minPrice)}</span>
                  {minDiscountPrice && minDiscountPrice > minPrice && (
                    <span className="ml-2 text-sm text-gray-500 line-through">
                      {formatPrice(minDiscountPrice)}
                    </span>
                  )}
                </div>
                {maxPrice > minPrice && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Maximum Price</span>
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(maxPrice)}</span>
                    {maxDiscountPrice && maxDiscountPrice > maxPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        {formatPrice(maxDiscountPrice)}
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Total Inventory</span>
                  <span className="text-2xl font-bold text-gray-900">{totalQuantity}</span>
                  <span className="text-sm text-gray-600 ml-1">units</span>
                </div>
              </div>
            </div>

            {/* Product Variants (Images with Colors) */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
                <span className="text-sm text-gray-500">({variants.length} {variants.length === 1 ? 'variant' : 'variants'})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {variants.map((variant, index) => {
                  const basePrice = variant.price ?? 0
                  const baseDiscount = variant.discountPrice ?? 0
                  const discountPercentage = baseDiscount > basePrice
                    ? Math.round(((baseDiscount - basePrice) / baseDiscount) * 100)
                    : 0;
                  
                  return (
                    <div
                      key={variant._id || index}
                      className="group border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative h-64 w-full bg-gray-50 overflow-hidden">
                        {imageErrors[index] ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                          </div>
                        ) : (
                          <Image
                            src={Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
                              ? variant.imageUrls[0]
                              : (((variant as any).imageUrl as string | undefined) || '/file.svg')} // Backward compatibility
                            alt={`${product.name} - Variant ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            unoptimized={(Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
                              ? variant.imageUrls[0]
                              : ((variant as any).imageUrl as string | undefined))?.includes('via.placeholder.com')}
                            onError={() => handleImageError(index)}
                          />
                        )}
                        {discountPercentage > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                            -{discountPercentage}%
                          </div>
                        )}
                        {!variant.inStock && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Variant Details */}
                      <div className="p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Variant #{index + 1}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            variant.inStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {variant.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Color</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm"
                              style={{ backgroundColor: variant.color }}
                              title={variant.color}
                            />
                            <span className="text-xs text-gray-700 font-mono">{variant.color}</span>
                          </div>
                        </div>
                        
                        {variant.size && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</span>
                            <span className="text-sm text-gray-900 font-semibold px-2 py-1 bg-gray-100 rounded">{variant.size}</span>
                          </div>
                        )}
                        
                        <div className="space-y-1 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</span>
                            <div className="flex items-center gap-2">
                              {baseDiscount > basePrice ? (
                                <>
                                  <span className="text-sm text-gray-500 line-through">{formatPrice(baseDiscount)}</span>
                                  <span className="text-base font-bold text-primary-600">{formatPrice(basePrice)}</span>
                                </>
                              ) : (
                                <span className="text-base font-bold text-gray-900">{formatPrice(basePrice)}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</span>
                            <span className="text-sm text-gray-900 font-semibold">{variant.quantity} units</span>
                          </div>
                        </div>
                        
                        {variant.measurements && Object.keys(variant.measurements).length > 0 && (
                          <div className="pt-2 border-t">
                            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Measurements (inches)
                            </span>
                            <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-700">
                              {variant.measurements.neck !== undefined && (
                                <span>Neck: {variant.measurements.neck}</span>
                              )}
                              {variant.measurements.shoulder !== undefined && (
                                <span>Shoulder: {variant.measurements.shoulder}</span>
                              )}
                              {variant.measurements.chest !== undefined && (
                                <span>Chest: {variant.measurements.chest}</span>
                              )}
                              {variant.measurements.shortSleeve !== undefined && (
                                <span>Short sleeve: {variant.measurements.shortSleeve}</span>
                              )}
                              {variant.measurements.longSleeve !== undefined && (
                                <span>Long sleeve: {variant.measurements.longSleeve}</span>
                              )}
                              {variant.measurements.roundSleeve !== undefined && (
                                <span>Round sleeve: {variant.measurements.roundSleeve}</span>
                              )}
                              {variant.measurements.tummy !== undefined && (
                                <span>Tummy: {variant.measurements.tummy}</span>
                              )}
                              {variant.measurements.topLength !== undefined && (
                                <span>Top length: {variant.measurements.topLength}</span>
                              )}
                              {variant.measurements.waist !== undefined && (
                                <span>Waist: {variant.measurements.waist}</span>
                              )}
                              {variant.measurements.laps !== undefined && (
                                <span>Laps: {variant.measurements.laps}</span>
                              )}
                              {variant.measurements.kneelLength !== undefined && (
                                <span>Kneel length: {variant.measurements.kneelLength}</span>
                              )}
                              {variant.measurements.roundKneel !== undefined && (
                                <span>Round kneel: {variant.measurements.roundKneel}</span>
                              )}
                              {variant.measurements.trouserLength !== undefined && (
                                <span>Trouser length: {variant.measurements.trouserLength}</span>
                              )}
                              {variant.measurements.ankle !== undefined && (
                                <span>Ankle: {variant.measurements.ankle}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>Product Information</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Category</span>
                    <span className="text-base text-gray-900 font-medium">{getCategoryLabel(product.category)}</span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Material</span>
                    <span className="text-base text-gray-900 font-medium">{product.material || 'N/A'}</span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Product Owner</span>
                    <span className="text-base text-gray-900 font-medium">{product.productOwner || 'self'}</span>
                  </div>
                  
                  {product.slug && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Slug</span>
                      <span className="text-sm text-gray-900 font-medium font-mono break-all">{product.slug}</span>
                    </div>
                  )}
                  
                  {product._id && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Product ID</span>
                      <span className="text-sm text-gray-900 font-medium font-mono break-all">{product._id}</span>
                    </div>
                  )}
                  
                  {product.adminId && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Admin ID</span>
                      <span className="text-sm text-gray-900 font-medium font-mono break-all">{product.adminId}</span>
                    </div>
                  )}
                  
                  {product.createdAt && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Created At</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  
                  {product.updatedAt && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Last Updated</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {new Date(product.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Statistics & Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics & Summary</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Total Variants</span>
                    <span className="text-2xl font-bold text-gray-900">{variants.length}</span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Total Quantity</span>
                    <span className="text-2xl font-bold text-gray-900">{totalQuantity}</span>
                    <span className="text-sm text-gray-600 ml-1">units</span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">In Stock Variants</span>
                    <span className="text-xl font-semibold text-green-600">{inStockVariants}</span>
                    <span className="text-sm text-gray-600 ml-1">of {variants.length}</span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Available Quantity</span>
                    <span className="text-xl font-semibold text-green-600">{totalInStockQuantity}</span>
                    <span className="text-sm text-gray-600 ml-1">units</span>
                  </div>
                  
                  {outOfStockVariants > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Out of Stock</span>
                      <span className="text-xl font-semibold text-red-600">{outOfStockVariants}</span>
                      <span className="text-sm text-gray-600 ml-1">variants</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Available Options */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Options</h3>
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">Available Sizes</span>
                    <div className="flex flex-wrap gap-2">
                      {displayData.sizes.length > 0 ? (
                        displayData.sizes.map((size: ProductSize) => (
                          <span 
                            key={size} 
                            className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 shadow-sm"
                          >
                            {size}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No sizes available</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">All Colors</span>
                    <div className="flex flex-wrap gap-2">
                      {displayData.colors.length > 0 ? (
                        displayData.colors.map((color: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-xs text-gray-700 font-mono">{color}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No colors available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose()
              onEdit(product)
            }}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center shadow-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </button>
        </div>
      </div>
    </div>
  )
}





















