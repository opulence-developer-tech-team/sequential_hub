'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHttp } from '@/hooks/useHttp'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { removeProductFromWishlist, type WishlistProduct } from '@/store/redux/user/user-wishlist-slice'
import { clientCartActions } from '@/store/redux/cart/client-cart'
import { Product } from '@/types'
import { ClothingCategory, ProductSize } from '@/types/enum'
import { formatPrice, calculateDiscount, isPlaceholderImage } from '@/lib/utils'
import { getProductDisplayData } from '@/lib/product-display'
import Link from 'next/link'
import Image from 'next/image'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import { Heart, ShoppingCart, Trash2, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'

// Type for cart items from Redux state
interface CartItem {
  productId: string
  variantId: string
  quantity: number
}

// Helper function to validate MongoDB ObjectId format (24 hex characters)
const isValidObjectId = (id: string | undefined | null): boolean => {
  if (!id || typeof id !== 'string' || id.length === 0) {
    return false
  }
  // MongoDB ObjectId is 24 hex characters
  // Also reject fallback IDs like "variant-0"
  if (id.startsWith('variant-')) {
    return false
  }
  return /^[0-9a-fA-F]{24}$/.test(id)
}


interface WishlistTabProps {
  isLoading: boolean
  products?: WishlistProduct[]
  productIds: string[]
}

export default function WishlistTab({ isLoading, products: wishlistProducts, productIds }: WishlistTabProps) {
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector((state) => state.clientCart.clientCartItems) || []
  const { sendHttpRequest: toggleWishlistReq } = useHttp()
  const [products, setProducts] = useState<Product[]>([])
  const [removingProductId, setRemovingProductId] = useState<string | null>(null)
  // Track variant index and hover state for each product
  const [variantIndices, setVariantIndices] = useState<Record<string, number>>({})
  const [hoveredProducts, setHoveredProducts] = useState<Record<string, boolean>>({})

  // Convert wishlist products from API to Product format
  // Note: null values for quantity/price/discountPrice are converted to 0 for Product type compatibility
  // but getProductDisplayData will still return null if all variants have null prices, allowing UI to show "N/A"
  useEffect(() => {
    if (wishlistProducts && wishlistProducts.length > 0) {
      const convertedProducts: Product[] = wishlistProducts.map((apiProduct) => ({
        _id: apiProduct._id,
        adminId: '', // Wishlist products don't have adminId, use empty string as fallback
        name: apiProduct.name || '',
        slug: apiProduct.slug || '',
        description: apiProduct.description || '',
        category: (apiProduct.category as ClothingCategory) || ClothingCategory.Packet_Shirt, // Default to Packet_Shirt if invalid
        material: ((apiProduct as any).material as string | undefined) || 'N/A',
        productVariant: Array.isArray(apiProduct.productVariant)
          ? apiProduct.productVariant.map((v) => ({
              _id: v._id || '',
              imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
                : (() => {
                    // Backward compatibility: tolerate persisted/legacy wishlist items
                    const vAny = v as any
                    return vAny.imageUrl && typeof vAny.imageUrl === 'string' && vAny.imageUrl.trim().length > 0
                      ? [vAny.imageUrl]
                      : []
                  })(),
              color: v.color || '',
              size: (v.size as ProductSize) || ProductSize.S, // Default to S if invalid
              // Convert null to 0 for Product type compatibility (Product type expects number)
              // getProductDisplayData will filter out invalid values and return null if all are invalid
              quantity: v.quantity ?? 0,
              price: v.price ?? 0,
              discountPrice: v.discountPrice ?? 0,
              inStock: typeof v.inStock === 'boolean' ? v.inStock : false,
            }))
          : [],
        isFeatured: Boolean(apiProduct.isFeatured),
        createdAt: apiProduct.createdAt,
        updatedAt: apiProduct.updatedAt,
      }))
      setProducts(convertedProducts)
      
      // Initialize variant indices for all products (ensure valid index)
      const initialIndices: Record<string, number> = {}
      convertedProducts.forEach((product) => {
        if (!(product._id in variantIndices)) {
          const variants = Array.isArray(product.productVariant) ? product.productVariant : []
          // Ensure index is always valid (0 if no variants, otherwise 0)
          initialIndices[product._id] = variants.length > 0 ? 0 : 0
        }
      })
      if (Object.keys(initialIndices).length > 0) {
        setVariantIndices((prev) => ({ ...prev, ...initialIndices }))
      }
    } else {
      setProducts([])
      setVariantIndices({})
      setHoveredProducts({})
    }
  }, [wishlistProducts])

  const handleRemoveFromWishlist = useCallback((productId: string) => {
    // Prevent duplicate requests
    if (removingProductId === productId) {
      return
    }

    setRemovingProductId(productId)
    toggleWishlistReq({
      successRes: (res: any) => {
        if (res?.data?.data?.operation === 'removed') {
          dispatch(removeProductFromWishlist(productId))
          toast.success('Removed from wishlist')
          setProducts((prev) => prev.filter((p) => p._id !== productId))
          // Clean up variant index and hover state
          setVariantIndices((prev) => {
            const updated = { ...prev }
            delete updated[productId]
            return updated
          })
          setHoveredProducts((prev) => {
            const updated = { ...prev }
            delete updated[productId]
            return updated
          })
        } else {
          toast.error('Failed to remove item from wishlist')
        }
        setRemovingProductId(null)
      },
      requestConfig: {
        url: '/user/wishlist',
        method: 'POST',
        body: {
          productId,
        },
      },
    })
  }, [removingProductId, toggleWishlistReq, dispatch])

  // Auto-cycle through variants for each product (only if multiple variants)
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []

    products.forEach((product) => {
      const variants = Array.isArray(product.productVariant) ? product.productVariant : []
      // Only auto-cycle if there are multiple variants
      if (variants.length <= 1) return

      const productId = product._id
      const isHovered = hoveredProducts[productId] || false

      // Don't auto-cycle when hovered - let user see the variant they're looking at
      if (isHovered) return

      const interval = setInterval(() => {
        setVariantIndices((prev) => {
          const currentIndex = prev[productId] || 0
          // Ensure index is always valid
          const nextIndex = (currentIndex + 1) % variants.length
          return {
            ...prev,
            [productId]: nextIndex,
          }
        })
      }, 3000) // Change variant every 3 seconds

      intervals.push(interval)
    })

    return () => {
      intervals.forEach((interval) => {
        if (interval) {
          clearInterval(interval)
        }
      })
    }
  }, [products, hoveredProducts])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SewingMachineLoader size="md" text="Loading wishlist..." />
      </div>
    )
  }

  if (productIds.length === 0) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Wishlist</h2>
        <div className="text-center py-12">
          <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6">Start adding products you love to your wishlist</p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
                </div>
              </div>
    )
  }

  if (products.length === 0 && productIds.length > 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Wishlist</h2>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products...</p>
          </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Wishlist ({products.length})</h2>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
        layout
        initial={false}
      >
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <WishlistItemCard
              key={product._id}
              product={product}
              index={index}
              variantIndex={variantIndices[product._id] || 0}
              isHovered={hoveredProducts[product._id] || false}
              isRemoving={removingProductId === product._id}
              cartItems={cartItems}
              onVariantChange={(newIndex) => 
                setVariantIndices((prev) => ({ ...prev, [product._id]: newIndex }))
              }
              onHoverChange={(isHovered) =>
                setHoveredProducts((prev) => ({ ...prev, [product._id]: isHovered }))
              }
              onRemove={() => handleRemoveFromWishlist(product._id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Separate component for each wishlist item to properly use hooks
interface WishlistItemCardProps {
  product: Product
  index: number
  variantIndex: number
  isHovered: boolean
  isRemoving: boolean
  cartItems: CartItem[]
  onVariantChange: (newIndex: number) => void
  onHoverChange: (isHovered: boolean) => void
  onRemove: () => void
}

function WishlistItemCard({
  product,
  index,
  variantIndex,
  isHovered,
  isRemoving,
  cartItems,
  onVariantChange,
  onHoverChange,
  onRemove,
}: WishlistItemCardProps) {
  const dispatch = useAppDispatch()
  
  const variants = Array.isArray(product.productVariant) && product.productVariant.length > 0
    ? product.productVariant
    : []
  
  // Ensure variantIndex is always valid (bounds checking)
  const safeVariantIndex = useMemo(() => {
    if (variants.length === 0) return 0
    if (variantIndex < 0) return 0
    if (variantIndex >= variants.length) return variants.length - 1
    return variantIndex
  }, [variantIndex, variants.length])
  
  // Update parent if index was invalid
  useEffect(() => {
    if (safeVariantIndex !== variantIndex && variants.length > 0) {
      onVariantChange(safeVariantIndex)
    }
  }, [safeVariantIndex, variantIndex, variants.length, onVariantChange])
  
  const display = getProductDisplayData(product)
  const fallbackImages = display.images.length > 0 ? display.images : ['https://via.placeholder.com/400x400?text=Product']
  
  const hasVariants = variants.length > 0
  // Only get the current variant if we have a valid index
  const currentVariant = useMemo(() => {
    if (!hasVariants) {
      // Product has no variants, return null (we'll use display data instead)
      return null
    }
    if (safeVariantIndex < 0 || safeVariantIndex >= variants.length) {
      return null
    }
    return variants[safeVariantIndex]
  }, [hasVariants, safeVariantIndex, variants])
  
  // Handle both new imageUrls array and old imageUrl field for backward compatibility
  const currentImage = currentVariant 
    ? (Array.isArray(currentVariant.imageUrls) && currentVariant.imageUrls.length > 0
        ? currentVariant.imageUrls[0] // Use first image from array
        : (((currentVariant as any).imageUrl as string | undefined) || fallbackImages[0]))
    : fallbackImages[0]
  const currentPrice = currentVariant?.price ?? display.price
  const currentDiscountPrice = currentVariant?.discountPrice ?? display.discountPrice
  const currentInStock = Boolean(currentVariant?.inStock ?? display.inStock)
  const currentColor = currentVariant?.color || ''
  const currentSize = currentVariant?.size || ''
  const hasValidPrice = currentPrice !== null && currentPrice !== undefined
  
  // Determine if we should show the cart button:
  // - For products WITH variants: only show when we have a valid active variant at the current index
  // - For products WITHOUT variants: always show (no variant selection needed)
  const shouldShowCartButton = useMemo(() => {
    if (!hasVariants) {
      // No variants, always show button
      return true
    }
    // Has variants - only show if we have a valid current variant that matches the active index
    if (!currentVariant || safeVariantIndex < 0 || safeVariantIndex >= variants.length) {
      return false
    }
    // Verify the current variant matches the one at the active index
    const variantAtActiveIndex = variants[safeVariantIndex]
    return variantAtActiveIndex?._id === currentVariant._id
  }, [hasVariants, currentVariant, safeVariantIndex, variants])

  // Use MongoDB ObjectId strings directly for cart
  const productId = useMemo(() => {
    if (!product._id || !isValidObjectId(product._id.toString())) return ''
    return product._id.toString()
  }, [product._id])
  
  const variantId = useMemo(() => {
    if (!currentVariant?._id || !isValidObjectId(currentVariant._id.toString())) return ''
    return currentVariant._id.toString()
  }, [currentVariant?._id])

  // Check if current active variant is in cart
  // Only show button for the currently displayed variant
  const cartItem = useMemo(() => {
    if (!currentVariant || !Array.isArray(cartItems) || !variantId) return null
    return cartItems.find(
      (item) => item.productId === productId && item.variantId === variantId
    )
  }, [cartItems, productId, variantId, currentVariant])

  const cartQuantity = cartItem?.quantity || 0
  // Only show cart controls if this specific active variant is in cart
  // Ensure we have a valid current variant before showing any cart UI
  const isInCart = Boolean(cartQuantity > 0 && currentVariant !== null && variantId)

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentVariant) {
      toast.error('Product variant not available')
      return
    }

    if (!currentInStock) {
      toast.error('Product is out of stock')
      return
    }
    
    // Validate that we have valid MongoDB ObjectIds
    if (!product._id || !isValidObjectId(product._id.toString())) {
      toast.error('Invalid product ID')
      return
    }
    
    if (!currentVariant._id || !isValidObjectId(currentVariant._id.toString())) {
      toast.error('Invalid variant ID')
      return
    }
    
    // Validate IDs are not empty
    if (!productId || !variantId) {
      toast.error('Unable to add to cart: Invalid product or variant ID')
      return
    }

    try {
      dispatch(clientCartActions.addToClientCart({
        productId,
        variantId,
        quantity: 1,
      }))
      toast.success('Added to cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart. Please try again.')
    }
  }, [currentVariant, currentInStock, productId, variantId, dispatch, product._id])

  const handleIncrementQuantity = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentVariant || !currentInStock) {
      if (!currentInStock) {
        toast.error('Product is out of stock')
      }
      return
    }

    // Check if quantity exceeds available stock (handle null quantity)
    const availableQuantity = currentVariant.quantity ?? 0
    const newQuantity = cartQuantity + 1
    
    if (currentVariant.quantity !== null && newQuantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} item(s) available in stock`)
      return
    }
    
    // Don't allow incrementing if quantity is null (invalid data)
    if (currentVariant.quantity === null) {
      toast.error('Product quantity unavailable')
      return
    }

    try {
      dispatch(clientCartActions.updateCartItemQuantity({
        id: variantId,
        quantity: newQuantity,
      }))
    } catch (error) {
      console.error('Error updating cart quantity:', error)
      toast.error('Failed to update quantity. Please try again.')
    }
  }, [currentVariant, currentInStock, cartQuantity, variantId, dispatch])

  const handleDecrementQuantity = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (cartQuantity <= 1) {
      // Remove from cart when quantity goes to 0
      try {
        dispatch(clientCartActions.removeFromClientCart(variantId))
      } catch (error) {
        console.error('Error removing from cart:', error)
        toast.error('Failed to remove item from cart. Please try again.')
      }
    } else {
      try {
        dispatch(clientCartActions.updateCartItemQuantity({
          id: variantId,
          quantity: cartQuantity - 1,
        }))
      } catch (error) {
        console.error('Error updating cart quantity:', error)
        toast.error('Failed to update quantity. Please try again.')
      }
    }
  }, [cartQuantity, variantId, dispatch])

  const handleVariantChange = useCallback((newIndex: number) => {
    // Validate index before changing
    if (newIndex < 0 || newIndex >= variants.length) {
      console.warn(`Invalid variant index: ${newIndex}. Valid range: 0-${variants.length - 1}`)
      return
    }
    onVariantChange(newIndex)
  }, [variants.length, onVariantChange])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
      layout
      onHoverStart={() => onHoverChange(true)}
      onHoverEnd={() => onHoverChange(false)}
      className="group relative bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col h-full">
        <div className="aspect-square w-full overflow-hidden bg-gray-100 relative flex-shrink-0">
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full w-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={safeVariantIndex}
                initial={{ opacity: 0, x: 30, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-full w-full"
              >
                <Image
                  src={currentImage}
                  alt={`${product.name || 'Product'} - Variant ${safeVariantIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={isPlaceholderImage(currentImage)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target && !target.src.includes('via.placeholder.com')) {
                      target.src = 'https://via.placeholder.com/400x400?text=Product'
                    }
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Variant navigation dots */}
          {hasVariants && variants.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
              {variants.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleVariantChange(idx)
                  }}
                  className={`rounded-full transition-all duration-200 ${
                    idx === safeVariantIndex 
                      ? 'bg-white w-6 h-1.5' 
                      : 'bg-white/50 hover:bg-white/75 w-1.5 h-1.5'
                  }`}
                  aria-label={`View variant ${idx + 1} of ${variants.length}`}
                  aria-pressed={idx === safeVariantIndex}
                />
              ))}
            </div>
          )}

          {/* Discount badge */}
          {currentDiscountPrice !== null &&
           currentPrice !== null &&
           currentDiscountPrice > currentPrice && (() => {
            const discount = calculateDiscount(currentDiscountPrice, currentPrice)
            return discount > 0 ? (
              <motion.div
                key={`badge-${safeVariantIndex}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10"
                aria-label={`${discount.toFixed(1)}% discount`}
              >
                -{discount.toFixed(1)}%
              </motion.div>
            ) : null
          })()}

          {/* Featured badge */}
          {product.isFeatured && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10"
            >
              Featured
            </motion.div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="flex items-center space-x-2 mb-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={safeVariantIndex}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg font-semibold text-gray-900"
                aria-label={`Price: ${hasValidPrice ? formatPrice(currentPrice) : 'Not available'}`}
              >
                {hasValidPrice ? formatPrice(currentPrice) : 'N/A'}
              </motion.span>
            </AnimatePresence>
            {currentDiscountPrice !== null &&
             currentPrice !== null &&
             currentDiscountPrice > currentPrice && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={`discount-${safeVariantIndex}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-500 line-through"
                  aria-label={`Original price: ${formatPrice(currentDiscountPrice)}`}
                >
                  {formatPrice(currentDiscountPrice)}
                </motion.span>
              </AnimatePresence>
            )}
          </div>

          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <AnimatePresence mode="wait">
              <motion.span
                key={`stock-${safeVariantIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  currentInStock 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}
                aria-label={currentInStock ? 'In stock' : 'Out of stock'}
              >
                {currentInStock ? 'In Stock' : 'Out of Stock'}
              </motion.span>
            </AnimatePresence>
            {hasVariants && currentSize && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={`size-${safeVariantIndex}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                  aria-label={`Size: ${currentSize}`}
                >
                  Size: {currentSize}
                </motion.span>
              </AnimatePresence>
            )}
            {hasVariants && currentColor && (
              <div
                className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: currentColor }}
                title={`Color: ${currentColor}`}
                aria-label={`Color: ${currentColor}`}
                role="img"
              />
            )}
          </div>

          <div className="mt-auto">
            {/* Only show cart button/controls when the active variant is valid */}
            {shouldShowCartButton && (
              <motion.div
                layout
                transition={{ 
                  layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                }}
                className="w-full"
              >
                {isInCart ? (
                  <motion.div
                    layout
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="w-full flex items-center justify-between bg-primary-600 text-white py-2.5 px-4 rounded-full mb-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleDecrementQuantity}
                      disabled={!currentInStock}
                      className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>
                    <span className="font-semibold text-sm min-w-[2rem] text-center">
                      {cartQuantity}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleIncrementQuantity}
                      disabled={
                        !currentInStock ||
                        !currentVariant ||
                        currentVariant.quantity === null ||
                        (currentVariant.quantity !== null && cartQuantity >= currentVariant.quantity)
                      }
                      className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    layout
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={!currentInStock}
                    className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-full hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-medium text-sm mb-2"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {currentInStock ? 'Add to Cart' : 'Out of Stock'}
                  </motion.button>
                )}
              </motion.div>
            )}
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
              disabled={isRemoving}
              className="w-full px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-red-200"
              title="Remove from wishlist"
            >
              {isRemoving ? (
                <SewingMachineLoader size="sm" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
