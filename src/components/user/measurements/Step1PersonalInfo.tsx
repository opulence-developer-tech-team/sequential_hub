import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, Info, Edit, LogOut, MapPin, Loader2, AlertCircle, ChevronDown, Search } from 'lucide-react'
import { MeasurementData } from './types'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useHttp } from '@/hooks/useHttp'
import { clearUserData } from '@/store/redux/user/user-data-slice'
import { authActions } from '@/store/redux/auth/auth-slice'
import { clearWishlist } from '@/store/redux/user/user-wishlist-slice'
import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'
import LogoutConfirmationModal from '@/components/user/LogoutConfirmationModal'
import { formatPrice } from '@/lib/utils'

interface Step1PersonalInfoProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: string | number | boolean) => void
  isAuthenticated?: boolean
  userData?: any
  isFetchingUser?: boolean
  fetchUserError?: string | null
  onRetryFetchUser?: () => void
  onClearError?: (errorKey: string) => void
  locationFees?: Array<{ location: string; fee: number }>
  isShippingFree?: boolean
  freeShippingThreshold?: number | null
}

// Helper function to parse E.164 phone number and extract country code and number
const parsePhoneNumber = (phoneNumber: string): { country: Country; number: string } => {
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    // Default to Nigeria if no valid phone number
    const defaultCountry = worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]
    return { country: defaultCountry, number: '' }
  }

  // Remove + and find matching country code
  const digitsOnly = phoneNumber.substring(1).replace(/[\s\-\(\)\.]/g, '')
  
  // Try to find matching country code (1-3 digits)
  for (let i = 3; i >= 1; i--) {
    const potentialCode = digitsOnly.substring(0, i)
    const country = worldCountries.find(c => {
      const codeDigits = c.phoneCode.replace(/[\s\-+]/g, '')
      return codeDigits === potentialCode
    })
    
    if (country) {
      const number = digitsOnly.substring(i)
      return { country, number }
    }
  }

  // Default to Nigeria if no match found
  const defaultCountry = worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]
  return { country: defaultCountry, number: digitsOnly }
}

