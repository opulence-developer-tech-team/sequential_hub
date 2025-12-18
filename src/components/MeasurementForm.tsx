'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MeasurementData, initialFormData, MeasurementTemplate } from './user/measurements/types'
import FormHeader from './user/measurements/FormHeader'
import ProgressBar from './user/measurements/ProgressBar'
import Step1PersonalInfo from './user/measurements/Step1PersonalInfo'
import Step2TemplateSelection from './user/measurements/Step2TemplateSelection'
import Step3TemplateMeasurements from './user/measurements/Step3TemplateMeasurements'
import Step4Review from './user/measurements/Step4Review'
import FormNavigation from './user/measurements/FormNavigation'
import SuccessMessage from './user/measurements/SuccessMessage'
import GuestAccountModal from './user/measurements/GuestAccountModal'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useHttp } from '@/hooks/useHttp'
import { setUserData } from '@/store/redux/user/user-data-slice'

export default function MeasurementForm() {
  const dispatch = useAppDispatch()
  const { sendHttpRequest: fetchUserRequest, isLoading: isFetchingUser, error: fetchUserError } = useHttp()
  const { sendHttpRequest: fetchTemplatesRequest, isLoading: isLoadingTemplates } = useHttp()
  const { sendHttpRequest: submitRequest, isLoading: isSubmittingRequest, error: submitError } = useHttp()
  const userData = useAppSelector((state) => state.userData.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const hasCheckedAuth = useAppSelector((state) => state.auth.hasCheckedAuth)
  const hasFetchedUserData = useAppSelector((state) => state.userData.hasFetchedUserData)

  const [formData, setFormData] = useState<MeasurementData>(initialFormData)
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showGuestAccountModal, setShowGuestAccountModal] = useState(false)
  const [accountCreationData, setAccountCreationData] = useState<{ password?: string; confirmPassword?: string }>({})
  const [submittedOrderNumbers, setSubmittedOrderNumbers] = useState<string[]>([])
  const locationFees = useAppSelector((state) => state.shippingSettings.locationFees)
  const freeShippingThreshold = useAppSelector((state) => state.shippingSettings.freeShippingThreshold)
  const formContainerRef = useRef<HTMLDivElement>(null)

  // Location fees and free shipping threshold are now fetched from Redux state (initialized in guest layout)

  // Fetch templates only when step 2 (template selection) is active
  useEffect(() => {
    if (currentStep === 2 && templates.length === 0) {
      fetchTemplatesRequest({
        requestConfig: {
          method: 'GET',
          url: '/guest/fetch-mesurement-template',
        },
        successRes: (response: any) => {
          if (response?.data?.data) {
            setTemplates(response.data.data)
          }
        },
      })
    }
  }, [currentStep, templates.length, fetchTemplatesRequest])

  // Function to fetch user data (can be called for retry)
  const handleFetchUser = useCallback(() => {
    if (isAuthenticated === true && hasCheckedAuth) {
      fetchUserRequest({
        requestConfig: {
          method: 'GET',
          url: '/user/fetch-user-details',
        },
        successRes: (userResponse: any) => {
          if (userResponse?.data?.data) {
            dispatch(setUserData(userResponse.data.data))
          }
        },
      })
    }
  }, [isAuthenticated, hasCheckedAuth, fetchUserRequest, dispatch])

  // Fetch user data if authenticated and not already fetched
  useEffect(() => {
    if (isAuthenticated === true && !userData && hasCheckedAuth && !hasFetchedUserData) {
      handleFetchUser()
    }
  }, [isAuthenticated, userData, hasCheckedAuth, hasFetchedUserData, handleFetchUser])

  // Pre-fill form data for authenticated users
  useEffect(() => {
    if (isAuthenticated && userData) {
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        address: userData.street || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        country: userData.country || 'Nigeria',
      }))
    }
  }, [isAuthenticated, userData])

  // Validation functions
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    // First name and last name are always required
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    // Only validate personal info for guest users (authenticated users' info comes from their account)
    if (isAuthenticated !== true) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required'
      } else {
        // Validate E.164 format: + followed by 10-15 digits
        const phoneRegex = /^\+[1-9]\d{9,14}$/
        if (!phoneRegex.test(formData.phone.trim())) {
          newErrors.phone = 'Please enter a valid phone number with country code (e.g., +1234567890)'
        }
      }
      
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required'
      }
      
      if (!formData.city.trim()) {
        newErrors.city = 'City is required'
      }
      
      if (!formData.state.trim()) {
        newErrors.state = 'State is required'
      }
      
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = 'ZIP code is required'
      }
      
          if (!formData.country.trim()) {
            newErrors.country = 'Country is required'
          }
    }
    
    // Only validate shippingLocation if shipping is not free
    // For measurement orders, since price is set later, we can't determine if shipping will be free
    // So we'll always require it (since we can't know if it will be free)
    // However, if we have a free shipping threshold and can determine it will be free, we skip validation
    // For now, we'll always require it for measurement orders since price is unknown
    if (!formData.shippingLocation.trim()) {
      newErrors.shippingLocation = 'Shipping location is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.selectedTemplates || formData.selectedTemplates.length === 0) {
      newErrors.templateId = 'Please select at least one measurement template'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.selectedTemplates || formData.selectedTemplates.length === 0) {
      newErrors.template = 'Please select at least one template first'
      setErrors(newErrors)
      return false
    }

    // Track incomplete templates for better error messaging
    const incompleteTemplates: string[] = []

    // Validate measurements, quantities, and images for each selected template
    formData.selectedTemplates.forEach(template => {
      const templateMeasurements = formData.measurements[template._id] || {}
      let templateHasErrors = false
      
      // Validate quantity
      const quantity = formData.quantities[template._id]
      if (!quantity || quantity < 1 || quantity > 10000) {
        newErrors[`quantity.${template._id}`] = `Quantity must be between 1 and 10,000 for ${template.title}`
        templateHasErrors = true
      }
      
      // Validate measurements
      template.fields.forEach(field => {
        const value = templateMeasurements[field.name]
        if (!value || value <= 0) {
          newErrors[`measurements.${template._id}.${field.name}`] = `${field.name} measurement is required for ${template.title}`
          templateHasErrors = true
        }
      })
      
      // Validate images (required: at least 1, max 2)
      const templateImages = formData.sampleImageUrls[template._id] || []
      if (templateImages.length === 0) {
        newErrors[`images.${template._id}`] = `At least 1 sample image is required for ${template.title}`
        templateHasErrors = true
      } else if (templateImages.length > 2) {
        newErrors[`images.${template._id}`] = `Maximum 2 images allowed for ${template.title}`
        templateHasErrors = true
      }

      if (templateHasErrors) {
        incompleteTemplates.push(template.title)
      }
    })
    
    setErrors(newErrors)
    
    // If there are errors, show a helpful message
    if (Object.keys(newErrors).length > 0 && incompleteTemplates.length > 0) {
      // The error will be displayed in the Step3TemplateMeasurements component
      // which will automatically switch to the first template with errors
    }
    
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof MeasurementData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClearError = (errorKey: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[errorKey]
      return newErrors
    })
  }

  const handleNext = () => {
    let isValid = false
    let validationErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 1:
        // Store errors before validation to use for scrolling
        const step1Errors: Record<string, string> = {}
        if (!formData.firstName.trim()) {
          step1Errors.firstName = 'First name is required'
        }
        if (!formData.lastName.trim()) {
          step1Errors.lastName = 'Last name is required'
        }
        // Only validate personal info fields (other than shippingLocation) for guest users;
        // authenticated users' core info is managed in their account.
        if (isAuthenticated !== true) {
          if (!formData.email.trim()) {
            step1Errors.email = 'Email address is required'
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            step1Errors.email = 'Please enter a valid email address'
          }
          if (!formData.phone.trim()) {
            step1Errors.phone = 'Phone number is required'
          } else {
            const phoneRegex = /^\+[1-9]\d{9,14}$/
            if (!phoneRegex.test(formData.phone.trim())) {
              step1Errors.phone = 'Please enter a valid phone number with country code (e.g., +1234567890)'
            }
          }
          if (!formData.address.trim()) {
            step1Errors.address = 'Address is required'
          }
          if (!formData.city.trim()) {
            step1Errors.city = 'City is required'
          }
          if (!formData.state.trim()) {
            step1Errors.state = 'State is required'
          }
          if (!formData.zipCode.trim()) {
            step1Errors.zipCode = 'ZIP code is required'
          }
          if (!formData.country.trim()) {
            step1Errors.country = 'Country is required'
          }
        }
        // Shipping location is always required for measurement orders, regardless of auth status
        if (!formData.shippingLocation.trim()) {
          step1Errors.shippingLocation = 'Shipping location is required'
        }
        validationErrors = step1Errors
        isValid = Object.keys(step1Errors).length === 0
        setErrors(step1Errors)
        break
      case 2:
        isValid = validateStep2()
        break
      case 3:
        isValid = validateStep3()
        break
      default:
        isValid = true
    }
    
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1)
      setErrors({})
      
      // Scroll to top of form after step change
      requestAnimationFrame(() => {
        if (formContainerRef.current) {
          formContainerRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        } else {
          // Fallback: scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      })
    } else if (!isValid && currentStep === 1) {
      // Scroll to first error field on step 1 using the validationErrors we just computed
      // Use double requestAnimationFrame to ensure DOM has updated with error states
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const errorFields = [
            'firstName',
            'lastName',
            'email',
            'phone',
            'address',
            'city',
            'state',
            'zipCode',
            'country',
            'shippingLocation',
          ]
          for (const field of errorFields) {
            if (validationErrors[field]) {
              const inputElement = document.querySelector(`[data-field="${field}"]`) as HTMLElement
              if (inputElement) {
                const offset = 100 // Offset from top
                const elementPosition = inputElement.getBoundingClientRect().top + window.scrollY
                window.scrollTo({
                  top: elementPosition - offset,
                  behavior: 'smooth',
                })
                // Focus the input after a small delay to ensure scroll completes
                setTimeout(() => {
                  inputElement.focus()
                }, 300)
                break
              }
            }
          }
        })
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only allow submission when on step 4 (Review step)
    // This prevents accidental auto-submission
    if (currentStep !== 4) {
      return
    }
    
    // For guest users, show account creation modal before submission
    if (isAuthenticated !== true) {
      // Reset submitting state and open modal
      setIsSubmitting(false)
      // Ensure ref is reset when opening modal fresh
      wasModalOpenOnSubmitRef.current = false
      setShowGuestAccountModal(true)
      return
    }
    
    // For authenticated users, proceed with submission
    await submitOrders()
  }

  // Monitor isSubmittingRequest to reset local isSubmitting state when request completes (success or error)
  useEffect(() => {
    if (!isSubmittingRequest && isSubmitting) {
      // Request has completed (either success or error), reset local state
      setIsSubmitting(false)
    }
  }, [isSubmittingRequest, isSubmitting])

  // Track if modal was open when submission started
  const wasModalOpenOnSubmitRef = useRef(false)
  
  // Close modal on error
  useEffect(() => {
    // Close modal if error occurred during submission
    if (submitError && showGuestAccountModal) {
      setShowGuestAccountModal(false)
      setIsSubmitting(false)
      // Reset the ref after closing
      wasModalOpenOnSubmitRef.current = false
      // Scroll to top when modal closes due to error
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }, [submitError, showGuestAccountModal])

  const submitOrders = async (accountData?: { password?: string; confirmPassword?: string }) => {
    setIsSubmitting(true)
    // Track that modal was open when submission started
    if (showGuestAccountModal) {
      wasModalOpenOnSubmitRef.current = true
    }
    
    // Create a single order with all templates
    // IMPORTANT: No prices are sent from client - all calculations are done server-side for security
    const orderData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      shippingLocation: formData.shippingLocation, // Required for server-side shipping calculation
      // Only include personal info for guest users (authenticated users' info is fetched from their account)
      ...(isAuthenticated !== true && {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      }),
      templates: formData.selectedTemplates.map(template => {
        const templateImages = formData.sampleImageUrls[template._id] || []
        return {
          templateId: template._id,
          quantity: formData.quantities[template._id] || 1,
          measurements: formData.measurements[template._id] || {},
          sampleImageUrls: templateImages, // Send all image URLs for each template
        }
      }),
      notes: formData.notes || undefined,
      preferredStyle: formData.preferredStyle || undefined,
      // Include account creation data for guest users
      ...(isAuthenticated !== true && accountData?.password && {
        createAccount: true,
        password: accountData.password,
        confirmPassword: accountData.confirmPassword,
      }),
    }

    try {
      await new Promise<void>((resolve, reject) => {
        submitRequest({
          requestConfig: {
            method: 'POST',
            url: '/guest/request-measurement',
            body: orderData,
          },
          successRes: (response: any) => {
            // Extract order number from response
            if (response?.data?.data?.orderNumber) {
              setSubmittedOrderNumbers([response.data.data.orderNumber])
            }
            // Close modal only on successful submission
            setShowGuestAccountModal(false)
            setIsSubmitted(true)
            // Reset the ref on success
            wasModalOpenOnSubmitRef.current = false
            resolve()
          },
        })
      })
    } catch (error) {
      console.error('Error submitting order:', error)
      // Error toast already shown by useHttp
      // Close modal on error
      setShowGuestAccountModal(false)
      // isSubmitting will be reset by the useEffect monitoring isSubmittingRequest
    }
  }

  const handleCreateAccount = (password: string, confirmPassword: string) => {
    setAccountCreationData({ password, confirmPassword })
    // Don't close modal here - let submitOrders close it only on success
    // If there's an error, modal stays open so user can see the error and retry
    submitOrders({ password, confirmPassword })
  }

  const handleContinueAsGuest = () => {
    // Don't close modal here - let submitOrders close it only on success
    // If there's an error, modal stays open so user can see the error and retry
    submitOrders()
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setCurrentStep(1)
    setFormData(initialFormData)
    setErrors({})
  }

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Prevent form submission on Enter key press
    // Only allow submission when the submit button is explicitly clicked
    if (e.key === 'Enter') {
      // If we're on step 4 and the target is the submit button, allow it
      const target = e.target as HTMLElement
      if (currentStep === 4 && target instanceof HTMLButtonElement && target.type === 'submit') {
        // Allow submission - submit button was pressed
        return
      }
      // Otherwise, prevent default form submission
      e.preventDefault()
      // If Enter is pressed on step 3, trigger Next button instead
      if (currentStep === 3) {
        handleNext()
      }
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <SuccessMessage
          onReset={handleReset}
          orderNumbers={submittedOrderNumbers}
          isGuest={isAuthenticated !== true}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <GuestAccountModal
        isOpen={showGuestAccountModal}
        onClose={() => {
          setShowGuestAccountModal(false)
          // Reset submitting state when modal is manually closed
          setIsSubmitting(false)
          // Reset the ref when manually closed
          wasModalOpenOnSubmitRef.current = false
        }}
        onCreateAccount={handleCreateAccount}
        onContinueAsGuest={handleContinueAsGuest}
        email={formData.email}
        isSubmitting={isSubmitting}
        context="measurement"
      />

      <div className="max-w-5xl mx-auto">
        <div
          ref={formContainerRef}
          className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl"
        >
          <div className="relative z-10">
            <div className="border-b border-sky-100 bg-gradient-to-r from-sky-900 via-sky-800 to-sky-900 px-6 sm:px-10 pt-8 pb-6 text-white">
              <FormHeader />
              <div className="mt-6">
                <ProgressBar currentStep={currentStep} />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              onKeyDown={handleFormKeyDown}
              className="px-6 sm:px-10 py-8 space-y-8"
            >
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <Step1PersonalInfo
                    formData={formData}
                    errors={errors}
                    onInputChange={handleInputChange}
                    isAuthenticated={isAuthenticated === true}
                    userData={userData}
                    isFetchingUser={isFetchingUser}
                    fetchUserError={fetchUserError}
                    onRetryFetchUser={handleFetchUser}
                    onClearError={handleClearError}
                    locationFees={locationFees}
                    isShippingFree={false}
                    freeShippingThreshold={freeShippingThreshold}
                  />
                )}
                {currentStep === 2 && (
                  <Step2TemplateSelection
                    formData={formData}
                    errors={errors}
                    onInputChange={handleInputChange}
                    templates={templates}
                    isLoading={isLoadingTemplates}
                  />
                )}
                {currentStep === 3 && (
                  <Step3TemplateMeasurements
                    formData={formData}
                    errors={errors}
                    onInputChange={handleInputChange}
                    onClearError={handleClearError}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Review
                    formData={formData}
                    onInputChange={handleInputChange}
                  />
                )}
              </AnimatePresence>

              <FormNavigation
                currentStep={currentStep}
                isSubmitting={isSubmitting || isSubmittingRequest}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSubmit={async () => {
                  // Only allow submission when on step 4
                  if (currentStep === 4) {
                    // For guest users, show account creation modal before submission
                    if (isAuthenticated !== true) {
                      setShowGuestAccountModal(true)
                      return
                    }
                    // For authenticated users, proceed with submission
                    await submitOrders()
                  }
                }}
                isModalOpen={showGuestAccountModal}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
