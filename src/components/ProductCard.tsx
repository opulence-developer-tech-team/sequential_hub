'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, ShoppingCart, Minus, Plus } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice, calculateDiscount, isPlaceholderImage, getCategoryLabel } from '@/lib/utils'
import { getProductDisplayData } from '@/lib/product-display'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { clientCartActions } from '@/store/redux/cart/client-cart'
import { addProductToWishlist, removeProductFromWishlist } from '@/store/redux/user/user-wishlist-slice'
import { useHttp } from '@/hooks/useHttp'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
  index?: number
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

export default function ProductCard({ product, viewMode = 'grid', index = 0 }: ProductCardProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const cartItems = useAppSelector((state) => state.clientCart.clientCartItems) || []
  const { sendHttpRequest, isLoading: isWishlistLoading } = useHttp()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  
  const [isLiked, setIsLiked] = useState(false)
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Get variants from product
  const variants = Array.isArray(product.productVariant) && product.productVariant.length > 0
    ? product.productVariant
    : []

  // Fallback display data if no variants
  const display = getProductDisplayData(product)
  const fallbackImages = display.images.length > 0 ? display.images : ['https://via.placeholder.com/400x400?text=Product']
  
  // Use variants if available, otherwise use fallback
  const hasVariants = variants.length > 0
  const currentVariant = hasVariants ? variants[currentVariantIndex] : null
  // Handle both new imageUrls array and old imageUrl field for backward compatibility
  const currentImage = currentVariant 
    ? (Array.isArray(currentVariant.imageUrls) && currentVariant.imageUrls.length > 0
        ? currentVariant.imageUrls[0] // Use first image from array
        : ((currentVariant as any).imageUrl || fallbackImages[0])) // Backward compatibility with type assertion
    : fallbackImages[0]
  const currentPrice = currentVariant?.price ?? display.price
  const currentDiscountPrice = currentVariant?.discountPrice ?? display.discountPrice
  const currentInStock = Boolean(currentVariant?.inStock ?? display.inStock)
  const currentColor = currentVariant?.color
  const currentSize = currentVariant?.size || ''

  // Use MongoDB ObjectId strings directly for cart
  const productId = useMemo(() => {
    if (!product._id || !isValidObjectId(product._id.toString())) return ''
    return product._id.toString()
  }, [product._id])
  
  const variantId = useMemo(() => {
    if (!currentVariant?._id || !isValidObjectId(currentVariant._id.toString())) return ''
    return currentVariant._id.toString()
  }, [currentVariant?._id])

  // Check if current variant is in cart
  const cartItem = useMemo(() => {
    if (!currentVariant || !Array.isArray(cartItems)) return null
    return cartItems.find(
      (item) => item.productId === productId && item.variantId === variantId
    )
  }, [cartItems, productId, variantId, currentVariant])

  const cartQuantity = cartItem?.quantity || 0
  const isInCart = cartQuantity > 0

  // Check if product is in wishlist from Redux state
  const wishlistData = useAppSelector((state) => state.userWishlist.wishlist)
  const isInWishlist = useMemo(() => {
    return wishlistData?.productIds?.includes(product._id) || false
  }, [wishlistData, product._id])

  // Sync local state with Redux state
  useEffect(() => {
    setIsLiked(isInWishlist)
  }, [isInWishlist])

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(async () => {
    // Check authentication before making request
    if (isAuthenticated === false) {
      // Store product ID for after login
      sessionStorage.setItem('pendingWishlistProductId', product._id)
      // Store current pathname for redirect after login
      if (pathname) {
        sessionStorage.setItem('redirectAfterLogin', pathname)
      }
      // Navigate to login
      router.push('/sign-in')
      return
    }

    // If authentication status is still being checked, wait
    if (isAuthenticated === null) {
      return
    }

    // Optimistically update UI
    const wasLiked = isLiked
    setIsLiked(!wasLiked)

    // Make API request to toggle wishlist
    sendHttpRequest({
      successRes: (res) => {
        if (res.data?.data) {
          const operation = res.data.data.operation
          const wishlistItem = res.data.data.wishlistItem
          const newLikedState = operation === 'added'
          
          // Update Redux state based on operation
          if (operation === 'added') {
            // Map the added product from server response to WishlistProduct format
            const addedProduct = wishlistItem?.addedProduct
            const wishlistProduct = addedProduct
              ? {
                  _id: addedProduct._id,
                  name: addedProduct.name || '',
                  slug: addedProduct.slug || '',
                  description: addedProduct.description || '',
                  category: addedProduct.category || '',
                  productVariant: (addedProduct.productVariant || []).map((v: any) => ({
                    _id: v._id || '',
                    imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                      ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
                      : (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0 ? [v.imageUrl] : []), // Backward compatibility
                    color: v.color || '',
                    size: v.size || '',
                    quantity: v.quantity ?? null,
                    price: v.price ?? null,
                    discountPrice: v.discountPrice ?? null,
                    inStock: typeof v.inStock === 'boolean' ? v.inStock : false,
                  })),
                  isFeatured: addedProduct.isFeatured || false,
                  createdAt: addedProduct.createdAt,
                  updatedAt: addedProduct.updatedAt,
                }
              : undefined
            
            dispatch(
              addProductToWishlist({
                productId: product._id,
                product: wishlistProduct,
              })
            )
          } else {
            dispatch(removeProductFromWishlist(product._id))
          }
          
          setIsLiked(newLikedState)
        }
      },
      requestConfig: {
        url: '/user/wishlist',
        method: 'POST',
        body: {
          productId: product._id,
        },
        successMessage: wasLiked 
          ? 'Removed from wishlist' 
          : 'Added to wishlist',
      },
    })
  }, [isAuthenticated, product._id, pathname, router, sendHttpRequest, isLiked, dispatch])

  // Auth state is now managed in Redux and checked once at app level

  // Check for pending wishlist action after login
  useEffect(() => {
    if (isAuthenticated === true) {
      const pendingProductId = sessionStorage.getItem('pendingWishlistProductId')
      if (pendingProductId === product._id) {
        // User just logged in and had clicked wishlist for this product
        sessionStorage.removeItem('pendingWishlistProductId')
        // Automatically add to wishlist
        handleWishlistToggle()
      }
    }
  }, [isAuthenticated, product._id, handleWishlistToggle])

  // Auto-cycle through variants continuously (only if multiple variants)
  // Pause cycling when hovered for better UX
  useEffect(() => {
    if (!hasVariants || variants.length <= 1) return

    // Don't auto-cycle when hovered - let user see the variant they're looking at
    if (isHovered) return

    const interval = setInterval(() => {
      setCurrentVariantIndex((prev) => (prev + 1) % variants.length)
    }, 3000) // Change variant every 3 seconds

    return () => clearInterval(interval)
  }, [isHovered, hasVariants, variants.length])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentVariant || !currentInStock) {
      toast.error('Product variant not available or out of stock')
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

    dispatch(clientCartActions.addToClientCart({
      productId,
      variantId,
      quantity: 1,
    }))
    
    toast.success('Added to cart')
  }

  const handleIncrementQuantity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!currentVariant || !currentInStock) return

    // Check if quantity exceeds available stock (handle null quantity)
    const availableQuantity = currentVariant.quantity ?? 0
    const newQuantity = cartQuantity + 1
    if (currentVariant.quantity !== null && newQuantity > availableQuantity) {
      return // Don't allow exceeding available stock
    }
    
    // Don't allow incrementing if quantity is null (invalid data)
    if (currentVariant.quantity === null) {
      return
    }

    dispatch(clientCartActions.updateCartItemQuantity({
      id: variantId,
      quantity: newQuantity,
    }))
  }

  const handleDecrementQuantity = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (cartQuantity <= 1) {
      // Remove from cart when quantity goes to 0
      dispatch(clientCartActions.removeFromClientCart(variantId))
    } else {
      dispatch(clientCartActions.updateCartItemQuantity({
        id: variantId,
        quantity: cartQuantity - 1,
      }))
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleWishlistToggle()
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative bg-white rounded-2xl border border-apple-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <Link href={`/products/${product.slug}`}>
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="w-full sm:w-48 h-48 sm:h-48 flex-shrink-0 overflow-hidden bg-apple-gray-50 relative aspect-square sm:aspect-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentVariantIndex}
                  initial={{ opacity: 0, x: 30, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={currentImage}
                    alt={`${product.name} - ${product.category} - Variant ${currentVariantIndex + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized={isPlaceholderImage(currentImage)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (!target.src.includes('via.placeholder.com')) {
                        target.src = 'https://via.placeholder.com/400x400?text=Product'
                      }
                    }}
                  />
                </motion.div>
              </AnimatePresence>
              
              {/* Color indicator */}
              {hasVariants && variants.length > 1 && (
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {variants.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCurrentVariantIndex(idx)
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        idx === currentVariantIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`View variant ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {currentDiscountPrice !== null &&
               currentPrice !== null &&
               currentDiscountPrice > currentPrice && (() => {
                const discount = calculateDiscount(currentDiscountPrice, currentPrice)
                return discount > 0 ? (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary-600 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full z-10">
                    -{discount.toFixed(1)}%
                  </div>
                ) : null
              })()}

                {product.isFeatured && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-apple-gray-900 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full z-10">
                    Featured
                  </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col min-w-0">
              <div className="mb-2 sm:mb-3 flex flex-wrap items-center gap-1 sm:gap-0">
                <span className="text-xs text-apple-gray-500 uppercase tracking-wider font-medium">
                  {getCategoryLabel(product.category)}
                </span>
                <span className="text-xs text-apple-gray-400 font-normal hidden sm:inline ml-2">
                  • {product.material || 'N/A'}
                </span>
                <span className="text-xs text-apple-gray-400 font-normal sm:hidden">
                  {product.material ? ` • ${product.material}` : ''}
                </span>
              </div>

              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-apple-gray-900 mb-2 line-clamp-2">
                {product.name}
              </h3>

              <p className="text-apple-gray-600 mb-3 line-clamp-2 text-sm leading-relaxed overflow-hidden hidden sm:block">
                {product.description}
              </p>

              <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentVariantIndex}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl sm:text-2xl font-semibold text-apple-gray-900"
                  >
                    {currentPrice !== null ? formatPrice(currentPrice) : 'N/A'}
                  </motion.span>
                </AnimatePresence>
                {currentDiscountPrice !== null &&
                 currentPrice !== null &&
                 currentDiscountPrice > currentPrice && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`discount-${currentVariantIndex}`}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm sm:text-base text-apple-gray-400 line-through"
                    >
                      {formatPrice(currentDiscountPrice)}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>

              <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`stock-${currentVariantIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className={`text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
                      currentInStock 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {currentInStock ? 'In Stock' : 'Out of Stock'}
                  </motion.span>
                </AnimatePresence>
                {hasVariants && currentSize && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`size-${currentVariantIndex}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 text-gray-700"
                    >
                      Size: {currentSize}
                    </motion.span>
                  </AnimatePresence>
                )}
                {hasVariants && currentColor && (
                  <div
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: currentColor }}
                    title={`Color: ${currentColor}`}
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-auto">
                <AnimatePresence mode="popLayout" initial={false}>
                  {isInCart ? (
                    <motion.div
                      key={`quantity-${variantId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -8 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.16, 1, 0.3, 1],
                        layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                      }}
                      className="flex-1 flex items-center justify-between bg-primary-600 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-full min-w-0"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleDecrementQuantity}
                        disabled={!currentInStock}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </motion.button>
                      <motion.span 
                        key={cartQuantity}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="font-semibold text-xs sm:text-sm min-w-[1.5rem] sm:min-w-[2rem] text-center"
                      >
                        {cartQuantity}
                      </motion.span>
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
                        className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key={`add-to-cart-${variantId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -8 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.16, 1, 0.3, 1],
                        layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      disabled={!currentInStock}
                      className="flex-1 bg-primary-600 text-white py-2.5 sm:py-2.5 px-4 sm:px-6 rounded-full hover:bg-primary-700 disabled:bg-apple-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-medium text-xs sm:text-sm min-w-0"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Add to Cart</span>
                    </motion.button>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  disabled={isWishlistLoading}
                  className={`p-2.5 sm:p-2.5 rounded-full border-2 transition-all duration-200 flex-shrink-0 ${
                    isLiked 
                      ? 'bg-red-500 text-white border-red-500' 
                      : 'bg-white text-apple-gray-600 border-apple-gray-300 hover:border-red-500 hover:text-red-500'
                  } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`h-4 w-4 sm:h-4 sm:w-4 ${isLiked ? 'fill-current' : ''}`} />
                </motion.button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1] // Custom cubic-bezier for smooth easing
      }}
      layout
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl border border-apple-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
      onTouchStart={() => setIsHovered(true)}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col h-full">
        <div className="aspect-square w-full overflow-hidden bg-apple-gray-50 relative flex-shrink-0">
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full w-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVariantIndex}
                initial={{ opacity: 0, x: 30, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-full w-full"
              >
                <Image
                  src={currentImage}
                  alt={`${product.name} - ${product.category} - Variant ${currentVariantIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  unoptimized={isPlaceholderImage(currentImage)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (!target.src.includes('via.placeholder.com')) {
                      target.src = 'https://via.placeholder.com/400x400?text=Product'
                    }
                  }}
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Variant navigation dots */}
            {hasVariants && variants.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                {variants.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCurrentVariantIndex(idx)
                    }}
                    className={`rounded-full transition-all duration-200 ${
                      idx === currentVariantIndex 
                        ? 'bg-white w-6 h-1.5' 
                        : 'bg-white/50 hover:bg-white/75 w-1.5 h-1.5'
                    }`}
                    aria-label={`View variant ${idx + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Fallback: Image navigation dots if no variants but multiple images */}
            {!hasVariants && fallbackImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                {fallbackImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCurrentVariantIndex(idx)
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentVariantIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Badges */}
            {currentDiscountPrice !== null &&
             currentPrice !== null &&
             currentDiscountPrice > currentPrice && (() => {
              const discount = calculateDiscount(currentDiscountPrice, currentPrice)
              return discount > 0 ? (
                <motion.div
                  key={`badge-${currentVariantIndex}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10"
                >
                  -{discount.toFixed(1)}%
                </motion.div>
              ) : null
            })()}

            {product.isFeatured && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 bg-apple-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10"
              >
                Featured
              </motion.div>
            )}

            {/* Action buttons - always visible on mobile, hover on desktop */}
            <div
              className={`absolute right-3 flex flex-col space-y-2 z-20 ${
                product.isFeatured ? 'top-14 sm:top-14' : 'top-3'
              }`}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={isWishlistLoading}
                aria-label={isLiked ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
                className={`p-2 sm:p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 text-apple-gray-600 hover:text-red-500'
                } opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLiked ? 'fill-current' : ''}`} aria-hidden="true" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="mb-2">
            <span className="text-xs text-apple-gray-500 uppercase tracking-wider font-medium">
              {getCategoryLabel(product.category)}
            </span>
            <span className="ml-2 text-xs text-apple-gray-400 font-normal">
              • {product.material || 'N/A'}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-apple-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          <p className="text-sm text-apple-gray-600 mb-3 line-clamp-2 leading-relaxed overflow-hidden">
            {product.description}
          </p>

          <div className="flex items-center space-x-2 mb-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentVariantIndex}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl font-semibold text-apple-gray-900"
              >
                {currentPrice !== null ? formatPrice(currentPrice) : 'N/A'}
              </motion.span>
            </AnimatePresence>
            {currentDiscountPrice !== null &&
             currentPrice !== null &&
             currentDiscountPrice > currentPrice && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={`discount-${currentVariantIndex}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-apple-gray-400 line-through"
                >
                  {formatPrice(currentDiscountPrice)}
                </motion.span>
              </AnimatePresence>
            )}
          </div>

          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <AnimatePresence mode="wait">
              <motion.span
                key={`stock-${currentVariantIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  currentInStock 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {currentInStock ? 'In Stock' : 'Out of Stock'}
              </motion.span>
            </AnimatePresence>
            {hasVariants && currentSize && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={`size-${currentVariantIndex}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
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
              />
            )}
          </div>

          <div className="mt-auto">
            <AnimatePresence mode="popLayout" initial={false}>
            {isInCart ? (
              <motion.div
                key={`quantity-${variantId}`}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                }}
                className="w-full flex items-center justify-between bg-primary-600 text-white py-2.5 px-4 rounded-full"
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
                <motion.span 
                  key={cartQuantity}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-semibold text-sm min-w-[2rem] text-center"
                >
                  {cartQuantity}
                </motion.span>
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
                key={`add-to-cart-${variantId}`}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={!currentInStock}
                aria-label={`Add ${product.name} to cart`}
                aria-disabled={!currentInStock}
                className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-full hover:bg-primary-700 disabled:bg-apple-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-medium text-sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                {currentInStock ? 'Add to Cart' : 'Out of Stock'}
              </motion.button>
            )}
          </AnimatePresence>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
