'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Edit, LogOut, ChevronDown, Search, Phone, Info } from 'lucide-react'
import { CheckoutFormData } from './types'
import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'

interface ShippingInformationProps {
  formData: CheckoutFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  isAuthenticated: boolean | null
  onLogout: () => void
  selectedCountry: Country
  phoneNumber: string
  onPhoneNumberChange: (value: string) => void
  onCountryChange: (country: Country) => void
  isCountryDropdownOpen: boolean
  setIsCountryDropdownOpen: (open: boolean) => void
  countrySearchQuery: string
  setCountrySearchQuery: (query: string) => void
  countryDropdownRef: React.RefObject<HTMLDivElement | null>
  filteredCountries: Country[]
  errors?: Record<string, string>
  onClearError?: (field: string) => void
  locationFees?: Array<{ location: string; fee: number }>
  onShippingLocationChange?: (location: string) => void
  cartData?: { subtotal: number; shipping: number; tax: number; total: number; freeShippingThreshold?: number }
}

// Validation functions matching backend validator
const validateField = (field: string, value: string, formData?: CheckoutFormData): string => {
  switch (field) {
    case 'firstName':
      if (!value || !value.trim()) {
        return 'First name cannot be empty.'
      }
      if (value.trim().length < 1) {
        return 'First name must be at least 1 character.'
      }
      if (value.trim().length > 100) {
        return 'First name cannot exceed 100 characters.'
      }
      return ''
    
    case 'lastName':
      if (!value || !value.trim()) {
        return 'Last name cannot be empty.'
      }
      if (value.trim().length < 1) {
        return 'Last name must be at least 1 character.'
      }
      if (value.trim().length > 100) {
        return 'Last name cannot exceed 100 characters.'
      }
      return ''
    
    case 'email':
      if (!value || !value.trim()) {
        return 'Email cannot be empty.'
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        return 'Email must be a valid email address.'
      }
      if (value.trim().length > 255) {
        return 'Email cannot exceed 255 characters.'
      }
      return ''
    
    case 'phone':
      if (!value || !value.trim()) {
        return 'Phone cannot be empty.'
      }
      const phoneRegex = /^\+[1-9]\d{9,14}$/
      if (!phoneRegex.test(value.trim())) {
        return 'Phone must be in E.164 format (e.g., +1234567890). Must start with + followed by country code and 9-14 digits.'
      }
      return ''
    
    case 'address':
      if (!value || !value.trim()) {
        return 'Address cannot be empty.'
      }
      if (value.trim().length < 5) {
        return 'Address must be at least 5 characters.'
      }
      if (value.trim().length > 500) {
        return 'Address cannot exceed 500 characters.'
      }
      return ''
    
    case 'city':
      if (!value || !value.trim()) {
        return 'City cannot be empty.'
      }
      if (value.trim().length < 2) {
        return 'City must be at least 2 characters.'
      }
      if (value.trim().length > 100) {
        return 'City cannot exceed 100 characters.'
      }
      return ''
    
    case 'state':
      if (!value || !value.trim()) {
        return 'State cannot be empty.'
      }
      if (value.trim().length < 2) {
        return 'State must be at least 2 characters.'
      }
      if (value.trim().length > 100) {
        return 'State cannot exceed 100 characters.'
      }
      return ''
    
    case 'zipCode':
      if (!value || !value.trim()) {
        return 'ZIP code cannot be empty.'
      }
      if (value.trim().length < 3) {
        return 'ZIP code must be at least 3 characters.'
      }
      if (value.trim().length > 20) {
        return 'ZIP code cannot exceed 20 characters.'
      }
      return ''
    
    case 'country':
      if (!value || !value.trim()) {
        return 'Country cannot be empty.'
      }
      if (value.trim().length < 2) {
        return 'Country must be at least 2 characters.'
      }
      if (value.trim().length > 100) {
        return 'Country cannot exceed 100 characters.'
      }
      return ''
    
    case 'shippingLocation':
      if (!value || !value.trim()) {
        return 'Shipping location is required.'
      }
      return ''
    
    case 'password':
      if (!formData?.createAccount) {
        return ''
      }
      if (!value) {
        return 'Password is required when creating an account.'
      }
      if (value.length < 8) {
        return 'Password must be at least 8 characters long.'
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      }
      return ''
    
    case 'confirmPassword':
      if (!formData?.createAccount) {
        return ''
      }
      if (!value) {
        return 'Please confirm your password.'
      }
      if (formData && value !== formData.password) {
        return 'Passwords do not match.'
      }
      return ''
    
    default:
      return ''
  }
}

