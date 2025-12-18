'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Heart, Share2, MessageCircle, Facebook, Twitter, Mail, Link2, X } from 'lucide-react'
import { Product, IProductVariant } from '@/types'
import { ProductSize } from '@/types/enum'
import MeasurementRequestSection from '@/components/MeasurementRequestSection'
import { useHttp } from '@/hooks/useHttp'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import ProductBreadcrumb from '@/components/admin/product-details/ProductBreadcrumb'
import ProductImages from '@/components/admin/product-details/ProductImages'
import ProductInfo from '@/components/admin/product-details/ProductInfo'
import ProductSizeSelector from '@/components/admin/product-details/ProductSizeSelector'
import ProductColorSelector from '@/components/admin/product-details/ProductColorSelector'
import ProductQuantitySelector from '@/components/admin/product-details/ProductQuantitySelector'
import ProductFeatures from '@/components/admin/product-details/ProductFeatures'
import { getProductDisplayData } from '@/lib/product-display'
import {
  MEASUREMENT_FIELDS,
  MEASUREMENT_LABELS,
  type MeasurementField,
} from '@/components/admin/products/VariantMeasurementsEditor'
import ProductReviewsSection from '@/components/user/reviews/ProductReviewsSection'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { clientCartActions } from '@/store/redux/cart/client-cart'
import { addProductToWishlist, removeProductFromWishlist } from '@/store/redux/user/user-wishlist-slice'
import { toast } from 'sonner'

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


