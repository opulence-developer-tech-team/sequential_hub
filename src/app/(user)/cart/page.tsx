'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react'
import { formatPrice, isPlaceholderImage, isValidHexColor } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { clientCartActions } from '@/store/redux/cart/client-cart'
import { cartActions } from '@/store/redux/cart/cart-slice'
import { useHttp } from '@/hooks/useHttp'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import ErrorState from '@/components/ui/ErrorState'


export default function CartPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { sendHttpRequest, isLoading, error: httpError } = useHttp()
  const cartItems = useAppSelector((state) => state.clientCart.clientCartItems) || []
  const cartData = useAppSelector((state) => state.cart.cartData)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const [hasFetchedCart, setHasFetchedCart] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Auth state is now managed in Redux and checked once at app level

  // Fetch cart data from API when cart items change
  useEffect(() => {
    if (cartItems.length === 0) {
      dispatch(cartActions.clearCartData())
      setHasFetchedCart(false)
      setIsInitialLoading(false)
      return
    }

    // Set initial loading state on first fetch
    if (!hasFetchedCart) {
      setIsInitialLoading(true)
    }

    sendHttpRequest({
      requestConfig: {
        method: 'POST',
        url: '/cart',
        body: cartItems,
      },
      successRes: (res) => {
        if (res.data?.data) {
          dispatch(cartActions.setCartData(res.data.data))
          setHasFetchedCart(true)
        }
        setIsInitialLoading(false)
      },
      errorRes: () => {
        setIsInitialLoading(false)
      },
    })
  }, [cartItems, sendHttpRequest, dispatch, hasFetchedCart])

  const handleCheckout = () => {
    // Both guest and authenticated users can proceed to checkout
    router.push('/checkout')
  }

  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(variantId)
      return
    }
    
    dispatch(
      clientCartActions.updateCartItemQuantity({
        id: variantId,
        quantity: newQuantity,
      })
    )
  }

  const removeItem = (variantId: string) => {
    dispatch(clientCartActions.removeFromClientCart(variantId))
  }

  // Retry handler for cart fetch
  const handleRetry = () => {
    if (cartItems.length === 0) {
      dispatch(cartActions.clearCartData())
      setHasFetchedCart(false)
      setIsInitialLoading(false)
      return
    }

    // Reset state and retry fetch
    setIsInitialLoading(true)
    setHasFetchedCart(false)

    sendHttpRequest({
      requestConfig: {
        method: 'POST',
        url: '/cart',
        body: cartItems,
      },
      successRes: (res) => {
        if (res.data?.data) {
          dispatch(cartActions.setCartData(res.data.data))
          setHasFetchedCart(true)
        }
        setIsInitialLoading(false)
      },
      errorRes: () => {
        setIsInitialLoading(false)
      },
    })
  }

  // Show loading state for initial fetch
  if (isInitialLoading && !cartData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <SewingMachineLoader size="lg" text="Loading cart, please wait..." />
      </div>
    )
  }

  // Show error state for initial fetch errors
  if (httpError && isInitialLoading && !hasFetchedCart) {
    return (
      <ErrorState
        title="Failed to load cart"
        message={httpError || "We couldn't load your cart. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  // Empty cart state
  if (cartItems.length === 0 || !cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <ShoppingBag className="mx-auto h-32 w-32 text-gray-300 mb-8" strokeWidth={1} />
            </motion.div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-4 tracking-tight">Your cart is empty</h1>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/products"
                className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-all"
              >
                Continue Shopping
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 mb-8 sm:mb-12 tracking-tight"
        >
          Shopping Cart
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
                  Cart Items ({cartData.itemCount})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-50">
                <AnimatePresence>
                  {cartData.items.map((item, index) => {
                    const itemAny = item as any
                    const legacyVariantImageUrl =
                      typeof itemAny?.variantImageUrl === 'string' ? itemAny.variantImageUrl : ''

                    const primaryImage =
                      Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
                        ? item.variantImageUrls[0]
                        : (legacyVariantImageUrl || 'https://via.placeholder.com/112x112?text=Product') // Backward compatibility

                    return (
                      <motion.div
                        key={`${item.productId}-${item.variantId}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 sm:p-6 lg:p-8 hover:bg-gray-50/50 transition-colors"
                      >
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <Link href={`/products/${item.productSlug}`}>
                            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-gray-100 mx-auto sm:mx-0">
                              <Image
                                src={primaryImage}
                                alt={item.productName}
                                fill
                                className="object-cover transition-transform hover:scale-105"
                                unoptimized={isPlaceholderImage(primaryImage)}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/112x112?text=Product'
                                }}
                              />
                            </div>
                          </Link>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="text-base sm:text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors block mb-2"
                          >
                            {item.productName}
                          </Link>
                          {item.productDescription && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                              {item.productDescription}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            <span className="font-medium">Size: <span className="font-normal">{item.variantSize}</span></span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Color:</span>
                              {isValidHexColor(item.variantColor) ? (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                  style={{ backgroundColor: item.variantColor }}
                                  title={item.variantColor}
                                  aria-label={`Color: ${item.variantColor}`}
                                />
                              ) : (
                                <span className="font-normal">{item.variantColor || 'N/A'}</span>
                              )}
                            </div>
                          </div>

                          {/* Stock Status */}
                          {!item.inStock && (
                            <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4 font-medium">Out of Stock</p>
                          )}
                          {item.inStock && item.quantity > item.availableQuantity && (
                            <p className="text-xs sm:text-sm text-amber-600 mb-3 sm:mb-4 font-medium">
                              Only {item.availableQuantity} available
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="flex items-center justify-center sm:justify-start gap-3">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  const cartItem = cartItems.find(
                                    (ci) => ci.variantId === item.variantId
                                  )
                                  if (cartItem) {
                                    updateQuantity(cartItem.variantId, item.quantity - 1)
                                  }
                                }}
                                disabled={!item.inStock || isLoading}
                                className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                <Minus className="h-4 w-4 text-gray-700" />
                              </motion.button>
                              <span className="px-4 py-2 border border-gray-300 rounded-xl min-w-[60px] text-center font-medium text-gray-900 bg-white">
                                {item.quantity}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  const cartItem = cartItems.find(
                                    (ci) => ci.variantId === item.variantId
                                  )
                                  if (cartItem) {
                                    const newQuantity = item.quantity + 1
                                    if (item.inStock && newQuantity <= item.availableQuantity) {
                                      updateQuantity(cartItem.variantId, newQuantity)
                                    }
                                  }
                                }}
                                disabled={
                                  !item.inStock || 
                                  isLoading || 
                                  item.quantity >= item.availableQuantity
                                }
                                className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              >
                                <Plus className="h-4 w-4 text-gray-700" />
                              </motion.button>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-left sm:text-right">
                                {item.variantDiscountPrice > 0 && 
                                 item.variantDiscountPrice < item.variantPrice ? (
                                  <>
                                    <span className="text-base sm:text-lg font-semibold text-gray-900 block">
                                      {formatPrice(item.itemTotal)}
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                      {formatPrice(item.itemSubtotal)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-base sm:text-lg font-semibold text-gray-900">
                                    {formatPrice(item.itemTotal)}
                                  </span>
                                )}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  const cartItem = cartItems.find(
                                    (ci) => ci.variantId === item.variantId
                                  )
                                  if (cartItem) {
                                    removeItem(cartItem.variantId)
                                  }
                                }}
                                disabled={isLoading}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-xl hover:bg-red-50 transition-all flex-shrink-0"
                              >
                                <Trash2 className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-8 overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Order Summary</h2>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex justify-between text-sm py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(cartData.subtotal)}</span>
                </div>
                
                
                <div className="flex justify-between text-sm py-2">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{formatPrice(cartData.tax)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(cartData.total)}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={isLoading || !cartData || cartData.items.length === 0}
                  className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl hover:bg-primary-700 transition-all font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.button>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/products"
                    className="w-full border border-gray-300 text-gray-900 py-4 px-6 rounded-xl hover:bg-gray-50 transition-all font-medium text-center block"
                  >
                    Continue Shopping
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
