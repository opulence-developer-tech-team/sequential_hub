'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Save, Upload, Trash2, Image as ImageIcon, Lock, Unlock } from 'lucide-react'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import { productSizes, clothingCategories } from '@/lib/resources'
import { useHttp } from '@/hooks/useHttp'
import Image from 'next/image'
import { ClothingCategory, ProductSize } from '@/types/enum'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { adminActions } from '@/store/redux/adminSlice'
import type { Product as ReduxProduct } from '@/store/redux/adminSlice'
import type { IAddProductUserInput } from '@/lib/server/products/interface'
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
}

interface UploadedImageData {
  url: string
  color: string
  preview?: string
}

/**
 * Product variant data structure matching IProductVariant interface
 * Each variant represents a unique combination of images, color, and size
 * with its own pricing, quantity, and stock status
 */
interface ProductVariantData {
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

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  product: ProductFormData
  onInputChange: (field: string, value: any) => void
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  onInputChange,
}: AddProductModalProps) {
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
  const [openMeasurementsIndex, setOpenMeasurementsIndex] = useState<number | null>(null)
  const [productOwnerLocked, setProductOwnerLocked] = useState(true)

  // Reset submitting state when useHttp's isLoading changes (handles both success and error)
  useEffect(() => {
    if (!isUploading && isSubmitting) {
      // Small delay to ensure state updates are processed
      const timer = setTimeout(() => {
        setIsSubmitting(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isUploading, isSubmitting])

  // Clear errors when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({})
    }
  }, [isOpen])

  // When images are deleted, remove variants that reference deleted images
  useEffect(() => {
    if (uploadedImages.length === 0) {
      setProductVariants([])
    } else {
      const uploadedImageUrls = new Set(uploadedImages.map(img => img.url))
      // Remove variants that reference images that no longer exist
      setProductVariants(prev => prev.filter(v => {
        // Check if variant has at least one image that still exists
        return Array.isArray(v.imageUrls) && v.imageUrls.length > 0 && 
               v.imageUrls.some(url => uploadedImageUrls.has(url))
      }))
      // Also clean up any variants that have empty imageUrls arrays
      setProductVariants(prev => prev.map(v => ({
        ...v,
        imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls.filter(url => uploadedImageUrls.has(url)) : []
      })).filter(v => v.imageUrls.length > 0))
    }
  }, [uploadedImages])

  // Early return after all hooks (Rules of Hooks compliance)
  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate name
    if (!product.name || !product.name.trim()) {
      newErrors.name = 'Product name is required'
    } else if (product.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters'
    }

    // Price and discount price validation removed - now handled per variant

    // Validate description
    if (!product.description || !product.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (product.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    // Validate category
    if (!product.category) {
      newErrors.category = 'Category is required'
    }

    // Validate material
    if (!product.material || !product.material.trim()) {
      newErrors.material = 'Material is required'
    } else if (product.material.trim().length < 2) {
      newErrors.material = 'Material must be at least 2 characters'
    } else if (product.material.trim().length > 200) {
      newErrors.material = 'Material must not exceed 200 characters'
    }

    // Validate product owner
    if (!product.productOwner || !product.productOwner.trim()) {
      newErrors.productOwner = 'Product owner is required'
    } else if (product.productOwner.trim().length < 1) {
      newErrors.productOwner = 'Product owner must be at least 1 character'
    } else if (product.productOwner.trim().length > 100) {
      newErrors.productOwner = 'Product owner must not exceed 100 characters'
    }

    // Validate images
    if (uploadedImages.length === 0) {
      newErrors.images = 'At least one image must be uploaded'
    }

    // Validate variants
    // Note: Images and variants are independent - you can have more images than variants,
    // and variants can share images. However, each variant must have at least one image.
    if (productVariants.length === 0) {
      newErrors.variants = 'At least one product variant must be created. Each variant can use one or more images.'
    } else {
      // Validate each variant
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
        // Color is derived from the selected image and should already exist
        if (!variant.color || variant.color.trim() === '') {
          newErrors[`variant_${index}_color`] = `Color is required for variant ${index + 1}`
        }
        if (!variant.size || variant.size.trim() === '') {
          newErrors[`variant_${index}_size`] = `Size is required for variant ${index + 1}`
        } else if (!Object.values(ProductSize).includes(variant.size as ProductSize)) {
          newErrors[`variant_${index}_size`] = `Invalid size selected for variant ${index + 1}`
        }
        // Validate price - must be a positive number (not null)
        if (variant.price === null || typeof variant.price !== 'number' || isNaN(variant.price) || variant.price <= 0) {
          newErrors[`variant_${index}_price`] = `Price must be a positive number for variant ${index + 1}`
        }
        
        // Validate discount price - must be a positive number and greater than regular price
        if (variant.discountPrice === null || typeof variant.discountPrice !== 'number' || isNaN(variant.discountPrice) || variant.discountPrice <= 0) {
          newErrors[`variant_${index}_discountPrice`] = `Discount price must be a positive number for variant ${index + 1}`
        } else if (variant.price !== null && variant.discountPrice <= variant.price) {
          newErrors[`variant_${index}_discountPrice`] = `Discount price must be greater than regular price for variant ${index + 1}`
        }
        
        // Validate quantity - must be a non-negative integer (not null)
        if (variant.quantity === null || typeof variant.quantity !== 'number' || isNaN(variant.quantity) || variant.quantity < 0 || !Number.isInteger(variant.quantity)) {
          newErrors[`variant_${index}_quantity`] = `Quantity must be a non-negative whole number for variant ${index + 1}`
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
    }

    setErrors(newErrors)
    
    // Scroll to first error if validation fails
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        ;(errorElement as HTMLElement).focus()
      }
      toast.error('Please fix the validation errors before submitting')
    }
    
    return Object.keys(newErrors).length === 0
  }

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
        onInputChange('images', [...uploadedImages.map(img => img.url), imageUrl])
        
        // Clear image error if any
        if (errors.images) {
          setErrors(prev => ({ ...prev, images: '' }))
        }
        
        // Variants will be regenerated by useEffect
        
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
        onInputChange('images', updatedImageUrls.length > 0 ? updatedImageUrls : ['https://via.placeholder.com/400x400?text=New+Product'])
        setDeletingImageIndex(null)
        
        // Variants will be regenerated by useEffect
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
    
    // Reset deleting state after timeout as fallback (in case of error)
    // useHttp handles errors and shows toast, but we need to reset the loading state
    setTimeout(() => {
      setDeletingImageIndex((currentIndex) => {
        if (currentIndex === index) {
          return null
        }
        return currentIndex
      })
    }, 5000) // 5 second timeout fallback
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

    // Custom validation
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Transform productVariants to match IAddProductUserInput interface
    // Note: slug is generated on the backend, so it's not included here
    // Ensure all required fields are properly typed and validated
    const payload: Omit<IAddProductUserInput, 'slug'> = {
      name: product.name.trim(),
      description: product.description.trim(),
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
        
        return {
          imageUrls, // Array of image URLs
          color: v.color.trim(),
          size: v.size as ProductSize, // Type assertion - validated in validateForm
          quantity, // Ensure non-negative integer
          price, // Ensure non-negative, 2 decimal places
          discountPrice, // Ensure non-negative, 2 decimal places
          inStock: Boolean(v.inStock),
          measurements: { ...v.measurements },
        }
      }),
      isFeatured: Boolean(product.featured),
      inStock: productVariants.some(v => v.inStock), // Product is in stock if any variant is in stock
    }

    sendHttpRequest({
      successRes: (res) => {
        // Get the added product from the response
        const addedProduct = res?.data?.data
        
        if (addedProduct) {
          // Transform the product to match Redux Product interface
          const reduxProduct: ReduxProduct = {
            _id: addedProduct._id?.toString() || '', // MongoDB ObjectId as string
            adminId: addedProduct.adminId?.toString() || '',
            category: addedProduct.category || '',
            createdAt: addedProduct.createdAt 
              ? (typeof addedProduct.createdAt === 'string' 
                  ? addedProduct.createdAt 
                  : new Date(addedProduct.createdAt).toISOString())
              : new Date().toISOString(),
            description: addedProduct.description || '',
            material: addedProduct.material || '',
            productOwner: addedProduct.productOwner || 'self',
            productVariant: Array.isArray(addedProduct.productVariant) 
              ? addedProduct.productVariant.map((v: any) => ({
                  imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length > 0
                    ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
                    : (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0 ? [v.imageUrl] : []), // Backward compatibility
                  color: v.color || '',
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
                  reservedQuantity:
                    v.reservedQuantity != null &&
                    typeof v.reservedQuantity === "number" &&
                    !isNaN(v.reservedQuantity) &&
                    v.reservedQuantity >= 0
                      ? v.reservedQuantity
                      : 0,
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
                  measurements: v.measurements || {},
                }))
              : [],
            isFeatured: addedProduct.isFeatured ?? false,
            name: addedProduct.name || '',
            slug: addedProduct.slug || '',
          }
          
          // Add product to Redux store
          dispatch(adminActions.addProduct(reduxProduct))
        }
        
        // Reset form state
        setUploadedImages([])
        setProductVariants([])
        setImagePreview(null)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsSubmitting(false)
        // Call parent's onSave to close modal
        onSave()
      },
      requestConfig: {
        url: '/admin/add-product',
        method: 'POST',
        body: payload,
        successMessage: 'Product added successfully',
      },
    })
  }

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
          <div>
            <h3 className="text-xl font-bold text-gray-900">Add New Product</h3>
            <p className="text-xs text-gray-500 mt-1">
              Create a product with rich variants and detailed body measurements.
            </p>
          </div>
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <form id="add-product-form" onSubmit={handleSaveProduct} noValidate>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => {
                          onInputChange('name', e.target.value)
                          if (errors.name) {
                            setErrors(prev => ({ ...prev, name: '' }))
                          }
                        }}
                        data-field="name"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter product name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description & Category */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        value={product.description}
                        onChange={(e) => {
                          onInputChange('description', e.target.value)
                          if (errors.description) {
                            setErrors(prev => ({ ...prev, description: '' }))
                          }
                        }}
                        data-field="description"
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter product description"
                      />
                      {errors.description && (
                        <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={product.category}
                        onChange={(e) => {
                          onInputChange('category', e.target.value)
                          if (errors.category) {
                            setErrors(prev => ({ ...prev, category: '' }))
                          }
                        }}
                        data-field="category"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 ${
                          errors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select category</option>
                        {clothingCategories.map(category => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Material */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material *
                    </label>
                    <input
                      type="text"
                      value={product.material || ''}
                      onChange={(e) => {
                        onInputChange('material', e.target.value)
                        if (errors.material) {
                          setErrors(prev => ({ ...prev, material: '' }))
                        }
                      }}
                      data-field="material"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black ${
                        errors.material ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Cotton, Polyester, Silk, Linen, etc."
                      maxLength={200}
                    />
                    {errors.material && (
                      <p className="mt-1 text-xs text-red-600">{errors.material}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Specify the material or fabric used (max 200 characters)
                    </p>
                  </div>
                </div>

                {/* Product Owner */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Owner *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={product.productOwner || 'self'}
                        onChange={(e) => {
                          onInputChange('productOwner', e.target.value)
                          if (errors.productOwner) {
                            setErrors(prev => ({ ...prev, productOwner: '' }))
                          }
                        }}
                        disabled={productOwnerLocked}
                        data-field="productOwner"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-black ${
                          errors.productOwner ? 'border-red-500' : 'border-gray-300'
                        } ${productOwnerLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
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
                    {errors.productOwner && (
                      <p className="mt-1 text-xs text-red-600">{errors.productOwner}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Default: "self". Click the lock icon to edit (max 100 characters)
                    </p>
                  </div>
                </div>

            {/* Image Upload Section */}
            <div data-field="images" className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images *
              </label>
              {errors.images && (
                <p className="mb-2 text-xs text-red-600">{errors.images}</p>
              )}
              
              {/* File Input */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50"
                >
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">Click to select image</span>
                </label>
              </div>

              {/* Image Preview Before Upload */}
              {imagePreview && selectedFile && (
                <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="relative w-full sm:w-32 aspect-[4/3] sm:h-32 flex-shrink-0">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 640px) 100vw, 128px"
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
                              <span className="animate-spin mr-2">⏳</span>
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
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Uploaded Images ({uploadedImages.length})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images can be used by multiple variants. Not all images need to be assigned to variants.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {uploadedImages.map((img, index) => (
                      <div
                        key={index}
                        className="group border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm"
                      >
                        <div className="relative aspect-square w-full bg-gray-50">
                          <Image
                            src={img.preview || img.url}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            unoptimized={img.url.includes('via.placeholder.com')}
                          />
                          {/* Delete button (overlay) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(index)}
                            disabled={deletingImageIndex !== null}
                            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-white/95 border border-gray-200 shadow-sm p-2 text-red-600 hover:text-red-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label="Delete image"
                            title="Delete image"
                          >
                            {deletingImageIndex === index ? (
                              <SewingMachineLoader size="sm" inline />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-gray-700">
                              Image {index + 1}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {img.url.includes('via.placeholder.com') ? 'placeholder' : 'uploaded'}
                            </span>
                          </div>
                        </div>
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
              <div data-field="variants" className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 sm:p-6 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Variants * ({productVariants.length} variant{productVariants.length !== 1 ? 's' : ''})
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Variants can share images. Each variant must select at least one image.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Add a new variant with first uploaded image as default
                      // Variants can share images, so we can always add a variant if images exist
                      if (uploadedImages.length > 0) {
                        const firstImage = uploadedImages[0]
                        setProductVariants(prev => [...prev, {
                          imageUrls: [firstImage.url], // Start with first image, user can add more
                          color: '#000000', // Default color - user can change it in the table
                          size: '',
                          quantity: 0,
                          price: 0,
                          discountPrice: 0,
                          inStock: false,
                          measurements: {},
                        }])
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                    disabled={uploadedImages.length === 0}
                    title={uploadedImages.length === 0 ? 'Upload at least one image first' : 'Add a new variant (variants can share images)'}
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
                    <p className="text-xs text-gray-500">Click "Add Variant" above to create your first product variant. Variants can use any of the uploaded images.</p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
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
                            <tr key={`variant-${index}`} className="hover:bg-gray-50 align-top">
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
                                                const newUrls = e.target.checked
                                                  ? [...currentUrls, img.url]
                                                  : currentUrls.filter(url => url !== img.url)
                                                
                                                const updatedVariants = [...productVariants]
                                                updatedVariants[index].imageUrls = newUrls
                                                // Color is now independent - no automatic update from images
                                                setProductVariants(updatedVariants)
                                                
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
                                              const updatedVariants = [...productVariants]
                                              updatedVariants[index].imageUrls = (updatedVariants[index].imageUrls || []).filter(url => url !== img.url)
                                              setProductVariants(updatedVariants)
                                            }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-xs shadow-md"
                                            aria-label="Remove image"
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
                                          const updatedVariants = [...productVariants]
                                          updatedVariants[index].color = e.target.value
                                          setProductVariants(updatedVariants)
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
                                        const updatedVariants = [...productVariants]
                                        updatedVariants[index].color = e.target.value
                                        setProductVariants(updatedVariants)
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
                                  const updatedVariants = [...productVariants]
                                  const selectedValue = e.target.value
                                  updatedVariants[index].size = (selectedValue === '' ? '' : selectedValue as ProductSize)
                                  setProductVariants(updatedVariants)
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
                                  const updatedVariants = [...productVariants]
                                  updatedVariants[index].price = newPrice
                                  setProductVariants(updatedVariants)
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
                                  const updatedVariants = [...productVariants]
                                  updatedVariants[index].discountPrice = newDiscountPrice
                                  setProductVariants(updatedVariants)
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
                                  const updatedVariants = [...productVariants]
                                  updatedVariants[index].quantity = newQuantity
                                  updatedVariants[index].inStock = newQuantity > 0 && updatedVariants[index].inStock
                                  setProductVariants(updatedVariants)
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
                                  const updatedVariants = [...productVariants]
                                  updatedVariants[index].inStock = e.target.checked
                                  setProductVariants(updatedVariants)
                                }}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap align-top">
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
                                    onClick={() => {
                                      setProductVariants(prev => prev.filter((_, i) => i !== index))
                                    }}
                                    disabled={productVariants.length <= 1}
                                    className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:text-gray-400 text-sm font-medium transition-colors"
                                    title={productVariants.length <= 1 ? 'At least one variant is required' : 'Delete variant'}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                <p className="mt-2 text-xs text-gray-500">
                  Configure image selection (variants can share images), color (from first selected image), size, price, discount price, quantity, and stock status for each variant.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-6 mt-4">
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
            </div>
            </form>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-3 px-6 pt-4 pb-4 border-t border-gray-200 bg-white sticky bottom-0 supports-[bottom:env(safe-area-inset-bottom)]:bottom-[env(safe-area-inset-bottom)] supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-product-form"
            disabled={isSubmitting || isUploading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <SewingMachineLoader size="sm" inline className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}