export default function Step1PersonalInfo({ 
  formData, 
  errors, 
  onInputChange, 
  isAuthenticated = false, 
  userData,
  isFetchingUser = false,
  fetchUserError = null,
  onRetryFetchUser,
  onClearError,
  locationFees = [],
  isShippingFree = false,
  freeShippingThreshold = null,
}: Step1PersonalInfoProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isLoading: isLoggingOut, sendHttpRequest: logoutRequest } = useHttp()
  
  // Parse phone number to get country and number
  const { country: initialCountry, number: initialNumber } = parsePhoneNumber(formData.phone)
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry)
  const [phoneNumber, setPhoneNumber] = useState(initialNumber)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Update phone number when formData.phone changes
  useEffect(() => {
    const { country, number } = parsePhoneNumber(formData.phone)
    setSelectedCountry(country)
    setPhoneNumber(number)
  }, [formData.phone])

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
    // Combine country code and phone number in E.164 format
    const countryCodeDigits = selectedCountry.phoneCode.replace(/[\s\-+]/g, '')
    const fullPhoneNumber = `+${countryCodeDigits}${value.replace(/[\s\-\(\)\.]/g, '')}`
    onInputChange('phone', fullPhoneNumber)
    // Only clear error if the phone number is now valid (E.164 format)
    if (errors.phone && onClearError) {
      const phoneRegex = /^\+[1-9]\d{9,14}$/
      if (fullPhoneNumber.trim() && phoneRegex.test(fullPhoneNumber.trim())) {
        onClearError('phone')
      }
    }
  }

  // Handle country change
  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country)
    setIsCountryDropdownOpen(false)
    setCountrySearchQuery('')
    // Update phone number with new country code
    const countryCodeDigits = country.phoneCode.replace(/[\s\-+]/g, '')
    const fullPhoneNumber = `+${countryCodeDigits}${phoneNumber.replace(/[\s\-\(\)\.]/g, '')}`
    onInputChange('phone', fullPhoneNumber)
    // Only clear error if the phone number is now valid (E.164 format)
    if (errors.phone && onClearError) {
      const phoneRegex = /^\+[1-9]\d{9,14}$/
      if (fullPhoneNumber.trim() && phoneRegex.test(fullPhoneNumber.trim())) {
        onClearError('phone')
      }
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    // Call logout API to clear httpOnly cookie
    logoutRequest({
      requestConfig: {
        method: 'POST',
        url: '/auth/logout',
      },
      successRes: () => {
        // Clear user data from Redux
        dispatch(clearUserData())
        // Clear wishlist data from Redux
        dispatch(clearWishlist())
        // Set auth status to false (not authenticated) so Header shows Login button
        dispatch(authActions.setAuthStatus(false))
        // Reset form data
        onInputChange('firstName', '')
        onInputChange('lastName', '')
        onInputChange('email', '')
        onInputChange('phone', '')
        onInputChange('address', '')
        onInputChange('city', '')
        onInputChange('state', '')
        onInputChange('zipCode', '')
        onInputChange('country', 'Nigeria')
        // Reset phone number state
        const defaultCountry = worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]
        setSelectedCountry(defaultCountry)
        setPhoneNumber('')
        // Close modal
        setShowLogoutModal(false)
      },
    })
  }

  // Loading state - show loader while fetching user data
  if (isAuthenticated && isFetchingUser && !userData) {
    return (
      <motion.div
        key="step1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            Personal Information
          </h2>
          <p className="text-gray-600 ml-13">Please provide your contact details so we can reach you</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-3" />
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </motion.div>
    )
  }

  // Error state - show error if fetch failed and no user data
  if (isAuthenticated && fetchUserError && !userData && onRetryFetchUser) {
    return (
      <motion.div
        key="step1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            Personal Information
          </h2>
          <p className="text-gray-600 ml-13">Please provide your contact details so we can reach you</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load your information</h3>
          <p className="text-gray-600 mb-4">{fetchUserError}</p>
          <button
            type="button"
            onClick={onRetryFetchUser}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          Personal Information
        </h2>
        <p className="text-gray-600 ml-13">Please provide your contact details so we can reach you</p>
      </div>
      
      {isAuthenticated && (
        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                <span className="font-semibold text-gray-900">Your personal information is locked.</span> To edit your details, please visit your account page or logout to fill the form as a guest.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/account?tab=addresses&redirect=/measurements"
                  className="inline-flex items-center text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  Edit in Account
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center text-start text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  Logout & Fill as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => {
                const value = e.target.value
                onInputChange('firstName', value)
                // Only clear error if the value is now valid
                if (errors.firstName && onClearError && value.trim()) {
                  onClearError('firstName')
                }
              }}
              disabled={Boolean(isAuthenticated)}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="John"
              data-field="firstName"
            />
          </div>
          {errors.firstName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.firstName}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => {
                const value = e.target.value
                onInputChange('lastName', value)
                // Only clear error if the value is now valid
                if (errors.lastName && onClearError && value.trim()) {
                  onClearError('lastName')
                }
              }}
              disabled={Boolean(isAuthenticated)}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="Doe"
              data-field="lastName"
            />
          </div>
          {errors.lastName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.lastName}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                const value = e.target.value
                onInputChange('email', value)
                // Only clear error if the value is now valid (not empty and valid email format)
                if (errors.email && onClearError) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  if (value.trim() && emailRegex.test(value)) {
                    onClearError('email')
                  }
                }
              }}
              disabled={Boolean(isAuthenticated)}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="john@example.com"
              data-field="email"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsCountryDropdownOpen(!isCountryDropdownOpen)
                    setCountrySearchQuery('')
                  }
                }}
                disabled={Boolean(isAuthenticated)}
                className={`flex items-center justify-center gap-2 px-3 h-[48px] border-2 rounded-lg bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 min-w-[120px] ${
                  isAuthenticated 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                    : errors.phone
                    ? 'border-red-500 hover:border-red-600'
                    : 'border-gray-300 hover:border-primary-500'
                }`}
              >
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                {!isAuthenticated && (
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              {/* Dropdown Menu */}
              {isCountryDropdownOpen && !isAuthenticated && (
                <div className="absolute top-full left-0 mt-2 w-[320px] max-h-[400px] overflow-hidden bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.countryCode}
                          type="button"
                          onClick={() => handleCountryChange(country)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                            selectedCountry.countryCode === country.countryCode ? 'bg-primary-100' : ''
                          }`}
                        >
                          <span className="text-lg flex-shrink-0">{country.flag}</span>
                          <span className="flex-1 text-left text-gray-900">{country.name}</span>
                          <span className="text-gray-600 font-medium flex-shrink-0">{country.phoneCode}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No countries found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Phone Number Input */}
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                disabled={Boolean(isAuthenticated)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="(555) 123-4567"
                data-field="phone"
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Enter your phone number without the country code
          </p>
          {errors.phone && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary-600" />
          Address Information
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => {
                const value = e.target.value
                onInputChange('address', value)
                // Only clear error if the value is now valid
                if (errors.address && onClearError && value.trim()) {
                  onClearError('address')
                }
              }}
              disabled={Boolean(isAuthenticated)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="Street address"
              data-field="address"
            />
            {errors.address && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => {
                  const value = e.target.value
                  onInputChange('city', value)
                  // Only clear error if the value is now valid
                  if (errors.city && onClearError && value.trim()) {
                    onClearError('city')
                  }
                }}
                disabled={Boolean(isAuthenticated)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="City"
                data-field="city"
              />
              {errors.city && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  {errors.city}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => {
                  const value = e.target.value
                  onInputChange('state', value)
                  // Only clear error if the value is now valid
                  if (errors.state && onClearError && value.trim()) {
                    onClearError('state')
                  }
                }}
                disabled={Boolean(isAuthenticated)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="State"
                data-field="state"
              />
              {errors.state && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  {errors.state}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.zipCode}
                onChange={(e) => {
                  const value = e.target.value
                  onInputChange('zipCode', value)
                  // Only clear error if the value is now valid
                  if (errors.zipCode && onClearError && value.trim()) {
                    onClearError('zipCode')
                  }
                }}
                disabled={Boolean(isAuthenticated)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="ZIP Code"
                data-field="zipCode"
              />
              {errors.zipCode && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  {errors.zipCode}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.country}
              onChange={(e) => {
                const value = e.target.value
                onInputChange('country', value)
                // Only clear error if the value is now valid
                if (errors.country && onClearError && value.trim()) {
                  onClearError('country')
                }
              }}
              disabled={Boolean(isAuthenticated)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none bg-white ${
                errors.country ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              data-field="country"
            >
              <option value="">Select a country</option>
              {worldCountries.map((country) => (
                <option key={country.countryCode} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.country}
              </p>
            )}
          </div>

          {locationFees && locationFees.length > 0 && !isShippingFree && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Shipping Location <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.shippingLocation}
                onChange={(e) => {
                  const value = e.target.value
                  onInputChange('shippingLocation', value)
                  if (errors.shippingLocation && onClearError && value.trim()) {
                    onClearError('shippingLocation')
                  }
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 appearance-none bg-white ${
                  errors.shippingLocation ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                data-field="shippingLocation"
              >
                <option value="">Select shipping location</option>
                {[...locationFees]
                  .sort((a, b) => {
                    // Put "International" first
                    if (a.location === 'International') return -1
                    if (b.location === 'International') return 1
                    // Sort others alphabetically
                    return a.location.localeCompare(b.location)
                  })
                  .map((locationFee) => (
                    <option key={locationFee.location} value={locationFee.location}>
                      {locationFee.location}
                    </option>
                  ))}
              </select>
              {errors.shippingLocation && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  {errors.shippingLocation}
                </p>
              )}
              {formData.shippingLocation && (
                <p className="mt-2 text-sm text-gray-600">
                  Shipping fee: {locationFees.find(lf => lf.location === formData.shippingLocation)?.fee ? formatPrice(locationFees.find(lf => lf.location === formData.shippingLocation)!.fee) : 'N/A'}
                </p>
              )}
              {typeof freeShippingThreshold === 'number' && freeShippingThreshold > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Orders with a total above {formatPrice(freeShippingThreshold)} may qualify for free shipping on eligible locations.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </motion.div>
  )
}