export default function ProductDetailClient() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { isLoading, sendHttpRequest, error } = useHttp()
  const { sendHttpRequest: sendWishlistRequest, isLoading: isWishlistLoading } = useHttp()
  const cartItems = useAppSelector((state) => state.clientCart.clientCartItems) || []
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const wishlistData = useAppSelector((state) => state.userWishlist.wishlist)
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<ProductSize | ''>('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [customMeasurements, setCustomMeasurements] = useState<any>({})
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  // Map API product to Product type matching the new structure
  const mapApiProductToProduct = useCallback((apiProduct: any): Product => {
    const variants = Array.isArray(apiProduct.productVariant) ? apiProduct.productVariant : []

    // Map variants to IProductVariant format, including measurements
    // Handle both new imageUrls array and old imageUrl field for backward compatibility
    const productVariants: IProductVariant[] = variants.map((v: any, index: number) => ({
      _id: v._id?.toString() || `variant-${index}`,
      imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length > 0
        ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0 ? [v.imageUrl] : []),
      color: v.color || '',
      // Use null for invalid/missing numeric values to indicate data issues
      quantity:
        v.quantity != null &&
        typeof v.quantity === 'number' &&
        !isNaN(v.quantity) &&
        v.quantity >= 0
          ? v.quantity
          : null,
      price:
        v.price != null &&
        typeof v.price === 'number' &&
        !isNaN(v.price) &&
        v.price >= 0
          ? v.price
          : null,
      discountPrice:
        v.discountPrice != null &&
        typeof v.discountPrice === 'number' &&
        !isNaN(v.discountPrice) &&
        v.discountPrice >= 0
          ? v.discountPrice
          : null,
      size: (v.size || '') as ProductSize,
      inStock: typeof v.inStock === 'boolean' ? v.inStock : false,
      measurements: v.measurements
        ? {
            neck: typeof v.measurements?.neck === 'number' ? v.measurements.neck : undefined,
            shoulder: typeof v.measurements?.shoulder === 'number' ? v.measurements.shoulder : undefined,
            chest: typeof v.measurements?.chest === 'number' ? v.measurements.chest : undefined,
            shortSleeve:
              typeof v.measurements?.shortSleeve === 'number' ? v.measurements.shortSleeve : undefined,
            longSleeve:
              typeof v.measurements?.longSleeve === 'number' ? v.measurements.longSleeve : undefined,
            roundSleeve:
              typeof v.measurements?.roundSleeve === 'number' ? v.measurements.roundSleeve : undefined,
            tummy: typeof v.measurements?.tummy === 'number' ? v.measurements.tummy : undefined,
            topLength:
              typeof v.measurements?.topLength === 'number' ? v.measurements.topLength : undefined,
            waist: typeof v.measurements?.waist === 'number' ? v.measurements.waist : undefined,
            laps: typeof v.measurements?.laps === 'number' ? v.measurements.laps : undefined,
            kneelLength:
              typeof v.measurements?.kneelLength === 'number' ? v.measurements.kneelLength : undefined,
            roundKneel:
              typeof v.measurements?.roundKneel === 'number' ? v.measurements.roundKneel : undefined,
            trouserLength:
              typeof v.measurements?.trouserLength === 'number'
                ? v.measurements.trouserLength
                : undefined,
            ankle: typeof v.measurements?.ankle === 'number' ? v.measurements.ankle : undefined,
          }
        : undefined,
    }))

    return {
      _id: apiProduct._id?.toString() || apiProduct.slug || '',
      adminId: apiProduct.adminId?.toString() || '',
      name: apiProduct.name || '',
      description: apiProduct.description || '',
      slug: apiProduct.slug || '',
      category: apiProduct.category || '',
      material: apiProduct.material || '',
      productVariant: productVariants,
      isFeatured: typeof apiProduct.isFeatured === 'boolean' ? apiProduct.isFeatured : false,
      createdAt: apiProduct.createdAt ? (typeof apiProduct.createdAt === 'string' ? new Date(apiProduct.createdAt) : apiProduct.createdAt) : undefined,
      updatedAt: apiProduct.updatedAt ? (typeof apiProduct.updatedAt === 'string' ? new Date(apiProduct.updatedAt) : apiProduct.updatedAt) : undefined,
    } as Product
  }, [])

  // Fetch product by slug
  const fetchProduct = useCallback(() => {
    const slug = params.slug as string
    if (!slug) return

    sendHttpRequest({
      successRes: (res: any) => {
        try {
          const apiProduct = res?.data?.data
          if (apiProduct && apiProduct.slug) {
            const mappedProduct = mapApiProductToProduct(apiProduct)
            setProduct(mappedProduct)
            
            // Set default selections from available variants
            const displayData = getProductDisplayData(mappedProduct)
            if (displayData.sizes.length > 0) {
              setSelectedSize(displayData.sizes[0] as ProductSize)
            }
            if (displayData.colors.length > 0) {
              setSelectedColor(displayData.colors[0])
            }
            if (displayData.images.length > 0) {
              setSelectedImage(0)
            }
          } else {
            setProduct(null)
          }
        } catch (error) {
          console.error('Error processing product response:', error)
          setProduct(null)
        }
      },
      requestConfig: {
        url: `/guest/get-product-details?slug=${encodeURIComponent(slug)}`,
        method: 'GET',
      },
    })
  }, [params.slug, sendHttpRequest, mapApiProductToProduct])

  useEffect(() => {
    if (params.slug) {
      fetchProduct()
    }
  }, [params.slug, fetchProduct])

  // Derive display data from product variants
  const displayData = useMemo(() => {
    if (!product) return null
    return getProductDisplayData(product)
  }, [product])

  // Get currently selected variant based on size and color (primary), then image
  const currentVariant = useMemo(() => {
    if (!product || !displayData) return null

    let variant: IProductVariant | null = null

    // 1) Primary: match by size + color (strongest signal)
    if (selectedSize && selectedColor) {
      variant =
        product.productVariant.find(
          (v) => v.size === selectedSize && v.color === selectedColor
        ) || null
    }

    // 2) Fallback: match by color only
    if (!variant && selectedColor) {
      variant =
        product.productVariant.find((v) => v.color === selectedColor) || null
    }

    // 3) Fallback: match by size only
    if (!variant && selectedSize) {
      variant =
        product.productVariant.find((v) => v.size === selectedSize) || null
    }

    // 4) Fallback: first variant
    if (!variant && product.productVariant.length > 0) {
      variant = product.productVariant[0]
    }

    return variant
  }, [product, displayData, selectedSize, selectedColor])

  // Get images from the current variant (only show images for selected color/size)
  const variantImages = useMemo(() => {
    if (!currentVariant) {
      // If no variant selected, show all images from all variants
      return displayData?.images || []
    }
    
    // Get images from the current variant's imageUrls array
    const variantImageUrls = Array.isArray(currentVariant.imageUrls) && currentVariant.imageUrls.length > 0
      ? currentVariant.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      : ((currentVariant as any).imageUrl && typeof (currentVariant as any).imageUrl === 'string' && (currentVariant as any).imageUrl.trim().length > 0 ? [(currentVariant as any).imageUrl] : []) // Backward compatibility
    
    return variantImageUrls.length > 0 ? variantImageUrls : (displayData?.images || [])
  }, [currentVariant, displayData])

  // Use MongoDB ObjectId strings directly for cart
  const productId = useMemo(() => {
    if (!product?._id || !isValidObjectId(product._id.toString())) return ''
    return product._id.toString()
  }, [product?._id])
  
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
  const isInWishlist = useMemo(() => {
    return wishlistData?.productIds?.includes(product?._id || '') || false
  }, [wishlistData, product?._id])

  // Sync local state with Redux state
  useEffect(() => {
    setIsLiked(isInWishlist)
  }, [isInWishlist])

  // Handle wishlist toggle - same logic as ProductCard
  const handleWishlistToggle = useCallback(async () => {
    // Check authentication before making request
    if (isAuthenticated === false) {
      // Store product ID for after login
      if (product?._id) {
        sessionStorage.setItem('pendingWishlistProductId', product._id)
      }
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

    // If no product, return
    if (!product?._id) {
      return
    }

    // Optimistically update UI
    const wasLiked = isLiked
    setIsLiked(!wasLiked)

    // Make API request to toggle wishlist
    sendWishlistRequest({
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
      errorRes: () => {
        // Revert optimistic update on error
        setIsLiked(wasLiked)
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
  }, [isAuthenticated, product?._id, pathname, router, sendWishlistRequest, isLiked, dispatch])

  // Check for pending wishlist action after login
  useEffect(() => {
    if (isAuthenticated === true && product?._id) {
      const pendingProductId = sessionStorage.getItem('pendingWishlistProductId')
      if (pendingProductId === product._id) {
        // User just logged in and had clicked wishlist for this product
        sessionStorage.removeItem('pendingWishlistProductId')
        // Automatically add to wishlist
        handleWishlistToggle()
      }
    }
  }, [isAuthenticated, product?._id, handleWishlistToggle])

  // Get product URL and share text
  const productUrl = useMemo(() => {
    if (typeof window === 'undefined' || !product) return ''
    return `${window.location.origin}/products/${product.slug}`
  }, [product])

  const shareText = useMemo(() => {
    if (!product) return ''
    return `Check out ${product.name}${product.description ? ` - ${product.description.substring(0, 100)}` : ''}`
  }, [product])

  // Handle share menu toggle
  const handleShareMenuToggle = useCallback(() => {
    setIsShareMenuOpen((prev) => !prev)
  }, [])

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false)
      }
    }

    if (isShareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isShareMenuOpen])

  // Share to WhatsApp
  const handleShareWhatsApp = useCallback(() => {
    if (!productUrl) return
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${productUrl}`)}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    setIsShareMenuOpen(false)
    toast.success('Opening WhatsApp...')
  }, [productUrl, shareText])

  // Share to Facebook
  const handleShareFacebook = useCallback(() => {
    if (!productUrl) return
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400,noopener,noreferrer')
    setIsShareMenuOpen(false)
    toast.success('Opening Facebook...')
  }, [productUrl])

  // Share to Twitter/X
  const handleShareTwitter = useCallback(() => {
    if (!productUrl) return
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400,noopener,noreferrer')
    setIsShareMenuOpen(false)
    toast.success('Opening Twitter...')
  }, [productUrl, shareText])

  // Share via Email
  const handleShareEmail = useCallback(() => {
    if (!productUrl) return
    const subject = encodeURIComponent(`Check out ${product?.name || 'this product'}`)
    const body = encodeURIComponent(`${shareText}\n\n${productUrl}`)
    const emailUrl = `mailto:?subject=${subject}&body=${body}`
    window.location.href = emailUrl
    setIsShareMenuOpen(false)
    toast.success('Opening email client...')
  }, [productUrl, shareText, product])

  // Copy to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!productUrl) return
    
    try {
      await navigator.clipboard.writeText(productUrl)
      setIsShareMenuOpen(false)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = productUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setIsShareMenuOpen(false)
        toast.success('Link copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy link. Please try again.')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }, [productUrl])

  // Native share (mobile devices)
  const handleNativeShare = useCallback(async () => {
    if (!product) return

    const shareData = {
      title: product.name,
      text: shareText,
      url: productUrl,
    }

    if (typeof window !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        setIsShareMenuOpen(false)
        toast.success('Product shared successfully')
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share. Please try again.')
        }
      }
    } else {
      // Fallback to copy link if native share not available
      handleCopyLink()
    }
  }, [product, shareText, productUrl, handleCopyLink])

  // Reset selected image index when variant changes (to ensure it's within bounds)
  useEffect(() => {
    if (variantImages.length > 0) {
      // Ensure selectedImage is within bounds of variantImages
      if (selectedImage >= variantImages.length) {
        setSelectedImage(0)
      }
    } else if (selectedImage > 0) {
      setSelectedImage(0)
    }
  }, [variantImages, selectedImage])

  // Handle color selection - update variant and reset image to first image of new variant
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    // Reset to first image will happen via useEffect when variantImages changes
    setSelectedImage(0)
    
    if (!product || !displayData) return
    
    // Find variant with this color (prefer current size if selected, otherwise any variant with this color)
    let matchingVariant = selectedSize
      ? product.productVariant.find((v) => v.color === color && v.size === selectedSize)
      : null
    
    // Fallback: if no variant found with both color and size, find any variant with this color
    if (!matchingVariant) {
      matchingVariant = product.productVariant.find((v) => v.color === color)
    }
    
    // Update size if variant has a different size
    if (matchingVariant && matchingVariant.size && matchingVariant.size !== selectedSize) {
      setSelectedSize(matchingVariant.size as ProductSize)
    }
  }

  // Handle size selection - update variant and reset image to first image of new variant
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size as ProductSize)
    // Reset to first image will happen via useEffect when variantImages changes
    setSelectedImage(0)
    
    if (!product || !displayData) return
    
    // Find variant with this size and current color (if color is selected)
    // Otherwise, find the first variant with this size
    let matchingVariant = selectedColor
      ? product.productVariant.find((v) => v.size === size && v.color === selectedColor)
      : null
    
    // Fallback: if no variant found with both size and color, find any variant with this size
    if (!matchingVariant) {
      matchingVariant = product.productVariant.find((v) => v.size === size)
    }
    
    // Update color if variant has a different color
    if (matchingVariant && matchingVariant.color && matchingVariant.color !== selectedColor) {
      setSelectedColor(matchingVariant.color)
    }
  }

  const handleAddToCart = () => {
    if (!product || !currentVariant) {
      toast.error('Please select a product variant (size and color)')
      return
    }
    
    // Validate that we have valid MongoDB ObjectIds
    if (!product._id || !isValidObjectId(product._id.toString())) {
      toast.error('Invalid product ID. Please refresh the page.')
      return
    }
    
    if (!currentVariant._id || !isValidObjectId(currentVariant._id.toString())) {
      toast.error('Invalid variant ID. Please select a different variant.')
      return
    }
    
    // Validate IDs are not empty
    if (!productId || !variantId) {
      toast.error('Unable to add to cart: Invalid product or variant ID. Please refresh the page.')
      return
    }
    
    // Don't allow adding to cart if quantity is null (invalid data)
    if (currentVariant.quantity === null) {
      toast.error('Product quantity information is unavailable. Please contact support.')
      return
    }
    
    // Check if total quantity (current cart + new quantity) exceeds available quantity
    const availableQuantity = currentVariant.quantity ?? 0
    const totalQuantity = cartQuantity + quantity
    if (totalQuantity > availableQuantity) {
      toast.warning(`Only ${availableQuantity} item(s) available in stock. You already have ${cartQuantity} in your cart.`)
      return
    }
    
    // Dispatch Redux action to add to cart (will increment if already in cart)
    dispatch(clientCartActions.addToClientCart({
      productId,
      variantId,
      quantity,
    }))
    
    toast.success('Added to cart')
  }
  
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    // Update cart with new quantity
    if (isInCart && product && currentVariant) {
      // Check if new quantity exceeds available stock
      const availableQuantity = currentVariant.quantity ?? 0
      if (currentVariant.quantity !== null && newQuantity > availableQuantity) {
        toast.warning(`Only ${availableQuantity} item(s) available in stock.`)
        setQuantity(availableQuantity)
        return
      }
      
      // Don't allow updating if quantity is null (invalid data)
      if (currentVariant.quantity === null) {
        return
      }

      dispatch(clientCartActions.updateCartItemQuantity({
        id: variantId,
        quantity: newQuantity,
      }))
    }
  }
  
  const handleRemoveFromCart = () => {
    setQuantity(1)
    if (product && currentVariant) {
      dispatch(clientCartActions.removeFromClientCart(variantId))
    }
  }
  
  // Reset quantity when variant changes to ensure it doesn't exceed available quantity
  useEffect(() => {
    if (currentVariant && currentVariant.quantity !== null && quantity > currentVariant.quantity) {
      setQuantity(Math.min(quantity, currentVariant.quantity))
    }
  }, [currentVariant, quantity])
  
  // Reset quantity when variant changes (size or color)
  useEffect(() => {
    setQuantity(1)
  }, [selectedSize, selectedColor])

  // Sync local quantity with cart quantity when variant changes
  useEffect(() => {
    if (cartItem && cartItem.quantity) {
      setQuantity(cartItem.quantity)
    } else {
      setQuantity(1)
    }
  }, [cartItem])

  const handleMeasurementsSubmit = (measurements: any) => {
    setCustomMeasurements(measurements)
  }

  // Loading state
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading product..." />
  }

  // Error state
  if (error && !product) {
    const handleRetry = () => {
      fetchProduct()
    }

    return (
      <ErrorState
        title="Failed to load product"
        message={error || "We couldn't load the product. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  // Product not found
  if (!product || !displayData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/products" className="text-primary-600 hover:text-primary-700">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  // Create a product-like object for ProductInfo component (which expects old structure)
  // Use current variant if available, otherwise use display data from all variants
  // Handle null prices properly - use 0 as fallback for ProductInfo component compatibility
  const productForInfo = {
    ...product,
    price: currentVariant?.price ?? displayData.price ?? 0,
    originalPrice: 
      currentVariant &&
      currentVariant.discountPrice !== null &&
      currentVariant.price !== null &&
      currentVariant.discountPrice > currentVariant.price
        ? currentVariant.discountPrice
        : displayData.discountPrice ?? undefined,
    inStock: currentVariant?.inStock ?? displayData.inStock,
  } as Product & { price: number | null; originalPrice?: number | null; inStock: boolean; images?: string[]; sizes?: string[]; colors?: string[] }

  // Get available sizes and colors for current selection
  // Show ALL colors from all variants (not filtered by size)
  const availableSizes = displayData.sizes
  const availableColors = displayData.colors // Show all colors from all variants

  return (
    <div className="min-h-screen bg-gray-50 bg-watermark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductBreadcrumb productName={product.name} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImages
            images={variantImages}
            productName={product.name}
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
          />

          <div className="space-y-6">
            <ProductInfo product={productForInfo as any} />
            <ProductSizeSelector
              sizes={availableSizes.map(s => s.toString())}
              selectedSize={selectedSize.toString()}
              onSizeSelect={handleSizeSelect}
            />
            <ProductColorSelector
              colors={availableColors}
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
            />
            <div className="space-y-4">
              {isInCart ? (
                <ProductQuantitySelector
                  quantity={cartQuantity}
                  onQuantityChange={handleQuantityChange}
                  maxQuantity={currentVariant?.quantity ?? 0}
                  onRemove={handleRemoveFromCart}
                />
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={
                    !currentVariant?.inStock ||
                    !selectedSize ||
                    !selectedColor ||
                    currentVariant?.quantity === null ||
                    (currentVariant && currentVariant.quantity !== null && quantity > currentVariant.quantity)
                  }
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add to Cart
                </button>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  className={`flex-1 py-2 px-4 border rounded-md transition-colors ${
                    isLiked
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`h-4 w-4 mx-auto ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <div className="flex-1 relative" ref={shareMenuRef}>
                  <button
                    onClick={handleShareMenuToggle}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:border-gray-400 transition-colors"
                    aria-label="Share product"
                    aria-expanded={isShareMenuOpen}
                  >
                    <Share2 className="h-4 w-4 mx-auto" />
                  </button>
                  
                  {/* Share Dropdown Menu */}
                  {isShareMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        {/* Native Share (Mobile) */}
                        {typeof window !== 'undefined' && 'share' in navigator && (
                          <button
                            onClick={handleNativeShare}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          >
                            <Share2 className="h-5 w-5 text-gray-700" />
                            <span className="text-sm font-medium text-gray-900">Share</span>
                          </button>
                        )}
                        
                        {/* WhatsApp */}
                        <button
                          onClick={handleShareWhatsApp}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors text-left"
                        >
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                        </button>
                        
                        {/* Facebook */}
                        <button
                          onClick={handleShareFacebook}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-left"
                        >
                          <Facebook className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Facebook</span>
                        </button>
                        
                        {/* Twitter/X */}
                        <button
                          onClick={handleShareTwitter}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sky-50 transition-colors text-left"
                        >
                          <Twitter className="h-5 w-5 text-sky-500" />
                          <span className="text-sm font-medium text-gray-900">Twitter/X</span>
                        </button>
                        
                        {/* Email */}
                        <button
                          onClick={handleShareEmail}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                          <Mail className="h-5 w-5 text-gray-700" />
                          <span className="text-sm font-medium text-gray-900">Email</span>
                        </button>
                        
                        {/* Copy Link */}
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left border-t border-gray-100 mt-1"
                        >
                          <Link2 className="h-5 w-5 text-gray-700" />
                          <span className="text-sm font-medium text-gray-900">Copy Link</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ProductFeatures />
            {/* Variant measurements for the currently selected size & color */}
            {currentVariant && currentVariant.measurements && (
              <section className="mt-8 relative">
                {/* Tailor themed border + background aligned with app primary colors */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-50/80 via-white/80 to-primary-100/80 blur-sm" />
                <div className="relative rounded-2xl border border-dashed border-primary-200 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.18)] overflow-hidden">
                  {/* Top ribbon */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-xs uppercase tracking-[0.16em] text-primary-50">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-800 shadow-sm">
                        ✂
                      </span>
                      <span className="font-semibold">Tailor&apos;s Fit Sheet</span>
                    </div>
                    <span className="hidden sm:inline text-[10px] text-primary-100/80">
                      Crafted for a perfect, custom fit
                    </span>
                  </div>

                  <div className="px-4 pt-4 pb-4 sm:px-5 sm:pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-[12px] text-primary-700 border border-primary-200">
                            📏
                          </span>
                          <span>
                            Sewing Measurements
                            <span className="ml-1 text-[11px] font-normal text-slate-500">
                              (inches)
                            </span>
                          </span>
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-500 max-w-md">
                          These are the measurements of this clothing item for the selected{' '}
                          <span className="font-medium text-slate-700">size &amp; color</span>. Use
                          them to compare with your own body or existing outfits.
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 border border-primary-200 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                          <span>Tailor measurements applied for this item</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          At least 5 key measurements are usually enough for a good fit.
                        </span>
                      </div>
                    </div>

                    <div className="relative mt-2">
                      {/* subtle top stitching line */}
                      <div className="pointer-events-none absolute -top-2 left-0 right-0 flex justify-between px-4 text-[9px] font-mono text-slate-300">
                        <span>0&quot;</span>
                        <span>10&quot;</span>
                        <span>20&quot;</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                        {MEASUREMENT_FIELDS.map((key) => {
                          const value = currentVariant.measurements?.[key as MeasurementField]
                          if (typeof value !== 'number' || Number.isNaN(value)) return null

                          return (
                            <div
                              key={key}
                              className="group relative rounded-xl bg-slate-50/90 px-3.5 py-2.5 border border-slate-200/80 shadow-sm hover:border-primary-300 hover:bg-primary-50/70 transition-colors"
                            >
                              <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-primary-400 via-primary-300 to-primary-500 rounded-l-xl opacity-70" />
                              <div className="flex items-baseline justify-between gap-4 pl-1.5">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold text-slate-800 tracking-wide">
                                    {MEASUREMENT_LABELS[key]}
                                  </span>
                                  <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                    Tailor point
                                  </span>
                                </div>
                                <div className="flex items-end gap-1">
                                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                    {value}
                                  </span>
                                  <span className="text-[10px] text-slate-500 mb-[1px]">in</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Custom Measurements */}
      <MeasurementRequestSection 
        containerClassName="mt-16"
      />

      {/* Product Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductReviewsSection productId={product._id} productName={product.name} />
      </div>
    </div>
  )
}