export default function ShippingInformation({
  formData,
  onInputChange,
  isAuthenticated,
  onLogout,
  selectedCountry,
  phoneNumber,
  onPhoneNumberChange,
  onCountryChange,
  isCountryDropdownOpen,
  setIsCountryDropdownOpen,
  countrySearchQuery,
  setCountrySearchQuery,
  countryDropdownRef,
  filteredCountries,
  errors = {},
  onClearError,
  locationFees,
  onShippingLocationChange,
  cartData,
}: ShippingInformationProps) {
  // Get freeShippingThreshold from Redux state (more reliable than cartData)
  const freeShippingThreshold = useAppSelector((state) => state.shippingSettings.freeShippingThreshold)

  // Check if shipping is free (only if subtotal meets or exceeds threshold)
  const isShippingFree = freeShippingThreshold !== null && 
                         freeShippingThreshold !== undefined && 
                         cartData?.subtotal !== undefined &&
                         cartData.subtotal >= freeShippingThreshold
  const handleInputChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    onInputChange(e)
    
    // Clear error if field becomes valid
    if (onClearError) {
      const error = validateField(name, value, formData)
      if (!error && errors[name]) {
        onClearError(name)
      }
    }
  }

  const handleBlur = (field: string, value: string) => {
    // Validation happens on blur, but errors are managed by parent
    // This is just for triggering validation
  }

  // Scroll to first error field when errors are present
  useEffect(() => {
    const errorKeys = Object.keys(errors)
    if (errorKeys.length > 0) {
      // Find the first field with an error
      const firstErrorField = errorKeys[0]
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Find the input field by data-field attribute
          const errorInput = document.querySelector(`[data-field="${firstErrorField}"]`) as HTMLElement
          
          if (errorInput) {
            // Scroll to the input with smooth behavior
            errorInput.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
            
            // Focus the input after a short delay to ensure scroll completes
            setTimeout(() => {
              errorInput.focus()
            }, 300)
          }
        })
      })
    }
  }, [errors])

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">Shipping Information</h2>
      
      {isAuthenticated && (
        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                <span className="font-semibold text-gray-900">Your shipping information is locked.</span> To edit your details, please visit your account page or logout to checkout as a guest.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/account?tab=addresses&redirect=/checkout"
                  className="inline-flex items-center text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit in Account
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Logout & Checkout as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChangeWithValidation}
              onBlur={(e) => handleBlur('firstName', e.target.value)}
              required
              disabled={Boolean(isAuthenticated)}
              placeholder="John"
              data-field="firstName"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChangeWithValidation}
              onBlur={(e) => handleBlur('lastName', e.target.value)}
              required
              disabled={Boolean(isAuthenticated)}
              placeholder="Doe"
              data-field="lastName"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChangeWithValidation}
              onBlur={(e) => handleBlur('email', e.target.value)}
              required
              disabled={Boolean(isAuthenticated)}
              placeholder="john.doe@example.com"
              data-field="email"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
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
                  className={`flex items-center justify-center gap-2 px-3 h-[48px] border border-gray-300 rounded-xl bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all duration-200 min-w-[120px] ${
                    isAuthenticated 
                      ? 'bg-gray-50 cursor-not-allowed' 
                      : 'hover:border-gray-900'
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
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
                            onClick={() => onCountryChange(country)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedCountry.countryCode === country.countryCode ? 'bg-gray-100' : ''
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
                  onChange={(e) => onPhoneNumberChange(e.target.value)}
                  onBlur={() => handleBlur('phone', formData.phone)}
                  disabled={Boolean(isAuthenticated)}
                  data-field="phone"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            {errors.phone ? (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.phone}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Enter your phone number without the country code
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChangeWithValidation}
            onBlur={(e) => handleBlur('address', e.target.value)}
            required
            disabled={Boolean(isAuthenticated)}
            placeholder="123 Main Street, Apartment 4B"
            data-field="address"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
              errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChangeWithValidation}
              onBlur={(e) => handleBlur('city', e.target.value)}
              required
              disabled={Boolean(isAuthenticated)}
              placeholder="Lagos"
              data-field="city"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.city && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.city}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChangeWithValidation}
              onBlur={(e) => handleBlur('state', e.target.value)}
              required
              disabled={Boolean(isAuthenticated)}
              placeholder="Lagos State"
              data-field="state"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.state && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.state}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChangeWithValidation}
              onBlur={(e) => handleBlur('zipCode', e.target.value)}
              required
              disabled={Boolean(isAuthenticated)}
              placeholder="100001"
              data-field="zipCode"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all ${
                errors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChangeWithValidation}
            onBlur={(e) => handleBlur('country', e.target.value)}
            required
            disabled={Boolean(isAuthenticated)}
            data-field="country"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black disabled:bg-gray-50 disabled:cursor-not-allowed transition-all appearance-none bg-white ${
              errors.country ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
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

        {locationFees && locationFees.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Location *
            </label>
            <select
              name="shippingLocation"
              value={formData.shippingLocation}
              onChange={(e) => {
                handleInputChangeWithValidation(e)
                if (onShippingLocationChange) {
                  onShippingLocationChange(e.target.value)
                }
              }}
              onBlur={(e) => handleBlur('shippingLocation', e.target.value)}
              required
              data-field="shippingLocation"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-black appearance-none bg-white ${
                errors.shippingLocation ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
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
                .map((locationFee: { location: string; fee: number }) => (
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
                {isShippingFree ? (
                  <span className="text-green-600 font-medium">Free Shipping</span>
                ) : (
                  <>Shipping fee: {locationFees.find((lf: { location: string; fee: number }) => lf.location === formData.shippingLocation)?.fee ? formatPrice(locationFees.find((lf: { location: string; fee: number }) => lf.location === formData.shippingLocation)!.fee) : 'N/A'}</>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Export validation function for use in parent component
export { validateField }

