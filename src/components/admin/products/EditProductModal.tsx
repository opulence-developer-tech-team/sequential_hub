'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Save, Upload, Trash2, ImageIcon, Lock, Unlock } from 'lucide-react'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import { productSizes, clothingCategories } from '@/lib/resources'
import { useHttp } from '@/hooks/useHttp'
import { toast } from 'sonner'
import { getCategoryLabel } from '@/lib/utils'
import { ClothingCategory, ProductSize } from '@/types/enum'
import { useDispatch } from 'react-redux'
import { adminActions } from '@/store/redux/adminSlice'
import type { Product as ReduxProduct } from '@/store/redux/adminSlice'
import VariantMeasurementsEditor, {
  MEASUREMENT_FIELDS,
  MEASUREMENT_LABELS,
} from './VariantMeasurementsEditor'

interface ProductFormData {
  name: string
  description: string
  price: string
  originalPrice?: string
  category: string
  material: string
  productOwner: string
  sizes: string[]
  colors: string[]
  quantity: number
  inStock: boolean
  featured: boolean
  rating: number
  reviewCount: number
  images: string[]
  slug?: string
  createdAt?: string
  adminId?: string
  productId?: string // MongoDB ObjectId as string
  productVariant?: any[] // Actual variants from the product
}

interface UploadedImageData {
  url: string
  color: string
  preview?: string
}

/**
 * Product variant data structure matching IProductVariant interface
 * Each variant represents a unique combination of image, color, and size
 * with its own pricing, quantity, and stock status
 */
interface ProductVariantData {
  _id?: string // Optional for existing variants
  imageUrls: string[] // Array of image URLs for the variant (multiple angles, details, etc.)
  color: string
  size: ProductSize | '' // Empty string for unselected state, ProductSize when selected
  quantity: number | null // null indicates invalid/missing data
  price: number | null // null indicates invalid/missing data
  discountPrice: number | null // null indicates invalid/missing data
  inStock: boolean
  measurements: {
    neck?: number
    shoulder?: number
    chest?: number
    shortSleeve?: number
    longSleeve?: number
    roundSleeve?: number
    tummy?: number
    topLength?: number
    waist?: number
    laps?: number
    kneelLength?: number
    roundKneel?: number
    trouserLength?: number
    quarterLength?: number
    ankle?: number
  }
}

// MEASUREMENT_FIELDS and MEASUREMENT_LABELS are imported from VariantMeasurementsEditor

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  product: ProductFormData
  onInputChange: (field: string, value: any) => void
}

