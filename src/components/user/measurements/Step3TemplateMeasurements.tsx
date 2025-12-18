import { motion } from 'framer-motion'
import { Ruler, Info, Upload, X, AlertCircle } from 'lucide-react'
import { MeasurementData } from './types'
import { useRef, useState, useEffect } from 'react'
import { useHttp } from '@/hooks/useHttp'
import { toast } from 'sonner'
import Image from 'next/image'

interface Step3TemplateMeasurementsProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: any) => void
  onClearError?: (errorKey: string) => void
}

export default function Step3TemplateMeasurements({ 
  formData, 
  errors, 
  onInputChange,
  onClearError
}: Step3TemplateMeasurementsProps) {
  const { sendHttpRequest, isLoading: isUploading, error: httpError } = useHttp()
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploadingImages, setUploadingImages] = useState<Record<string, Record<string | number, boolean>>>({})
  const [deletingImages, setDeletingImages] = useState<Record<string, Record<number, boolean>>>({})
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0)
  const errorInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const hasSwitchedToErrorTab = useRef(false)
  const [clearedErrors, setClearedErrors] = useState<Set<string>>(new Set())
  // Preview state for images before upload
  const [imagePreviews, setImagePreviews] = useState<Record<string, { file: File; preview: string } | null>>({})
  // Track active uploads to clear state when request completes (success or error)
  type ActiveUpload = { templateId: string; key: string | number }
  const activeUploadRef = useRef<ActiveUpload | null>(null)
  const previousIsUploadingRef = useRef<boolean>(false)

  if (!formData.selectedTemplates || formData.selectedTemplates.length === 0) {
    return (
      <motion.div
        key="step3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-600">Please select at least one measurement template first.</p>
        </div>
      </motion.div>
    )
  }

  const activeTemplate = formData.selectedTemplates[activeTemplateIndex]
  const activeMeasurements = formData.measurements[activeTemplate._id] || {}
  const activeTemplateImages = formData.sampleImageUrls[activeTemplate._id] || []
  const activePreview = imagePreviews[activeTemplate._id]

  // Clear preview when switching templates
  useEffect(() => {
    // Clean up previews for other templates when switching
    setImagePreviews(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(templateId => {
        if (templateId !== activeTemplate._id && updated[templateId]) {
          delete updated[templateId]
        }
      })
      return updated
    })
  }, [activeTemplate._id])

  // Find which template has errors (excluding cleared errors)
  const getTemplateWithErrors = (): number | null => {
    if (!formData.selectedTemplates || Object.keys(errors).length === 0) {
      return null
    }

    for (let i = 0; i < formData.selectedTemplates.length; i++) {
      const template = formData.selectedTemplates[i]
      // Check for quantity errors
      const quantityErrorKey = `quantity.${template._id}`
      const hasQuantityError = Boolean(errors[quantityErrorKey] && !clearedErrors.has(quantityErrorKey))
      // Check for measurement field errors
      const hasMeasurementError = template.fields.some(field => {
        const errorKey = `measurements.${template._id}.${field.name}`
        return errors[errorKey] && !clearedErrors.has(errorKey)
      })
      // Check for image errors
      const imageErrorKey = `images.${template._id}`
      const hasImageError = Boolean(errors[imageErrorKey] && !clearedErrors.has(imageErrorKey))
      
      if (hasQuantityError || hasMeasurementError || hasImageError) {
        return i
      }
    }
    return null
  }


  // Monitor upload completion to clear uploading state on error
  // This ensures the upload button is re-enabled even if the request fails
  useEffect(() => {
    // When isLoading transitions from true to false, and we have an active upload,
    // clear the uploading state (this handles error cases where successRes wasn't called)
    if (previousIsUploadingRef.current && !isUploading && activeUploadRef.current) {
      const { templateId, key } = activeUploadRef.current
      
      // Clear the uploading state for the failed upload
      setUploadingImages(prev => {
        const updated = { ...prev }
        if (updated[templateId]) {
          const templateUploads = { ...updated[templateId] }
          delete templateUploads[key]
          if (Object.keys(templateUploads).length === 0) {
            delete updated[templateId]
          } else {
            updated[templateId] = templateUploads
          }
        }
        return updated
      })
      
      // Reset active upload ref
      activeUploadRef.current = null
    }
    
    // Update previous state
    previousIsUploadingRef.current = isUploading
  }, [isUploading])

  // Reset cleared errors when new errors appear (validation runs again)
  useEffect(() => {
    // If there are new errors that weren't in clearedErrors, reset the cleared set
    const currentErrorKeys = Object.keys(errors).filter(key => 
      key.startsWith('measurements.')
    )
    if (currentErrorKeys.length > 0) {
      // Only keep cleared errors that still exist in the errors object
      setClearedErrors(prev => {
        const newSet = new Set<string>()
        prev.forEach(key => {
          if (errors[key]) {
            newSet.add(key)
          }
        })
        return newSet
      })
    } else {
      // No errors, clear the clearedErrors set
      setClearedErrors(new Set())
    }
  }, [errors])

  // Switch to tab with errors and scroll to first error input
  useEffect(() => {
    const errorTemplateIndex = getTemplateWithErrors()
    
    if (errorTemplateIndex !== null && errorTemplateIndex !== activeTemplateIndex) {
      setActiveTemplateIndex(errorTemplateIndex)
      hasSwitchedToErrorTab.current = true
    }

    // Scroll to first error input or image section after tab switch
    if (errorTemplateIndex !== null && hasSwitchedToErrorTab.current) {
      const errorTemplate = formData.selectedTemplates[errorTemplateIndex]
      
      // Check for image error first (priority)
      const imageErrorKey = `images.${errorTemplate._id}`
      const hasImageError = errors[imageErrorKey] && !clearedErrors.has(imageErrorKey)
      
      if (hasImageError) {
        // Scroll to image upload section
        requestAnimationFrame(() => {
          // Find the image upload section by looking for the data attribute
          const imageSection = document.querySelector(`[data-template-id="${errorTemplate._id}"] .image-upload-section`)
          if (imageSection) {
            imageSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
          } else {
            // Fallback: scroll to the error message itself
            const errorElement = document.querySelector(`[data-template-id="${errorTemplate._id}"] [data-image-error]`)
            if (errorElement) {
              errorElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
            }
          }
        })
      } else {
        // Check for measurement field errors
        const firstErrorField = errorTemplate.fields.find(field => {
          const errorKey = `measurements.${errorTemplate._id}.${field.name}`
          return errors[errorKey] && !clearedErrors.has(errorKey)
        })

        if (firstErrorField) {
          const errorKey = `measurements.${errorTemplate._id}.${firstErrorField.name}`
          const errorInput = errorInputRefs.current[errorKey]
          
          if (errorInput) {
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
              errorInput.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
              errorInput.focus()
            })
          }
        }
      }
      hasSwitchedToErrorTab.current = false
    }
  }, [errors, formData.selectedTemplates, activeTemplateIndex, clearedErrors])

  // Check if a template has errors (excluding cleared errors)
  const templateHasErrors = (templateId: string): boolean => {
    const template = formData.selectedTemplates.find(t => t._id === templateId)
    if (!template) return false
    
    // Check for quantity errors
    const quantityErrorKey = `quantity.${templateId}`
    const hasQuantityError = Boolean(errors[quantityErrorKey] && !clearedErrors.has(quantityErrorKey))
    
    // Check for measurement field errors
    const hasMeasurementError = template.fields.some(field => {
      const errorKey = `measurements.${templateId}.${field.name}`
      return Boolean(errors[errorKey] && !clearedErrors.has(errorKey))
    })
    
    // Check for image errors
    const imageErrorKey = `images.${templateId}`
    const hasImageError = Boolean(errors[imageErrorKey] && !clearedErrors.has(imageErrorKey))
    
    return hasQuantityError || hasMeasurementError || hasImageError
  }

  // Check if a template is complete (quantity set, all measurements filled and images uploaded)
  const isTemplateComplete = (templateId: string): boolean => {
    const template = formData.selectedTemplates.find(t => t._id === templateId)
    if (!template) return false
    
    const templateMeasurements = formData.measurements[templateId] || {}
    const templateImages = formData.sampleImageUrls[templateId] || []
    const quantity = formData.quantities[templateId]
    
    // Check if quantity is valid
    const hasValidQuantity = Boolean(quantity && quantity >= 1 && quantity <= 10000)
    
    // Check if all measurement fields are filled
    const allFieldsFilled = template.fields.every(field => {
      const value = templateMeasurements[field.name]
      return value && value > 0
    })
    
    // Check if at least one image is uploaded
    const hasImages = templateImages.length > 0
    
    return hasValidQuantity && allFieldsFilled && hasImages
  }

  const handleMeasurementChange = (fieldName: string, value: number) => {
    const updatedMeasurements = {
      ...formData.measurements,
      [activeTemplate._id]: {
        ...activeMeasurements,
      [fieldName]: value
      }
    }
    onInputChange('measurements', updatedMeasurements)
    
    // Clear error for this field when user starts typing
    const errorKey = `measurements.${activeTemplate._id}.${fieldName}`
    if (errors[errorKey]) {
      setClearedErrors(prev => new Set(prev).add(errorKey))
      if (onClearError) {
        onClearError(errorKey)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, templateId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input
    if (fileInputRefs.current[templateId]) {
      fileInputRefs.current[templateId]!.value = ''
    }

    // Check current image count
    const currentImages = formData.sampleImageUrls[templateId] || []
    const remainingSlots = 2 - currentImages.length

    if (remainingSlots <= 0) {
      toast.error('Maximum 2 images allowed per template')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select only image files')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews(prev => ({
        ...prev,
        [templateId]: {
          file,
          preview: reader.result as string
        }
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = async (templateId: string) => {
    const previewData = imagePreviews[templateId]
    if (!previewData) return

    const { file } = previewData

    // Check current image count
    const currentImages = formData.sampleImageUrls[templateId] || []
    if (currentImages.length >= 2) {
      toast.error('Maximum 2 images allowed per template')
      return
    }

    // Upload the image
    await uploadSingleImage(file, templateId)

    // Clear preview after successful upload
    setImagePreviews(prev => ({
      ...prev,
      [templateId]: null
    }))
  }

  const handleCancelPreview = (templateId: string) => {
    setImagePreviews(prev => ({
      ...prev,
      [templateId]: null
    }))
    if (fileInputRefs.current[templateId]) {
      fileInputRefs.current[templateId]!.value = ''
    }
  }

  const uploadSingleImage = async (file: File, templateId: string, replaceIndex?: number) => {
    const formDataObj = new FormData()
    formDataObj.append('image', file)

    const uploadKey = replaceIndex ?? 'new'

    // Set uploading state for this specific image
    setUploadingImages(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || {}),
        [uploadKey]: true
      }
    }))

    // Track this upload so we can clear state if it fails
    activeUploadRef.current = { templateId, key: uploadKey }

    try {
      const imageUrl = await new Promise<string>((resolve, reject) => {
    sendHttpRequest({
      requestConfig: {
        method: 'POST',
            url: '/guest/upload-image',
        body: formDataObj,
      },
      successRes: (res: any) => {
        if (res?.data?.data?.imageUrl) {
              resolve(res.data.data.imageUrl)
            } else {
              reject(new Error('No image URL returned'))
        }
      },
    })
      })

      // Clear active upload ref on success (state will be cleared in finally)
      activeUploadRef.current = null

      const currentImages = formData.sampleImageUrls[templateId] || []
      let updatedImages: string[]

      if (replaceIndex !== undefined && replaceIndex >= 0 && replaceIndex < currentImages.length) {
        // Replace existing image
        updatedImages = [...currentImages]
        updatedImages[replaceIndex] = imageUrl
      } else {
        // Add new image
        updatedImages = [...currentImages, imageUrl]
      }

      onInputChange('sampleImageUrls', {
        ...formData.sampleImageUrls,
        [templateId]: updatedImages
      })

      // Clear image error for this template when image is successfully uploaded
      if (onClearError && updatedImages.length > 0) {
        onClearError(`images.${templateId}`)
      } 

      toast.success(replaceIndex !== undefined ? 'Image replaced successfully' : 'Image uploaded successfully')
      
      // Clear uploading state on success
      setUploadingImages(prev => {
        const updated = { ...prev }
        if (updated[templateId]) {
          const templateUploads = { ...updated[templateId] }
          delete templateUploads[uploadKey]
          if (Object.keys(templateUploads).length === 0) {
            delete updated[templateId]
          } else {
            updated[templateId] = templateUploads
          }
        }
        return updated
      })
      
      // Clear active upload ref on success
      if (activeUploadRef.current) {
        const currentUpload = activeUploadRef.current as ActiveUpload
        if (currentUpload.templateId === templateId && currentUpload.key === uploadKey) {
          activeUploadRef.current = null
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      // Error toast is already shown by useHttp
      // The uploading state will be cleared by the useEffect monitoring isUploading
      // when it detects the transition from loading to not loading
    }
  }


  const handleRemoveImage = async (templateId: string, imageIndex: number) => {
    const currentImages = formData.sampleImageUrls[templateId] || []
    const imageUrlToDelete = currentImages[imageIndex]
    
    if (!imageUrlToDelete) return

    // Set deleting state
    setDeletingImages(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || {}),
        [imageIndex]: true
      }
    }))

    // Delete from Cloudinary via API
    try {
      await new Promise<void>((resolve, reject) => {
        sendHttpRequest({
          requestConfig: {
            method: 'DELETE',
            url: '/guest/upload-image',
            body: { imageUrl: imageUrlToDelete },
          },
          successRes: () => {
            resolve()
          },
        })
      })

      // Remove from local state
      const updatedImages = currentImages.filter((_, index) => index !== imageIndex)
      const updatedImageUrls = {
        ...formData.sampleImageUrls,
        [templateId]: updatedImages
      }
      
      // Remove template key if no images left
      if (updatedImages.length === 0) {
        delete updatedImageUrls[templateId]
      }
      
      onInputChange('sampleImageUrls', updatedImageUrls)
      
      // Clear image error if there are still images remaining, otherwise keep the error
      if (onClearError && updatedImages.length > 0) {
        onClearError(`images.${templateId}`)
      }
      
      toast.success('Image deleted successfully')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image. Please try again.')
    } finally {
      // Clear deleting state
      setDeletingImages(prev => {
        const updated = { ...prev }
        if (updated[templateId]) {
          const templateDeletions = { ...updated[templateId] }
          delete templateDeletions[imageIndex]
          if (Object.keys(templateDeletions).length === 0) {
            delete updated[templateId]
          } else {
            updated[templateId] = templateDeletions
          }
        }
        return updated
      })
    }
  }

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <Ruler className="h-5 w-5 text-primary-600" />
          </div>
          Enter Measurements
        </h2>
        <p className="text-gray-600 ml-13">
          Enter your measurements in inches for each selected template. All templates must be completed before proceeding.
        </p>
        {/* Show summary of completion status if multiple templates */}
        {formData.selectedTemplates.length > 1 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Progress:</span> You have {formData.selectedTemplates.length} template{formData.selectedTemplates.length !== 1 ? 's' : ''} selected. 
              Please complete measurements and upload images for all templates.
            </p>
          </div>
        )}
      </div>

      {/* Template Tabs */}
      {formData.selectedTemplates.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {formData.selectedTemplates.map((template, index) => {
            const hasErrors = templateHasErrors(template._id)
            const isComplete = isTemplateComplete(template._id)
            return (
              <button
                key={template._id}
                type="button"
                onClick={() => {
                  setActiveTemplateIndex(index)
                  hasSwitchedToErrorTab.current = false
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTemplateIndex === index
                    ? 'bg-primary-600 text-white shadow-md'
                    : hasErrors
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
                    : isComplete
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {template.title}
                {hasErrors && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {!hasErrors && isComplete && (
                  <span className="text-green-600 font-bold">✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
      
      <div className="space-y-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTemplate.title}
              </h3>
              <p className="text-sm text-gray-600">
                {activeTemplate.fields.length} measurement field{activeTemplate.fields.length !== 1 ? 's' : ''} required
              </p>
            </div>
            {formData.selectedTemplates.length > 1 && (
              <div className="text-sm text-gray-500">
                Template {activeTemplateIndex + 1} of {formData.selectedTemplates.length}
              </div>
            )}
          </div>
          
          {/* Quantity Input */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              step="1"
              required
              value={formData.quantities[activeTemplate._id] || 1}
              onChange={(e) => {
                const quantity = parseInt(e.target.value) || 1
                onInputChange('quantities', {
                  ...formData.quantities,
                  [activeTemplate._id]: Math.max(1, Math.min(10000, quantity))
                })
              }}
              className="w-full max-w-xs px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many {activeTemplate.title} do you want? (1-10,000)
            </p>
            {/* Quantity Error Display */}
            {errors[`quantity.${activeTemplate._id}`] && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {errors[`quantity.${activeTemplate._id}`]}
                </p>
              </div>
            )}
          </div>
          {/* Show completion status for this template */}
          {(() => {
            const templateMeasurements = formData.measurements[activeTemplate._id] || {}
            const templateImages = formData.sampleImageUrls[activeTemplate._id] || []
            const quantity = formData.quantities[activeTemplate._id]
            const hasValidQuantity = Boolean(quantity && quantity >= 1 && quantity <= 10000)
            const allFieldsFilled = activeTemplate.fields.every(field => {
              const value = templateMeasurements[field.name]
              return value && value > 0
            })
            const hasImages = templateImages.length > 0
            const isComplete = hasValidQuantity && allFieldsFilled && hasImages
            
            if (isComplete) {
              return (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center">
                    <span className="mr-2">✓</span>
                    This template is complete
                  </p>
                </div>
              )
            } else {
              const missingItems: string[] = []
              if (!hasValidQuantity) {
                missingItems.push('quantity')
              }
              if (!allFieldsFilled) {
                missingItems.push('measurements')
              }
              if (!hasImages) {
                missingItems.push('images')
              }
              return (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <span className="font-semibold">Incomplete:</span> Please complete {missingItems.join(', ')} for this template
                  </p>
                </div>
              )
            }
          })()}
        </div>

        {activeTemplate.fields.map((field) => {
          const errorKey = `measurements.${activeTemplate._id}.${field.name}`
          // Don't show error if it's been cleared by user typing
          const hasError = !!errors[errorKey] && !clearedErrors.has(errorKey)
          
          return (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {field.name} (inches) <span className="text-red-500">*</span>
            </label>
            <input
                ref={(el) => {
                  if (el) {
                    errorInputRefs.current[errorKey] = el
                  }
                }}
              type="number"
              step="0.1"
              min="0"
              required
                value={activeMeasurements[field.name] || ''}
              onChange={(e) => handleMeasurementChange(field.name, parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-900 bg-white ${
                  hasError
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 hover:border-gray-400 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="0.0"
                aria-invalid={hasError}
                aria-describedby={hasError ? `error-${errorKey}` : undefined}
              />
              {hasError && (
                <p 
                  id={`error-${errorKey}`}
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                >
                  <Info className="h-4 w-4 mr-1 flex-shrink-0" />
                  {errors[errorKey]}
              </p>
            )}
          </div>
          )
        })}
      </div>

      {/* Required Image Upload for current template */}
      <div className="mt-8 pt-8 border-t border-gray-200 image-upload-section" data-template-id={activeTemplate._id}>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Sample Images for {activeTemplate.title} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Upload 1-2 sample images of the type of clothing you want for this template. Preview your image before uploading.
        </p>
        
        {/* Image validation error */}
        {errors[`images.${activeTemplate._id}`] && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" data-image-error>
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {errors[`images.${activeTemplate._id}`]}
            </p>
          </div>
        )}
        
        {/* Uploaded Images */}
        {activeTemplateImages.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Uploaded ({activeTemplateImages.length}/2 image{activeTemplateImages.length !== 1 ? 's' : ''})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeTemplateImages.map((imageUrl, index) => {
                const isUploading = uploadingImages[activeTemplate._id]?.[index] === true
                const isDeleting = deletingImages[activeTemplate._id]?.[index] === true
                return (
                  <div key={index} className="relative group">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      {isUploading ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            <p className="text-xs text-gray-600">Uploading...</p>
                          </div>
                        </div>
                      ) : isDeleting ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-50">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                            <p className="text-xs text-red-600">Deleting...</p>
                          </div>
                        </div>
                      ) : (
              <Image
                          src={imageUrl}
                          alt={`Sample ${index + 1}`}
                fill
                className="object-cover"
              />
                      )}
                    </div>
                    {/* Always visible delete button in top-right corner */}
                    {!isUploading && !isDeleting && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(activeTemplate._id, index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-lg px-3 py-1.5 hover:bg-red-600 transition-all shadow-lg z-10 flex items-center gap-1.5 text-sm font-medium"
                        aria-label={`Delete image ${index + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Image Preview Before Upload */}
        {imagePreviews[activeTemplate._id] && (
          <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={imagePreviews[activeTemplate._id]!.preview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-lg"
                  sizes="128px"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {imagePreviews[activeTemplate._id]!.file.name}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {(() => {
                    const fileSizeBytes = imagePreviews[activeTemplate._id]!.file.size
                    const fileSizeMB = fileSizeBytes / 1024 / 1024
                    const fileSizeKB = fileSizeBytes / 1024
                    return fileSizeMB >= 1 
                      ? `${fileSizeMB.toFixed(2)} MB`
                      : `${fileSizeKB.toFixed(2)} KB`
                  })()}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUploadImage(activeTemplate._id)}
                    disabled={uploadingImages[activeTemplate._id]?.['new'] === true}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploadingImages[activeTemplate._id]?.['new'] === true ? (
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
                    onClick={() => handleCancelPreview(activeTemplate._id)}
                    disabled={uploadingImages[activeTemplate._id]?.['new'] === true}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
                    Cancel
            </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Input */}
        {activeTemplateImages.length < 2 && !imagePreviews[activeTemplate._id] && (
          <div
            onClick={() => {
              fileInputRefs.current[activeTemplate._id]?.click()
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              activeTemplateImages.length === 0
                ? 'border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100'
                : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            <Upload className={`h-8 w-8 mx-auto mb-2 ${activeTemplateImages.length === 0 ? 'text-red-400' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${activeTemplateImages.length === 0 ? 'text-red-700' : 'text-gray-600'}`}>
              {activeTemplateImages.length === 0 
                ? 'Click to select sample image (Required)' 
                : `Click to select another image (${2 - activeTemplateImages.length} remaining)`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Preview your image before uploading (Max 2 images)
            </p>
            <input
              ref={(el) => {
                if (el) {
                  fileInputRefs.current[activeTemplate._id] = el
                }
              }}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, activeTemplate._id)}
              className="hidden"
            />
          </div>
        )}
        
        {activeTemplateImages.length >= 2 && (
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-700 font-medium">
              ✓ Maximum images uploaded (2/2)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
