'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useHttp } from '@/hooks/useHttp'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import { setUserData, clearUserData } from '@/store/redux/user/user-data-slice'
import { cartActions } from '@/store/redux/cart/cart-slice'
import { clientCartActions } from '@/store/redux/cart/client-cart'
import { authActions } from '@/store/redux/auth/auth-slice'
import { clearWishlist } from '@/store/redux/user/user-wishlist-slice'
import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'
import GuestAccountModal from '@/components/user/measurements/GuestAccountModal'
import CheckoutHeader from '@/components/user/check-out/CheckoutHeader'
import CheckoutProgress from '@/components/user/check-out/CheckoutProgress'
import ShippingInformation, { validateField } from '@/components/user/check-out/ShippingInformation'
import ReviewOrder from '@/components/user/check-out/ReviewOrder'
import CheckoutNavigation from '@/components/user/check-out/CheckoutNavigation'
import OrderSummary from '@/components/user/check-out/OrderSummary'
import OrderConfirmation from '@/components/user/check-out/OrderConfirmation'
import { CheckoutFormData, initialCheckoutFormData } from '@/components/user/check-out/types'
import { parsePhoneNumber } from '@/components/user/check-out/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { sendHttpRequest, isLoading: isHttpLoading } = useHttp()
  const { sendHttpRequest: fetchUserRequest } = useHttp()
  const { sendHttpRequest: logoutRequest } = useHttp()
  const { sendHttpRequest: checkoutRequest, isLoading: isCheckoutLoading, error: checkoutError } = useHttp()
  const cartItems = useAppSelector((state) => state.clientCart.clientCartItems) || []
  const cartData = useAppSelector((state) => state.cart.cartData)
  const userData = useAppSelector((state) => state.userData.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const hasCheckedAuth = useAppSelector((state) => state.auth.hasCheckedAuth)

  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showGuestAccountModal, setShowGuestAccountModal] = useState(false)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const isOpeningModalRef = useRef(false)
  const wasModalOpenOnErrorRef = useRef(false)
  
  // Phone number state management
  const { country: initialCountry, number: initialNumber } = parsePhoneNumber('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry)
  const [phoneNumber, setPhoneNumber] = useState(initialNumber)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState<CheckoutFormData>(initialCheckoutFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const locationFees = useAppSelector((state) => state.shippingSettings.locationFees)
  const freeShippingThreshold = useAppSelector((state) => state.shippingSettings.freeShippingThreshold)

  // Fetch user data if authenticated and not already fetched
  useEffect(() => {
    if (isAuthenticated === true && !userData && hasCheckedAuth) {
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
  }, [isAuthenticated, userData, hasCheckedAuth, fetchUserRequest, dispatch])

  // Pre-fill form data for authenticated users
  useEffect(() => {
    if (isAuthenticated && userData) {
      const phone = userData.phoneNumber || ''
      const { country, number } = parsePhoneNumber(phone)
      setSelectedCountry(country)
      setPhoneNumber(number)
      
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: phone,
        address: userData.street || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        country: userData.country || 'Nigeria',
      }))
    }
  }, [isAuthenticated, userData])

  // Update phone number when formData.phone changes (for guest users)
  useEffect(() => {
    if (!isAuthenticated && formData.phone) {
      const { country, number } = parsePhoneNumber(formData.phone)
      setSelectedCountry(country)
      setPhoneNumber(number)
    }
  }, [formData.phone, isAuthenticated])

  // Filter countries based on search query
  const filteredCountries = worldCountries.filter(country =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    country.phoneCode.includes(countrySearchQuery) ||
    country.countryCode.toLowerCase().includes(countrySearchQuery.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false)
        setCountrySearchQuery('')
      }
    }
    
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCountryDropdownOpen])

  // Handle phone number change
  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value)
    const countryCodeDigits = selectedCountry.phoneCode.replace(/[\s\-+]/g, '')
    const fullPhoneNumber = `+${countryCodeDigits}${value.replace(/[\s\-\(\)\.]/g, '')}`
    setFormData(prev => ({
      ...prev,
      phone: fullPhoneNumber
    }))
    
    // Validate and clear error if phone number becomes valid
    if (errors.phone) {
      const phoneRegex = /^\+[1-9]\d{9,14}$/
      if (phoneRegex.test(fullPhoneNumber.trim())) {
        handleClearError('phone')
      }
    }
  }

  // Handle country change
  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country)
    setIsCountryDropdownOpen(false)
    setCountrySearchQuery('')
    const countryCodeDigits = country.phoneCode.replace(/[\s\-+]/g, '')
    const fullPhoneNumber = `+${countryCodeDigits}${phoneNumber.replace(/[\s\-\(\)\.]/g, '')}`
    setFormData(prev => ({
      ...prev,
      phone: fullPhoneNumber
    }))
    
    // Validate and clear error if phone number becomes valid after country change
    if (errors.phone) {
      const phoneRegex = /^\+[1-9]\d{9,14}$/
      if (phoneRegex.test(fullPhoneNumber.trim())) {
        handleClearError('phone')
      }
    }
  }

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (hasCheckedAuth) {
      if (!cartData || cartItems.length === 0) {
        router.push('/cart')
        return
      }
    }
  }, [cartData, cartItems.length, hasCheckedAuth, router])

  // Location fees are now fetched from Redux state (initialized in guest layout)

  // Fetch cart data if not already in Redux but cart items exist
  useEffect(() => {
    if (cartItems.length > 0 && !cartData && hasCheckedAuth) {
      sendHttpRequest({
        requestConfig: {
          method: 'POST',
          url: '/cart',
          body: {
            items: cartItems,
            shippingLocation: formData.shippingLocation || undefined,
          },
        },
        successRes: (res) => {
          if (res.data?.data) {
            dispatch(cartActions.setCartData(res.data.data))
          }
        },
      })
    }
  }, [cartItems, cartData, hasCheckedAuth, sendHttpRequest, dispatch, formData.shippingLocation])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleClearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  // Handle shipping location change and recalculate cart locally
  // The backend will recalculate during checkout anyway, so we just update locally for immediate UI feedback
  const handleShippingLocationChange = (location: string) => {
    if (!cartData) return

    // Calculate shipping locally based on location and free shipping threshold
    let shipping = 0
    const subtotal = cartData.subtotal

    // Check if subtotal meets free shipping threshold
    if (freeShippingThreshold !== null && freeShippingThreshold !== undefined && subtotal >= freeShippingThreshold) {
      // Shipping is free
      shipping = 0
    } else if (location && locationFees && locationFees.length > 0) {
      // Find the location fee
      const locationFee = locationFees.find(lf => lf.location === location)
      if (locationFee) {
        shipping = locationFee.fee
      }
    }

    // Recalculate tax (7.5% VAT rate for Nigeria)
    const tax = subtotal * 0.075

    // Calculate total
    const total = subtotal + shipping + tax

    // Round all monetary values to 2 decimal places
    const roundedShipping = Math.round(shipping * 100) / 100
    const roundedTax = Math.round(tax * 100) / 100
    const roundedTotal = Math.round(total * 100) / 100

    // Update cart data in Redux with new shipping, tax, and total
    dispatch(cartActions.setCartData({
      ...cartData,
      shipping: roundedShipping,
      tax: roundedTax,
      total: roundedTotal,
    }))
  }

  // Prevent form submission on Enter key
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentStep === 2 && document.activeElement === submitButtonRef.current) {
        submitButtonRef.current?.click()
      }
    }
  }

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      const validationErrors: Record<string, string> = {}
      
      // Auth users can't edit locked shipping fields on checkout.
      // If key address fields are missing, instruct them to update via dashboard.
      if (isAuthenticated) {
        const requiredLockedFields: Array<{ key: keyof CheckoutFormData; label: string }> = [
          { key: 'address', label: 'Address' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'zipCode', label: 'ZIP Code' },
        ]

        const missingLockedFields = requiredLockedFields.filter(({ key }) => {
          const value = formData[key]
          return typeof value !== 'string' || value.trim().length === 0
        })

        if (missingLockedFields.length > 0) {
          toast.error('Please set your address information in your dashboard to continue.', {
            description: `Missing: ${missingLockedFields.map((f) => f.label).join(', ')}.`,
            action: {
              label: 'Edit in Account',
              onClick: () => router.push('/account?tab=addresses&redirect=/checkout'),
            },
          })
          return
        }
      }

      // Validate all fields using the same validation function as the component
      // Shipping location is always required
      const fieldsToValidate = isAuthenticated
        ? ['shippingLocation']
        : ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country', 'shippingLocation']
      
      fieldsToValidate.forEach(field => {
        const error = validateField(field, formData[field as keyof CheckoutFormData] as string, formData)
        if (error) {
          validationErrors[field] = error
        }
      })
      
      // Validate password fields if creating account
      if (formData.createAccount) {
        const passwordError = validateField('password', formData.password, formData)
        if (passwordError) {
          validationErrors.password = passwordError
        }
        
        const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword, formData)
        if (confirmPasswordError) {
          validationErrors.confirmPassword = confirmPasswordError
        }
      }
      
      // If there are validation errors, set them and don't proceed
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        // Scroll to first error field
        requestAnimationFrame(() => {
          const firstErrorField = document.querySelector(`[name="${Object.keys(validationErrors)[0]}"]`) as HTMLElement
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
            firstErrorField.focus()
          }
        })
        return
      }
      
      // Clear errors if validation passes
      setErrors({})
    }
    
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLogout = () => {
    logoutRequest({
      requestConfig: {
        method: 'POST',
        url: '/auth/logout',
      },
      successRes: () => {
        dispatch(clearUserData())
        dispatch(clearWishlist())
        dispatch(authActions.setAuthStatus(false))
        setFormData(initialCheckoutFormData)
        const defaultCountry = worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]
        setSelectedCountry(defaultCountry)
        setPhoneNumber('')
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    return
  }

  const handleProceedToPayment = async () => {
    if (currentStep !== 2) {
      return
    }
    
    if (!isAuthenticated) {
      setIsProcessing(false)
      wasModalOpenOnErrorRef.current = false
      isOpeningModalRef.current = true
      setShowGuestAccountModal(true)
      setTimeout(() => {
        isOpeningModalRef.current = false
      }, 100)
      return
    }
    
    await proceedToPayment()
  }

  const proceedToPayment = async (accountData?: { password?: string; confirmPassword?: string }) => {
    setIsProcessing(true)
    if (showGuestAccountModal) {
      wasModalOpenOnErrorRef.current = true
    }
    
    try {
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        throw new Error('Cart is empty')
      }

      // IMPORTANT: No prices are sent from client - all calculations are done server-side for security
      const orderData: any = {
        items: cartData.items.map((cartItem) => ({
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          // No prices sent - server calculates from product data
        })),
        shippingLocation: formData.shippingLocation || undefined,
        // No subtotal, shipping, tax, or total sent - server calculates all prices
        ...(!isAuthenticated && {
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
        }),
        ...(!isAuthenticated && {
          billingAddress: formData.sameAsShipping
            ? undefined
            : {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.billingAddress || formData.address,
                city: formData.billingCity || formData.city,
                state: formData.billingState || formData.state,
                zipCode: formData.billingZipCode || formData.zipCode,
                country: formData.billingCountry || formData.country,
              },
          sameAsShipping: formData.sameAsShipping,
        }),
        ...(!isAuthenticated && accountData?.password && {
          createAccount: true,
          password: accountData.password,
          confirmPassword: accountData.confirmPassword,
        }),
      }

      await new Promise<void>((resolve, reject) => {
        checkoutRequest({
          requestConfig: {
            method: 'POST',
            url: '/payment/check-out',
            body: orderData,
          },
          successRes: (response: any) => {
            if (response?.data?.data?.checkoutUrl) {
              setShowGuestAccountModal(false)
              const checkoutUrl = response.data.data.checkoutUrl
              
              // Try to open in a new tab
              const newWindow = window.open(checkoutUrl, '_blank')
              
              // Check if popup was blocked
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                // Popup was blocked, open in same tab and clear cart before redirect
                dispatch(clientCartActions.resetClientCart())
                window.location.href = checkoutUrl
              } else {
                // Successfully opened in new tab, clear cart after a short delay
                // This gives the new tab time to start loading
                setTimeout(() => {
                  dispatch(clientCartActions.resetClientCart())
                }, 500)
              }
              
              resolve()
            } else {
              setIsProcessing(false)
              reject(new Error('No checkout URL received from server'))
            }
          },
          errorRes: (errorResponse: any) => {
            // Re-enable the button when an error occurs
            setIsProcessing(false)
            const errorMessage = errorResponse?.data?.description || errorResponse?.message || 'Failed to proceed to payment. Please try again.'
            reject(new Error(errorMessage))
            // Return false to prevent default error toast (we're handling it via reject)
            return false
          },
        })
      })
    } catch (error) {
      console.error('Order submission error:', error)
      setIsProcessing(false)
    }
  }

  const handleCreateAccount = (password: string, confirmPassword: string) => {
    proceedToPayment({ password, confirmPassword })
  }

  const handleContinueAsGuest = () => {
    proceedToPayment()
  }

  // Monitor checkout loading state
  useEffect(() => {
    if (!isCheckoutLoading && isProcessing) {
      // Request has completed
    }
  }, [isCheckoutLoading, isProcessing])

  // Close modal on error
  useEffect(() => {
    if (checkoutError && showGuestAccountModal && wasModalOpenOnErrorRef.current && !isOpeningModalRef.current) {
      setShowGuestAccountModal(false)
      setIsProcessing(false)
      wasModalOpenOnErrorRef.current = false
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }, [checkoutError, showGuestAccountModal])

  // Show loading state
  if (!hasCheckedAuth || (cartItems.length > 0 && !cartData && isHttpLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SewingMachineLoader size="lg" text="Loading checkout, please wait..." />
      </div>
    )
  }

  // Redirect if cart is empty
  if (!cartData || cartItems.length === 0 || cartData.items.length === 0) {
    return null
  }

  if (isComplete) {
    return (
      <OrderConfirmation
        isAuthenticated={isAuthenticated}
        showCreateAccount={showCreateAccount}
        onContinueShopping={() => router.push('/products')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CheckoutHeader
          onBack={() => router.back()}
          isAuthenticated={isAuthenticated}
          userEmail={userData?.email}
        />

        <CheckoutProgress currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-8">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <ShippingInformation
                    formData={formData}
                    onInputChange={handleInputChange}
                    isAuthenticated={isAuthenticated}
                    onLogout={handleLogout}
                    selectedCountry={selectedCountry}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={handlePhoneNumberChange}
                    onCountryChange={handleCountryChange}
                    isCountryDropdownOpen={isCountryDropdownOpen}
                    setIsCountryDropdownOpen={setIsCountryDropdownOpen}
                    countrySearchQuery={countrySearchQuery}
                    setCountrySearchQuery={setCountrySearchQuery}
                    countryDropdownRef={countryDropdownRef}
                    filteredCountries={filteredCountries}
                    errors={errors}
                    onClearError={handleClearError}
                    locationFees={locationFees}
                    onShippingLocationChange={handleShippingLocationChange}
                    cartData={cartData}
                  />
                )}

                {currentStep === 2 && (
                  <ReviewOrder formData={formData} />
                )}
              </AnimatePresence>

              <CheckoutNavigation
                currentStep={currentStep}
                onBack={handleBack}
                onNext={handleNext}
                onProceedToPayment={handleProceedToPayment}
                isProcessing={isProcessing}
                isHttpLoading={isHttpLoading}
                showGuestAccountModal={showGuestAccountModal}
                submitButtonRef={submitButtonRef}
              />
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            {cartData && <OrderSummary cartData={cartData} />}
          </div>
        </div>
      </div>

      {/* Guest Account Modal */}
      {!isAuthenticated && (
        <GuestAccountModal
          isOpen={showGuestAccountModal}
          onClose={() => {
            setShowGuestAccountModal(false)
            setIsProcessing(false)
            wasModalOpenOnErrorRef.current = false
          }}
          onCreateAccount={handleCreateAccount}
          onContinueAsGuest={handleContinueAsGuest}
          email={formData.email}
          isSubmitting={isProcessing}
          context="checkout"
        />
      )}
    </div>
  )
}