export default function EditProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  onInputChange,
}: EditProductModalProps) {
  const dispatch = useDispatch()
  const { sendHttpRequest, isLoading: isUploading } = useHttp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImageData[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [productVariants, setProductVariants] = useState<ProductVariantData[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null)
  const [productOwnerLocked, setProductOwnerLocked] = useState(true)
  // Ref to track the latest variants state to avoid closure issues
  const productVariantsRef = useRef<ProductVariantData[]>([])
  const [openMeasurementsIndex, setOpenMeasurementsIndex] = useState<number | null>(null)

  // Helper function to safely convert variant _id to string
  // Handles both string IDs and ObjectId objects from MongoDB/Mongoose
  const getVariantIdString = (variantId: string | undefined | any): string => {
    if (!variantId) return ''
    if (typeof variantId === 'string') return variantId
    // Handle ObjectId or other objects with toString method
    if (variantId && typeof variantId === 'object' && typeof variantId.toString === 'function') {
      return variantId.toString()
    }
    return String(variantId) || ''
  }

  // Initialize variants and images from product when modal opens (only once)
  useEffect(() => {
    if (isOpen && product.productId && !hasInitialized) {
      // If we have actual variants from the product, use them
      if (product.productVariant && Array.isArray(product.productVariant) && product.productVariant.length > 0) {
        // Extract unique images from all variants (flatten imageUrls arrays)
        const imageMap = new Map<string, string>() // imageUrl -> color (from first variant that uses it)
        product.productVariant.forEach((variant: any) => {
          // Handle both new imageUrls array and old imageUrl field for backward compatibility
          const variantImageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
            ? variant.imageUrls
            : (variant.imageUrl ? [variant.imageUrl] : [])
          
          variantImageUrls.forEach((url: string) => {
            if (url && typeof url === 'string' && url.trim().length > 0 && !imageMap.has(url)) {
              imageMap.set(url, variant.color || '#000000')
            }
          })
        })
        
        // Set uploaded images
        const imagesWithColors: UploadedImageData[] = Array.from(imageMap.entries()).map(([url, color]) => ({
          url,
          color,
        }))
        setUploadedImages(imagesWithColors)
        
        // Initialize variants from actual product variants
        const initialVariants: ProductVariantData[] = product.productVariant.map((variant: any) => {
          // Extract _id - use the helper function to ensure consistent extraction
          // Only store _id if it's a valid ObjectId format (24 hex characters)
          // This prevents storing invalid IDs like "variant-4"
          let variantId: string | undefined = undefined
          if (variant._id) {
            const extractedId = getVariantIdString(variant._id)
            // Only store if it's a valid ObjectId format
            if (extractedId && /^[0-9a-fA-F]{24}$/.test(extractedId)) {
              variantId = extractedId
            }
          }
          
          // Handle both new imageUrls array and old imageUrl field for backward compatibility
          const imageUrls = Array.isArray(variant.imageUrls) && variant.imageUrls.length > 0
            ? variant.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
            : (variant.imageUrl && typeof variant.imageUrl === 'string' && variant.imageUrl.trim().length > 0 ? [variant.imageUrl] : [])
          
          return {
            _id: variantId,
            imageUrls: imageUrls,
            color: variant.color  ,
            size: variant.size || '',
            // Use null for invalid numeric values to indicate data issues
            // Explicitly check for null, undefined, NaN, and negative values
            // Note: 0 is a valid value for quantity (out of stock), so we check for NaN and negative values
            quantity:
              variant.quantity != null &&
              typeof variant.quantity === "number" &&
              !isNaN(variant.quantity) &&
              variant.quantity >= 0
                ? variant.quantity
                : null,
            price:
              variant.price != null &&
              typeof variant.price === "number" &&
              !isNaN(variant.price) &&
              variant.price >= 0
                ? variant.price
                : null,
            discountPrice:
              variant.discountPrice != null &&
              typeof variant.discountPrice === "number" &&
              !isNaN(variant.discountPrice) &&
              variant.discountPrice >= 0
                ? variant.discountPrice
                : null,
            inStock: typeof variant.inStock === 'boolean' ? variant.inStock : true,
            measurements: {
              neck: typeof variant.measurements?.neck === 'number' ? variant.measurements.neck : undefined,
              shoulder: typeof variant.measurements?.shoulder === 'number' ? variant.measurements.shoulder : undefined,
              chest: typeof variant.measurements?.chest === 'number' ? variant.measurements.chest : undefined,
              shortSleeve: typeof variant.measurements?.shortSleeve === 'number' ? variant.measurements.shortSleeve : undefined,
              longSleeve: typeof variant.measurements?.longSleeve === 'number' ? variant.measurements.longSleeve : undefined,
              roundSleeve: typeof variant.measurements?.roundSleeve === 'number' ? variant.measurements.roundSleeve : undefined,
              tummy: typeof variant.measurements?.tummy === 'number' ? variant.measurements.tummy : undefined,
              topLength: typeof variant.measurements?.topLength === 'number' ? variant.measurements.topLength : undefined,
              waist: typeof variant.measurements?.waist === 'number' ? variant.measurements.waist : undefined,
              laps: typeof variant.measurements?.laps === 'number' ? variant.measurements.laps : undefined,
              kneelLength: typeof variant.measurements?.kneelLength === 'number' ? variant.measurements.kneelLength : undefined,
              roundKneel: typeof variant.measurements?.roundKneel === 'number' ? variant.measurements.roundKneel : undefined,
              trouserLength: typeof variant.measurements?.trouserLength === 'number' ? variant.measurements.trouserLength : undefined,
              quarterLength: typeof variant.measurements?.quarterLength === 'number' ? variant.measurements.quarterLength : undefined,
              ankle: typeof variant.measurements?.ankle === 'number' ? variant.measurements.ankle : undefined,
            },
          }
        })
        setProductVariants(initialVariants)
        productVariantsRef.current = initialVariants
      } else if (product.images && product.images.length > 0) {
        // Fallback: reconstruct from aggregated data (legacy support)
        const imagesWithColors: UploadedImageData[] = product.images.map((imgUrl, index) => ({
          url: imgUrl,
          color: product.colors[index]  ,
        }))
        setUploadedImages(imagesWithColors)
        setProductVariants([])
        productVariantsRef.current = []
      } else {
        setUploadedImages([])
        setProductVariants([])
        productVariantsRef.current = []
      }
      setHasInitialized(true)
    } else if (!isOpen) {
      // Reset initialization flag when modal closes
      setHasInitialized(false)
      setUploadedImages([])
      setProductVariants([])
      productVariantsRef.current = []
    }
  }, [isOpen, product.productId, product.productVariant, product.images, product.colors, hasInitialized])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      // Reset image states when modal closes
      setImagePreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - only PNG, JPG, and JPEG allowed
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    const allowedExtensions = ['.png', '.jpg', '.jpeg']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Only PNG, JPG, and JPEG images are allowed')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = () => {
    if (!selectedFile) return

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append('image', selectedFile)

    sendHttpRequest({
      successRes: (res) => {
        const imageUrl = res.data.data.imageUrl
        const newImage: UploadedImageData = {
          url: imageUrl,
          color: '#000000', // Default color
          preview: imagePreview || undefined
        }
        
        setUploadedImages(prev => [...prev, newImage])
        // Update product images (colors no longer used but kept for backward compatibility)
        const updatedImages = [...uploadedImages.map(img => img.url), imageUrl]
        const updatedColors = [...uploadedImages.map(img => img.color || '#000000'), '#000000']
        onInputChange('images', updatedImages)
        onInputChange('colors', updatedColors)
        
        // Reset preview and file
        setImagePreview(null)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsUploadingImage(false)
      },
      requestConfig: {
        url: '/admin/upload-image',
        method: 'POST',
        body: formData,
        successMessage: 'Image uploaded successfully',
      },
    })
  }

  const handleDeleteImage = (index: number) => {
    const imageToDelete = uploadedImages[index]
    
    setDeletingImageIndex(index)
    
    // Delete from Cloudinary
    sendHttpRequest({
      successRes: () => {
        const updatedImages = uploadedImages.filter((_, i) => i !== index)
        setUploadedImages(updatedImages)
        const updatedImageUrls = updatedImages.map(img => img.url)
        const updatedColors = updatedImages.map(img => img.color)
        onInputChange('images', updatedImageUrls.length > 0 ? updatedImageUrls : ['https://via.placeholder.com/400x400?text=Product'])
        onInputChange('colors', updatedColors.length > 0 ? updatedColors : [])
        
        // Remove variants that reference the deleted image in their imageUrls array
        setProductVariants(prev => {
          const updated = prev.filter(v => {
            // Check if variant's imageUrls array contains the deleted image
            return !(Array.isArray(v.imageUrls) && v.imageUrls.includes(imageToDelete.url))
          })
          // Also remove the deleted image from variants that still have other images
          const cleaned = updated.map(v => ({
            ...v,
            imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls.filter(url => url !== imageToDelete.url) : []
          })).filter(v => v.imageUrls.length > 0) // Remove variants with no images left
          productVariantsRef.current = cleaned
          return cleaned
        })
        
        setDeletingImageIndex(null)
      },
      requestConfig: {
        url: '/admin/upload-image',
        method: 'DELETE',
        body: {
          imageUrl: imageToDelete.url
        },
        successMessage: 'Image deleted successfully',
      },
    })
    
    // Reset deleting state after timeout as fallback
    setTimeout(() => {
      setDeletingImageIndex((currentIndex) => {
        if (currentIndex === index) {
          return null
        }
        return currentIndex
      })
    }, 5000)
  }


  const handleCancelPreview = () => {
    setImagePreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  const handleSaveProduct = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Validate required fields
    if (!product.name || !product.category || !product.productId || !product.material || !product.material.trim() || !product.productOwner || !product.productOwner.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate material
    if (product.material.trim().length < 2) {
      toast.error('Material must be at least 2 characters')
      return
    }
    if (product.material.trim().length > 200) {
      toast.error('Material must not exceed 200 characters')
      return
    }

    // Validate product owner
    if (product.productOwner.trim().length < 1) {
      toast.error('Product owner must be at least 1 character')
      return
    }
    if (product.productOwner.trim().length > 100) {
      toast.error('Product owner must not exceed 100 characters')
      return
    }

    if (uploadedImages.length === 0) {
      toast.error('At least one image is required')
      return
    }

    // Validate variants
    if (productVariants.length === 0) {
      toast.error('At least one product variant must be created')
      return
    }

    // Validate each variant
    const newErrors: Record<string, string> = {}
    productVariants.forEach((variant, index) => {
      // Validate imageUrls array - must have at least one image
      if (!Array.isArray(variant.imageUrls) || variant.imageUrls.length === 0) {
        newErrors[`variant_${index}_imageUrls`] = `At least one image is required for variant ${index + 1}`
      } else {
        // Validate each image URL in the array
        variant.imageUrls.forEach((url, urlIndex) => {
          if (!url || typeof url !== 'string' || url.trim() === '') {
            newErrors[`variant_${index}_imageUrl_${urlIndex}`] = `Image URL ${urlIndex + 1} for variant ${index + 1} is invalid`
          }
        })
      }
      if (!variant.color || variant.color.trim() === '') {
        newErrors[`variant_${index}_color`] = `Color is required for variant ${index + 1}`
      }
      if (!variant.size || (variant.size as string) === '') {
        newErrors[`variant_${index}_size`] = `Size is required for variant ${index + 1}`
      }
      // Validate price - must be a positive number (not null)
      if (variant.price === null || typeof variant.price !== 'number' || variant.price < 0) {
        newErrors[`variant_${index}_price`] = `Valid price is required for variant ${index + 1}`
      }
      // Validate discount price - must be a positive number (not null)
      if (variant.discountPrice === null || typeof variant.discountPrice !== 'number' || variant.discountPrice < 0) {
        newErrors[`variant_${index}_discountPrice`] = `Valid discount price is required for variant ${index + 1}`
      }
      // Validate quantity - must be a non-negative integer (not null)
      if (variant.quantity === null || typeof variant.quantity !== 'number' || variant.quantity < 0) {
        newErrors[`variant_${index}_quantity`] = `Valid quantity is required for variant ${index + 1}`
      }

      // Validate measurements:
      // - Each filled measurement must be a positive number
      // - At least 5 measurement fields must be provided (matches backend rule)
      const m = variant.measurements

      // Per-field validation
      MEASUREMENT_FIELDS.forEach((field) => {
        const value = m[field]
        if (value !== undefined && (typeof value !== 'number' || isNaN(value) || value <= 0)) {
          newErrors[`variant_${index}_measurements_${field}`] = `${MEASUREMENT_LABELS[field]} must be a positive number for variant ${index + 1}`
        }
      })

      // Minimum count validation
      const filledCount = MEASUREMENT_FIELDS.reduce((count, field) => {
        const value = m[field]
        return value !== undefined && value !== null ? count + 1 : count
      }, 0)

      if (filledCount < 5) {
        newErrors[`variant_${index}_measurements_minCount`] =
          `Please provide at least 5 measurements for variant ${index + 1}`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fix all variant errors before saving')
      return
    }

    setIsSubmitting(true)

    // Payload matching IEditProductUserInput interface
    // Note: Include _id for existing variants so Mongoose can match and preserve them
    // New variants without _id will get auto-generated _id values
    const payload = {
      productId: product.productId, // MongoDB ObjectId as string (will be converted to Types.ObjectId on backend)
      name: product.name.trim(),
      description: product.description.trim(),
      slug: product.slug || '', // Required field
      category: product.category as ClothingCategory,
      material: product.material.trim(),
      productOwner: product.productOwner.trim() || 'self',
      productVariant: productVariants.map(v => {
        // Validation ensures these are not null, but TypeScript needs explicit checks
        // Use non-null assertions since validateForm() ensures these are valid numbers
        const quantity = v.quantity !== null ? Math.max(0, Math.floor(v.quantity)) : 0
        const price = v.price !== null ? Math.max(0, parseFloat(v.price.toFixed(2))) : 0
        const discountPrice = v.discountPrice !== null ? Math.max(0, parseFloat(v.discountPrice.toFixed(2))) : 0
        
        // Ensure imageUrls is an array with at least one valid URL
        const imageUrls = Array.isArray(v.imageUrls) && v.imageUrls.length > 0
          ? v.imageUrls.map(url => String(url).trim()).filter(url => url.length > 0)
          : []
        
        const variantPayload: any = {
          imageUrls, // Array of image URLs
          color: v.color.trim(),
          size: v.size as ProductSize, // Type assertion - validated above
          quantity, // Ensure non-negative integer
          price, // Ensure non-negative, 2 decimal places
          discountPrice, // Ensure non-negative, 2 decimal places
          inStock: v.inStock,
          measurements: { ...v.measurements },
        }
        
        // Include _id only if it exists and is a valid ObjectId (24 hex characters)
        // This prevents sending invalid IDs like "variant-4" to the server
        if (v._id) {
          const idString = getVariantIdString(v._id)
          // Only include _id if it's a valid ObjectId format
          if (idString && /^[0-9a-fA-F]{24}$/.test(idString)) {
            variantPayload._id = idString
          }
          // If _id exists but is invalid, don't include it - server will generate a new one
        }
        
        return variantPayload
      }),
      isFeatured: product.featured,
      inStock: productVariants.some(v => v.inStock), // Product is in stock if any variant is in stock
    }

    sendHttpRequest({
      successRes: (res) => {
        // Get the updated product from the response
        const updatedProduct = res?.data?.data
        
        if (updatedProduct) {
          // Map updated product from backend into ReduxProduct shape
          const reduxProduct: ReduxProduct = {
            _id: updatedProduct._id?.toString() || product.productId || '',
            adminId: updatedProduct.adminId?.toString() || product.adminId || '',
            category: updatedProduct.category || product.category,
            createdAt:
              updatedProduct.createdAt != null
                ? (typeof updatedProduct.createdAt === 'string'
                    ? updatedProduct.createdAt
                    : new Date(updatedProduct.createdAt).toISOString())
                : product.createdAt || new Date().toISOString(),
            description: updatedProduct.description || product.description,
            material: updatedProduct.material || product.material || '',
            productOwner: updatedProduct.productOwner || product.productOwner || 'self',
            productVariant: Array.isArray(updatedProduct.productVariant)
              ? updatedProduct.productVariant.map((v: any, index: number) => {
                  // Normalize numerics for Redux type (expects numbers)
                  const quantity =
                    v.quantity != null &&
                    typeof v.quantity === 'number' &&
                    !isNaN(v.quantity)
                      ? v.quantity
                      : 0
                  const price =
                    v.price != null &&
                    typeof v.price === 'number' &&
                    !isNaN(v.price)
                      ? v.price
                      : 0
                  const discountPrice =
                    v.discountPrice != null &&
                    typeof v.discountPrice === 'number' &&
                    !isNaN(v.discountPrice)
                      ? v.discountPrice
                      : 0

                  const variantId =
                    v._id && typeof v._id === 'object' && v._id.toString
                      ? v._id.toString()
                      : typeof v._id === 'string'
                        ? v._id
                        : undefined

                  // Handle both new imageUrls array and old imageUrl field for backward compatibility
                  const imageUrls = Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                    ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
                    : (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0 ? [v.imageUrl] : [])
                  
                  return {
                    _id: variantId,
                    imageUrls: imageUrls,
                    color: v.color || '',
                    size: v.size || '',
                    quantity,
                    price,
                    discountPrice,
                    inStock: typeof v.inStock === 'boolean' ? v.inStock : true,
                    measurements: {
                      neck: typeof v.measurements?.neck === 'number' ? v.measurements.neck : undefined,
                      shoulder: typeof v.measurements?.shoulder === 'number' ? v.measurements.shoulder : undefined,
                      chest: typeof v.measurements?.chest === 'number' ? v.measurements.chest : undefined,
                      shortSleeve: typeof v.measurements?.shortSleeve === 'number' ? v.measurements.shortSleeve : undefined,
                      longSleeve: typeof v.measurements?.longSleeve === 'number' ? v.measurements.longSleeve : undefined,
                      roundSleeve: typeof v.measurements?.roundSleeve === 'number' ? v.measurements.roundSleeve : undefined,
                      tummy: typeof v.measurements?.tummy === 'number' ? v.measurements.tummy : undefined,
                      topLength: typeof v.measurements?.topLength === 'number' ? v.measurements.topLength : undefined,
                      waist: typeof v.measurements?.waist === 'number' ? v.measurements.waist : undefined,
                      laps: typeof v.measurements?.laps === 'number' ? v.measurements.laps : undefined,
                      kneelLength: typeof v.measurements?.kneelLength === 'number' ? v.measurements.kneelLength : undefined,
                      roundKneel: typeof v.measurements?.roundKneel === 'number' ? v.measurements.roundKneel : undefined,
                      trouserLength: typeof v.measurements?.trouserLength === 'number' ? v.measurements.trouserLength : undefined,
                      quarterLength: typeof v.measurements?.quarterLength === 'number' ? v.measurements.quarterLength : undefined,
                      ankle: typeof v.measurements?.ankle === 'number' ? v.measurements.ankle : undefined,
                    },
                  }
                })
              : [],
            isFeatured: updatedProduct.isFeatured ?? product.featured ?? false,
            name: updatedProduct.name || product.name,
            slug: updatedProduct.slug || product.slug || '',
          }

          // Update local modal state from the fresh backend document
          // Handle both new imageUrls array and old imageUrl field for backward compatibility
          const localVariants: ProductVariantData[] = reduxProduct.productVariant.map((v) => {
            const imageUrls = Array.isArray(v.imageUrls) && v.imageUrls.length > 0
              ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
              : ((v as any).imageUrl && typeof (v as any).imageUrl === 'string' && (v as any).imageUrl.trim().length > 0 ? [(v as any).imageUrl] : [])
            
            return {
              _id: v._id,
              imageUrls: imageUrls,
              color: v.color,
              size: (v.size as ProductSize) || '',
              quantity: v.quantity,
              price: v.price,
              discountPrice: v.discountPrice,
              inStock: v.inStock,
              measurements: {
                neck: v.measurements?.neck,
                shoulder: v.measurements?.shoulder,
                chest: v.measurements?.chest,
                shortSleeve: v.measurements?.shortSleeve,
                longSleeve: v.measurements?.longSleeve,
                roundSleeve: v.measurements?.roundSleeve,
                tummy: v.measurements?.tummy,
                topLength: v.measurements?.topLength,
                waist: v.measurements?.waist,
                laps: v.measurements?.laps,
                kneelLength: v.measurements?.kneelLength,
                roundKneel: v.measurements?.roundKneel,
                trouserLength: v.measurements?.trouserLength,
                quarterLength: v.measurements?.quarterLength,
                ankle: v.measurements?.ankle,
              },
            }
          })
          setProductVariants(localVariants)
          productVariantsRef.current = localVariants

          // Sync uploaded images with latest variants (flatten imageUrls arrays)
          const imageMap = new Map<string, string>()
          localVariants.forEach((v) => {
            if (Array.isArray(v.imageUrls) && v.imageUrls.length > 0) {
              v.imageUrls.forEach(url => {
                if (url && !imageMap.has(url)) {
                  imageMap.set(url, v.color)
                }
              })
            }
          })
          const updatedImages: UploadedImageData[] = Array.from(imageMap.entries()).map(([url, color]) => ({
            url,
            color,
          }))
          setUploadedImages(updatedImages)

          // Replace the product in Redux using its id and the fresh document
          if (reduxProduct._id) {
            dispatch(
              adminActions.updateProduct({
                _id: reduxProduct._id,
                updated: reduxProduct,
              })
            )
          }
        }
        
        setIsSubmitting(false)
        // Call parent's onSave to close modal
        onSave()
      },
      requestConfig: {
        url: '/admin/edit-product',
        method: 'PUT',
        body: payload,
        successMessage: 'Product updated successfully',
      },
    })
  }

  // Reset submitting state when useHttp's isLoading changes
  useEffect(() => {
    if (!isUploading && isSubmitting) {
      // Small delay to ensure state updates are processed
      const timer = setTimeout(() => {
        setIsSubmitting(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isUploading, isSubmitting])

  // Reset deleting variant state when request completes (handles error cases)
  useEffect(() => {
    if (!isUploading && deletingVariantId) {
      // Small delay to ensure state updates are processed
      const timer = setTimeout(() => {
        setDeletingVariantId(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isUploading, deletingVariantId])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden min-h-[100svh] h-[100dvh] w-screen"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm h-full w-full" />
      
      {/* Modal Container */}
      <div className="relative min-h-[100svh] h-[100dvh] w-screen flex flex-col bg-white">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
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
            <form onSubmit={handleSaveProduct} noValidate>
              <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={product.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={product.category}
                onChange={(e) => onInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
              >
                <option value="">Select category</option>
                {clothingCategories.map(category => (
                  <option key={category.value} value={category.value}>{getCategoryLabel(category.value)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <input
                type="text"
                value={product.material || ''}
                onChange={(e) => onInputChange('material', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black"
                placeholder="e.g., Cotton, Polyester, Silk, Linen, etc."
                maxLength={200}
              />
              <p className="mt-1 text-xs text-gray-500">
                Specify the material or fabric used (max 200 characters)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Owner *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={product.productOwner || 'self'}
                  onChange={(e) => onInputChange('productOwner', e.target.value)}
                  disabled={productOwnerLocked}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black ${
                    productOwnerLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="Enter product owner name"
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => setProductOwnerLocked(!productOwnerLocked)}
                  className={`p-2 rounded-md border transition-colors ${
                    productOwnerLocked
                      ? 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      : 'bg-primary-50 border-primary-300 text-primary-600 hover:bg-primary-100'
                  }`}
                  title={productOwnerLocked ? 'Unlock to edit' : 'Lock field'}
                >
                  {productOwnerLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Default: "self". Click the lock icon to edit (max 100 characters)
              </p>
            </div>

            {product.slug && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Slug (Read-only)
                </label>
                <input
                  type="text"
                  value={product.slug}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Product slug cannot be changed
                </p>
              </div>
            )}
            
            {product.createdAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At (Read-only)
                </label>
                <input
                  type="text"
                  value={new Date(product.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            )}

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={product.featured}
                  onChange={(e) => onInputChange('featured', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
              </label>
            </div>

                {/* Product Images with Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images *
                  </label>
                  
                  {/* File Input */}
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <label
                      htmlFor="image-upload-edit"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50"
                    >
                      <Upload className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-700">Click to select image</span>
                    </label>
                  </div>

                  {/* Image Preview Before Upload */}
                  {imagePreview && selectedFile && (
                    <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover rounded-lg"
                            sizes="128px"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {selectedFile.size < 1024 * 1024
                              ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                              : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleUploadImage}
                              disabled={isUploadingImage}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {isUploadingImage ? (
                                <>
                                  <SewingMachineLoader size="sm" inline className="mr-2" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Image
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelPreview}
                              disabled={isUploadingImage}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Images */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-700">
                        Product Images ({uploadedImages.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {uploadedImages.map((img, index) => (
                          <div
                            key={index}
                            className="border border-gray-300 rounded-lg p-4 bg-white"
                          >
                            <div className="relative w-full h-48 mb-3">
                              <Image
                                src={img.preview || img.url}
                                alt={`Product image ${index + 1}`}
                                fill
                                className="object-cover rounded-lg"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                unoptimized={img.url.includes('via.placeholder.com')}
                              />
                            </div>

                            {/* Delete Image Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(index)}
                              disabled={deletingImageIndex !== null || uploadedImages.length <= 1}
                              className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              title={uploadedImages.length <= 1 ? 'At least one image is required' : 'Delete image'}
                            >
                              {deletingImageIndex === index ? (
                                <>
                                  <SewingMachineLoader size="sm" inline className="mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Image
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadedImages.length === 0 && !imagePreview && (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No images uploaded yet</p>
                      <p className="text-xs text-gray-400 mt-1">Upload at least one image</p>
                    </div>
                  )}
                </div>

                {/* Product Variants Management */}
                {uploadedImages.length > 0 && (
                  <div data-field="variants">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Product Variants * ({productVariants.length} variant{productVariants.length !== 1 ? 's' : ''})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          // Add a new variant with first uploaded image as default
                          // NOTE: New variants have NO _id until they are saved to the server
                          // If deleted before saving, they will be deleted locally only
                          if (uploadedImages.length > 0) {
                            const firstImage = uploadedImages[0]
                            const newVariant: ProductVariantData = {
                              // No _id field - will be assigned by server when saved
                              imageUrls: [firstImage.url], // Start with first image, user can add more
                              color: '#000000', // Default color - user can change it in the table
                              size: '' as ProductSize | '',
                              quantity: 0,
                              price: 0,
                              discountPrice: 0,
                              inStock: false,
                              measurements: {},
                            }
                            setProductVariants(prev => {
                              const updated = [...prev, newVariant]
                              productVariantsRef.current = updated
                              return updated
                            })
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                        title="Add Variant"
                      >
                        + Add Variant
                      </button>
                    </div>
                    {errors.variants && (
                      <p className="mb-2 text-xs text-red-600">{errors.variants}</p>
                    )}
                    {productVariants.length === 0 ? (
                      <div className="border border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">No variants added yet</p>
                        <p className="text-xs text-gray-500">Click "Add Variant" above to create your first product variant</p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image *</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size *</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price *</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount Price *</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity *</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {productVariants.map((variant, index) => {
                                const selectedImages = uploadedImages.filter(img => 
                                  Array.isArray(variant.imageUrls) && variant.imageUrls.includes(img.url)
                                )
                                const measurementFilledCount = MEASUREMENT_FIELDS.reduce((count, field) => {
                                  const value = variant.measurements[field]
                                  return value !== undefined && value !== null ? count + 1 : count
                                }, 0)
                                const hasMeasurementFieldError = MEASUREMENT_FIELDS.some(
                                  (field) => !!errors[`variant_${index}_measurements_${field}`]
                                )
                                const hasMeasurementCountError = !!errors[`variant_${index}_measurements_minCount`]
                                const hasAnyMeasurementError = hasMeasurementFieldError || hasMeasurementCountError
                                const imageError = errors[`variant_${index}_imageUrls`] || 
                                  Object.keys(errors).find(key => key.startsWith(`variant_${index}_imageUrl_`))

                                return (
                                  <tr key={`variant-${variant._id || index}`} className="hover:bg-gray-50 align-top">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      #{index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="space-y-2 min-w-[200px]">
                                        {/* Mobile-friendly checkbox-based image selection */}
                                        <div className={`border rounded-lg p-2 sm:p-3 ${imageError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
                                          <p className="text-xs font-medium text-gray-700 mb-2">
                                            Select Images ({Array.isArray(variant.imageUrls) ? variant.imageUrls.length : 0} selected)
                                          </p>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                            {uploadedImages.map((img, imgIndex) => {
                                              const isSelected = Array.isArray(variant.imageUrls) && variant.imageUrls.includes(img.url)
                                              return (
                                                <label
                                                  key={img.url}
                                                  className={`relative cursor-pointer group border-2 rounded-lg overflow-hidden transition-all ${
                                                    isSelected 
                                                      ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-200' 
                                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                                  }`}
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                          onChange={(e) => {
                                            const currentUrls = Array.isArray(variant.imageUrls) ? variant.imageUrls : []
                                            let newUrls: string[]
                                            
                                            if (e.target.checked) {
                                              // Adding an image - always allowed
                                              newUrls = [...currentUrls, img.url]
                                            } else {
                                              // Removing an image - check if at least one will remain
                                              newUrls = currentUrls.filter(url => url !== img.url)
                                              if (newUrls.length === 0) {
                                                toast.error('At least one image is required for each variant')
                                                return
                                              }
                                            }
                                            
                                            setProductVariants(prev => {
                                              const updated = prev.map((v, i) => {
                                                if (i === index) {
                                                  // Color is now independent - no automatic update from images
                                                  return { ...v, imageUrls: newUrls }
                                                }
                                                return v
                                              })
                                              productVariantsRef.current = updated
                                              return updated
                                            })
                                                      
                                                      // Clear image-related errors
                                                      setErrors(prev => {
                                                        const newErrors = { ...prev }
                                                        delete newErrors[`variant_${index}_imageUrls`]
                                                        Object.keys(newErrors).forEach(key => {
                                                          if (key.startsWith(`variant_${index}_imageUrl_`)) {
                                                            delete newErrors[key]
                                                          }
                                                        })
                                                        return newErrors
                                                      })
                                                    }}
                                                    className="sr-only"
                                                  />
                                                  <div className="relative aspect-square w-full">
                                                    <Image
                                                      src={img.preview || img.url}
                                                      alt={`Image ${imgIndex + 1}`}
                                                      fill
                                                      className="object-cover"
                                                      sizes="(max-width: 640px) 50vw, 33vw"
                                                      unoptimized={img.url.includes('via.placeholder.com')}
                                                    />
                                                    {isSelected && (
                                                      <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                                                        <div className="bg-primary-600 text-white rounded-full p-1">
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                          </svg>
                                                        </div>
                                                      </div>
                                                    )}
                                                    <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                      {imgIndex + 1}
                                                    </div>
                                                  </div>
                                                </label>
                                              )
                                            })}
                                          </div>
                                        </div>
                                        
                                        {/* Display selected images as thumbnails */}
                                        {selectedImages.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            <p className="text-xs font-medium text-gray-700 w-full">Selected Images:</p>
                                            {selectedImages.map((img) => (
                                              <div key={img.url} className="relative w-16 h-16 group">
                                                <Image
                                                  src={img.preview || img.url}
                                                  alt={`Variant ${index + 1} image`}
                                                  fill
                                                  className="object-cover rounded border-2 border-primary-500"
                                                  sizes="64px"
                                                  unoptimized={img.url.includes('via.placeholder.com')}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const currentUrls = Array.isArray(variant.imageUrls) ? variant.imageUrls : []
                                                    const newUrls = currentUrls.filter(url => url !== img.url)
                                                    
                                                    // Ensure at least one image remains
                                                    if (newUrls.length === 0) {
                                                      toast.error('At least one image is required for each variant')
                                                      return
                                                    }
                                                    
                                                    setProductVariants(prev => {
                                                      const updated = prev.map((v, i) => {
                                                        if (i === index) {
                                                          return { ...v, imageUrls: newUrls }
                                                        }
                                                        return v
                                                      })
                                                      productVariantsRef.current = updated
                                                      return updated
                                                    })
                                                    
                                                    // Clear image-related errors
                                                    setErrors(prev => {
                                                      const newErrors = { ...prev }
                                                      delete newErrors[`variant_${index}_imageUrls`]
                                                      Object.keys(newErrors).forEach(key => {
                                                        if (key.startsWith(`variant_${index}_imageUrl_`)) {
                                                          delete newErrors[key]
                                                        }
                                                      })
                                                      return newErrors
                                                    })
                                                  }}
                                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-xs shadow-md"
                                                  aria-label="Remove image"
                                                  title="Remove image from variant (at least one image must remain)"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {imageError && (
                                          <p className="mt-1 text-xs text-red-600">{imageError}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                          <div className="relative">
                                            <input
                                              type="color"
                                              value={variant.color || '#000000'}
                                              onChange={(e) => {
                                                e.stopPropagation()
                                                setProductVariants(prev => {
                                                  const updated = prev.map((v, i) => {
                                                    if (i === index) {
                                                      return { ...v, color: e.target.value }
                                                    }
                                                    return v
                                                  })
                                                  productVariantsRef.current = updated
                                                  return updated
                                                })
                                                if (errors[`variant_${index}_color`]) {
                                                  setErrors(prev => {
                                                    const newErrors = { ...prev }
                                                    delete newErrors[`variant_${index}_color`]
                                                    return newErrors
                                                  })
                                                }
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              onMouseDown={(e) => e.stopPropagation()}
                                              className="h-8 w-16 border border-gray-300 rounded cursor-pointer relative z-10"
                                              title="Select color for this variant"
                                            />
                                          </div>
                                          <input
                                            type="text"
                                            value={variant.color || '#000000'}
                                            onChange={(e) => {
                                              e.stopPropagation()
                                              setProductVariants(prev => {
                                                const updated = prev.map((v, i) => {
                                                  if (i === index) {
                                                    return { ...v, color: e.target.value }
                                                  }
                                                  return v
                                                })
                                                productVariantsRef.current = updated
                                                return updated
                                              })
                                              if (errors[`variant_${index}_color`]) {
                                                setErrors(prev => {
                                                  const newErrors = { ...prev }
                                                  delete newErrors[`variant_${index}_color`]
                                                  return newErrors
                                                })
                                              }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black max-w-[100px]"
                                            placeholder="#000000"
                                            pattern="^#[0-9A-Fa-f]{6}$"
                                            title="Enter hex color code (e.g., #FF5733)"
                                          />
                                        </div>
                                        {errors[`variant_${index}_color`] && (
                                          <p className="text-xs text-red-600">{errors[`variant_${index}_color`]}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <select
                                        value={variant.size}
                                        onChange={(e) => {
                                          const selectedValue = e.target.value
                                          setProductVariants(prev => {
                                            const updated: ProductVariantData[] = prev.map((v, i) => 
                                              i === index 
                                                ? { ...v, size: (selectedValue === '' ? '' : selectedValue as ProductSize) }
                                                : v
                                            )
                                            productVariantsRef.current = updated
                                            return updated
                                          })
                                          if (errors[`variant_${index}_size`]) {
                                            setErrors(prev => {
                                              const newErrors = { ...prev }
                                              delete newErrors[`variant_${index}_size`]
                                              return newErrors
                                            })
                                          }
                                        }}
                                        className={`w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-black ${
                                          errors[`variant_${index}_size`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                      >
                                        <option value="">Select...</option>
                                        {productSizes.map((size) => (
                                          <option key={size.value} value={size.value}>
                                            {size.label}
                                          </option>
                                        ))}
                                      </select>
                                      {errors[`variant_${index}_size`] && (
                                        <p className="mt-1 text-xs text-red-600">{errors[`variant_${index}_size`]}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variant.price || ''}
                                        onChange={(e) => {
                                          const newPrice = parseFloat(e.target.value) || 0
                                          setProductVariants(prev => {
                                            const updated = prev.map((v, i) => 
                                              i === index 
                                                ? { ...v, price: newPrice }
                                                : v
                                            )
                                            productVariantsRef.current = updated
                                            return updated
                                          })
                                          if (errors[`variant_${index}_price`]) {
                                            setErrors(prev => {
                                              const newErrors = { ...prev }
                                              delete newErrors[`variant_${index}_price`]
                                              return newErrors
                                            })
                                          }
                                        }}
                                        className={`w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black ${
                                          errors[`variant_${index}_price`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                      />
                                      {errors[`variant_${index}_price`] && (
                                        <p className="mt-1 text-xs text-red-600">{errors[`variant_${index}_price`]}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={variant.discountPrice || ''}
                                        onChange={(e) => {
                                          const newDiscountPrice = parseFloat(e.target.value) || 0
                                          setProductVariants(prev => {
                                            const updated = prev.map((v, i) => 
                                              i === index 
                                                ? { ...v, discountPrice: newDiscountPrice }
                                                : v
                                            )
                                            productVariantsRef.current = updated
                                            return updated
                                          })
                                          if (errors[`variant_${index}_discountPrice`]) {
                                            setErrors(prev => {
                                              const newErrors = { ...prev }
                                              delete newErrors[`variant_${index}_discountPrice`]
                                              return newErrors
                                            })
                                          }
                                        }}
                                        className={`w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black ${
                                          errors[`variant_${index}_discountPrice`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                      />
                                      {errors[`variant_${index}_discountPrice`] && (
                                        <p className="mt-1 text-xs text-red-600">{errors[`variant_${index}_discountPrice`]}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <input
                                        type="number"
                                        min="0"
                                        value={variant.quantity || ''}
                                        onChange={(e) => {
                                          const newQuantity = parseInt(e.target.value) || 0
                                          setProductVariants(prev => {
                                            const updated = prev.map((v, i) => 
                                              i === index 
                                                ? { ...v, quantity: newQuantity, inStock: newQuantity > 0 && v.inStock }
                                                : v
                                            )
                                            productVariantsRef.current = updated
                                            return updated
                                          })
                                          if (errors[`variant_${index}_quantity`]) {
                                            setErrors(prev => {
                                              const newErrors = { ...prev }
                                              delete newErrors[`variant_${index}_quantity`]
                                              return newErrors
                                            })
                                          }
                                        }}
                                        className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black ${
                                          errors[`variant_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0"
                                      />
                                      {errors[`variant_${index}_quantity`] && (
                                        <p className="mt-1 text-xs text-red-600">{errors[`variant_${index}_quantity`]}</p>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={variant.inStock}
                                        onChange={(e) => {
                                          setProductVariants(prev => {
                                            const updated = prev.map((v, i) => 
                                              i === index 
                                                ? { ...v, inStock: e.target.checked }
                                                : v
                                            )
                                            productVariantsRef.current = updated
                                            return updated
                                          })
                                        }}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium align-top">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMeasurementsIndex(openMeasurementsIndex === index ? null : index)
                                          }}
                                          className={`text-xs font-medium transition-colors ${
                                            hasAnyMeasurementError
                                              ? 'text-red-600 hover:text-red-700'
                                              : 'text-primary-600 hover:text-primary-700'
                                          }`}
                                        >
                                          Measurements
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                          // Prevent deletion if only one variant remains
                                          if (productVariants.length <= 1) {
                                            toast.error('At least one variant is required')
                                            return
                                          }

                                          // Get the current variant from the ref to avoid closure issues
                                          // The ref always contains the latest state value
                                          const currentVariants = productVariantsRef.current
                                          const currentVariant = currentVariants[index]
                                          
                                          // Debug: Log what we're working with
                                          console.log('Delete clicked - Debug info:', {
                                            index,
                                            currentVariantsLength: currentVariants.length,
                                            currentVariant,
                                            variantFromClosure: variant,
                                            variantId: currentVariant?._id,
                                            variantIdType: typeof currentVariant?._id,
                                            allVariants: currentVariants.map((v, i) => ({ 
                                              index: i, 
                                              _id: v._id, 
                                              imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls : [], 
                                              size: v.size 
                                            }))
                                          })
                                          
                                          if (!currentVariant) {
                                            toast.error('Variant not found')
                                            return
                                          }
                                          
                                          // DELETE LOGIC FLOW:
                                          // 1. If variant has NO _id or INVALID _id → It's a NEW variant NOT saved to server yet
                                          //    → Delete locally only (no HTTP request needed)
                                          // 2. If variant has VALID ObjectId _id → It's been SAVED to the server
                                          //    → Send HTTP request to delete from server, then update local state from response
                                          
                                          // Extract variant ID - determine if this is a saved variant or new unsaved variant
                                          // Saved variants have a valid ObjectId _id, new variants have no _id or invalid _id
                                          const variantIdString = currentVariant._id ? getVariantIdString(currentVariant._id) : ''
                                          const isValidObjectId = variantIdString && /^[0-9a-fA-F]{24}$/.test(variantIdString)
                                          
                                          console.log('Delete - Extracted ID:', {
                                            originalId: currentVariant._id,
                                            originalIdType: typeof currentVariant._id,
                                            extractedId: variantIdString,
                                            isValidObjectId,
                                            variantIdStringLength: variantIdString?.length,
                                            allVariantsInState: currentVariants.map((v, i) => ({ 
                                              index: i, 
                                              _id: v._id, 
                                              _idType: typeof v._id,
                                              imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls : [], 
                                              size: v.size 
                                            }))
                                          })
                                          
                                          // CASE 1: Variant has no valid ObjectId → NEW variant NOT saved to server yet
                                          // Delete locally only (no HTTP request needed)
                                          if (!isValidObjectId) {
                                            console.log('Delete - No valid ObjectId found, deleting locally only (unsaved variant)')
                                            console.log('  → This variant was added locally but never saved to the server')
                                            setProductVariants(prev => {
                                              const updated = prev.filter((_, i) => i !== index)
                                              productVariantsRef.current = updated
                                              return updated
                                            })
                                            return
                                          }
                                          
                                          // CASE 2: Variant has valid ObjectId → SAVED variant (exists on server)
                                          // Always send HTTP request to delete from server, then update local state from response
                                          console.log('Delete - Valid ObjectId found, sending HTTP request to delete from server:', variantIdString)
                                          console.log('  → This variant was saved to the server, must delete via HTTP request')
                                          
                                          if (product.productId) {
                                            // Capture variantIdString in a const to ensure it's used correctly in the URL
                                            const deleteVariantId = variantIdString // This is guaranteed to be a valid ObjectId
                                            console.log('Sending delete request with productId:', product.productId, 'variantId:', deleteVariantId)
                                            setDeletingVariantId(deleteVariantId)
                                            
                                            sendHttpRequest({
                                              successRes: (res) => {
                                                // Get the updated product from the response
                                                const updatedProduct = res?.data?.data
                                                
                                                if (updatedProduct) {
                                                  // Update variants from the server response
                                                  const updatedVariants: ProductVariantData[] = Array.isArray(updatedProduct.productVariant)
                                                    ? updatedProduct.productVariant.map((v: any) => {
                                                        // Extract _id - use the helper function to ensure consistent extraction
                                                        // Only store _id if it's a valid ObjectId format (24 hex characters)
                                                        let variantId: string | undefined = undefined
                                                        if (v._id) {
                                                          const extractedId = getVariantIdString(v._id)
                                                          // Only store if it's a valid ObjectId format
                                                          if (extractedId && /^[0-9a-fA-F]{24}$/.test(extractedId)) {
                                                            variantId = extractedId
                                                          }
                                                        }
                                                        
                                                        // Handle both new imageUrls array and old imageUrl field for backward compatibility
                                                        const variantImageUrls = Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                                                          ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
                                                          : ((v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0) ? [v.imageUrl] : [])
                                                        
                                                        return {
                                                          _id: variantId,
                                                          imageUrls: variantImageUrls,
                                                          color: v.color  ,
                                                          size: v.size || '',
                  // Use null for invalid numeric values to indicate data issues
                  // Explicitly check for null, undefined, NaN, and negative values
                  quantity:
                    v.quantity != null &&
                    typeof v.quantity === "number" &&
                    !isNaN(v.quantity) &&
                    v.quantity >= 0
                      ? v.quantity
                      : null,
                  price:
                    v.price != null &&
                    typeof v.price === "number" &&
                    !isNaN(v.price) &&
                    v.price >= 0
                      ? v.price
                      : null,
                  discountPrice:
                    v.discountPrice != null &&
                    typeof v.discountPrice === "number" &&
                    !isNaN(v.discountPrice) &&
                    v.discountPrice >= 0
                      ? v.discountPrice
                      : null,
                                                          inStock: typeof v.inStock === 'boolean' ? v.inStock : true,
                                                        }
                                                      })
                                                    : []
                                                  
                                                  setProductVariants(updatedVariants)
                                                  productVariantsRef.current = updatedVariants
                                                  
                                                  // Update uploaded images to match remaining variants (flatten imageUrls arrays)
                                                  const imageMap = new Map<string, string>()
                                                  updatedVariants.forEach((v) => {
                                                    if (Array.isArray(v.imageUrls) && v.imageUrls.length > 0) {
                                                      v.imageUrls.forEach(url => {
                                                        if (url && !imageMap.has(url)) {
                                                          imageMap.set(url, v.color)
                                                        }
                                                      })
                                                    }
                                                  })
                                                  
                                                  const updatedImages: UploadedImageData[] = Array.from(imageMap.entries()).map(([url, color]) => ({
                                                    url,
                                                    color,
                                                  }))
                                                  setUploadedImages(updatedImages)
                                                  
                                                  // Build partial update object using ALL fields from server response
                                                  // The backend always returns the complete updated product object
                                                  const partialUpdate: Partial<ReduxProduct> = {}
                                                  
                                                  // Always use the updated product from the server response
                                                  if (updatedProduct._id != null) {
                                                    partialUpdate._id = updatedProduct._id?.toString() || ''
                                                  }
                                                  if (updatedProduct.adminId != null) {
                                                    partialUpdate.adminId = updatedProduct.adminId?.toString() || ''
                                                  }
                                                  if (updatedProduct.category != null) {
                                                    partialUpdate.category = updatedProduct.category
                                                  }
                                                  if (updatedProduct.createdAt != null) {
                                                    partialUpdate.createdAt = typeof updatedProduct.createdAt === 'string' 
                                                      ? updatedProduct.createdAt 
                                                      : new Date(updatedProduct.createdAt).toISOString()
                                                  }
                                                  if (updatedProduct.description != null) {
                                                    partialUpdate.description = updatedProduct.description
                                                  }
                                                  if (updatedProduct.material != null) {
                                                    partialUpdate.material = updatedProduct.material
                                                  }
                                                  if (updatedProduct.productOwner != null) {
                                                    partialUpdate.productOwner = updatedProduct.productOwner
                                                  }
                                                  // Always include productVariant from response (handles deletions)
                                                  if (Array.isArray(updatedProduct.productVariant)) {
                                                    partialUpdate.productVariant = updatedProduct.productVariant.map((v: any) => {
                                                      // Extract _id from server response - ensure it's stored in Redux
                                                      let variantId: string | undefined = undefined
                                                      if (v._id) {
                                                        const extractedId = getVariantIdString(v._id)
                                                        if (extractedId && /^[0-9a-fA-F]{24}$/.test(extractedId)) {
                                                          variantId = extractedId
                                                        }
                                                      }

                                                      // Validate numerics and convert invalid to 0 for Redux type compatibility
                                                      const quantity =
                                                        v.quantity != null &&
                                                        typeof v.quantity === 'number' &&
                                                        !isNaN(v.quantity) &&
                                                        v.quantity >= 0
                                                          ? v.quantity
                                                          : 0
                                                      const price =
                                                        v.price != null &&
                                                        typeof v.price === 'number' &&
                                                        !isNaN(v.price) &&
                                                        v.price >= 0
                                                          ? v.price
                                                          : 0
                                                      const discountPrice =
                                                        v.discountPrice != null &&
                                                        typeof v.discountPrice === 'number' &&
                                                        !isNaN(v.discountPrice) &&
                                                        v.discountPrice >= 0
                                                          ? v.discountPrice
                                                          : 0

                                                      // Handle both new imageUrls array and old imageUrl field for backward compatibility
                                                      const variantImageUrls = Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                                                        ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
                                                        : ((v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0) ? [v.imageUrl] : [])
                                                      
                                                      return {
                                                        _id: variantId, // Include _id so it's available when editing again
                                                        imageUrls: variantImageUrls,
                                                        color: v.color || '',
                                                        size: v.size || '',
                                                        quantity,
                                                        price,
                                                        discountPrice,
                                                        inStock: typeof v.inStock === 'boolean' ? v.inStock : true,
                                                        measurements: {
                                                          neck: typeof v.measurements?.neck === 'number' ? v.measurements.neck : undefined,
                                                          shoulder: typeof v.measurements?.shoulder === 'number' ? v.measurements.shoulder : undefined,
                                                          chest: typeof v.measurements?.chest === 'number' ? v.measurements.chest : undefined,
                                                          shortSleeve: typeof v.measurements?.shortSleeve === 'number' ? v.measurements.shortSleeve : undefined,
                                                          longSleeve: typeof v.measurements?.longSleeve === 'number' ? v.measurements.longSleeve : undefined,
                                                          roundSleeve: typeof v.measurements?.roundSleeve === 'number' ? v.measurements.roundSleeve : undefined,
                                                          tummy: typeof v.measurements?.tummy === 'number' ? v.measurements.tummy : undefined,
                                                          topLength: typeof v.measurements?.topLength === 'number' ? v.measurements.topLength : undefined,
                                                          waist: typeof v.measurements?.waist === 'number' ? v.measurements.waist : undefined,
                                                          laps: typeof v.measurements?.laps === 'number' ? v.measurements.laps : undefined,
                                                          kneelLength: typeof v.measurements?.kneelLength === 'number' ? v.measurements.kneelLength : undefined,
                                                          roundKneel: typeof v.measurements?.roundKneel === 'number' ? v.measurements.roundKneel : undefined,
                                                          trouserLength: typeof v.measurements?.trouserLength === 'number' ? v.measurements.trouserLength : undefined,
                                                          quarterLength: typeof v.measurements?.quarterLength === 'number' ? v.measurements.quarterLength : undefined,
                                                          ankle: typeof v.measurements?.ankle === 'number' ? v.measurements.ankle : undefined,
                                                        },
                                                      }
                                                    })
                                                  }
                                                  if (updatedProduct.isFeatured != null) {
                                                    partialUpdate.isFeatured = updatedProduct.isFeatured
                                                  }
                                                  if (updatedProduct.name != null) {
                                                    partialUpdate.name = updatedProduct.name
                                                  }
                                                  if (updatedProduct.slug != null) {
                                                    partialUpdate.slug = updatedProduct.slug
                                                  }
                                                  
                                                  // Update product in Redux store with the updated object from backend
                                                  const productId = updatedProduct._id?.toString() || product.productId || ''
                                                  if (productId) {
                                                    dispatch(adminActions.updateProduct({
                                                      _id: productId,
                                                      updated: partialUpdate
                                                    }))
                                                  }
                                                } else {
                                                  // Fallback: just remove from local state
                                                  setProductVariants(prev => prev.filter((_, i) => i !== index))
                                                }
                                                
                                                setDeletingVariantId(null)
                                              },
                                              requestConfig: {
                                                url: `/admin/delete-product-variant?productId=${product.productId}&variantId=${deleteVariantId}`,
                                                method: 'DELETE',
                                                successMessage: 'Variant deleted successfully',
                                              },
                                            })
                                          }
                                        }}
                                        disabled={productVariants.length <= 1 || deletingVariantId === getVariantIdString(productVariants[index]?._id) || isUploading}
                                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:text-gray-400 text-sm font-medium transition-colors"
                                        title={productVariants.length <= 1 ? 'At least one variant is required' : 'Delete variant'}
                                      >
                                        {deletingVariantId === getVariantIdString(productVariants[index]?._id) ? (
                                          <SewingMachineLoader size="sm" inline />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </button>
                                      </div>
                                      {openMeasurementsIndex === index && (
                                        <VariantMeasurementsEditor
                                          index={index}
                                          measurements={variant.measurements}
                                          errors={errors}
                                          minCountErrorKey={`variant_${index}_measurements_minCount`}
                                          onChange={(field, value) => {
                                            setProductVariants(prev => {
                                              const next = [...prev]
                                              const current = next[index]
                                              next[index] = {
                                                ...current,
                                                measurements: {
                                                  ...current.measurements,
                                                  [field]: value,
                                                },
                                              }
                                              productVariantsRef.current = next
                                              return next
                                            })
                                          }}
                                          clearError={(key) => {
                                            if (errors[key]) {
                                              setErrors(prev => {
                                                const next = { ...prev }
                                                delete next[key]
                                                return next
                                              })
                                            }
                                          }}
                                        />
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProduct}
            disabled={isUploading || isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <SewingMachineLoader size="sm" inline className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}




