'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'
import { useHttp } from '@/hooks/useHttp'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setUserData } from '@/store/redux/user/user-data-slice'

interface ProfileTabProps {
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  onUserChange: (updatedFields: { firstName?: string; lastName?: string; email?: string; phone?: string }) => void
  onSaveSuccess?: () => void
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

export default function ProfileTab({ user, onUserChange, onSaveSuccess }: ProfileTabProps) {
  const dispatch = useAppDispatch()
  const { isLoading: isSaving, sendHttpRequest: updatePersonalInfoReq } = useHttp()
  const { country: initialCountry, number: initialNumber } = parsePhoneNumber(user.phone)
  
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry)
  const [phoneNumber, setPhoneNumber] = useState(initialNumber)
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Update phone number when user.phone changes
  useEffect(() => {
    const { country, number } = parsePhoneNumber(user.phone)
    setSelectedCountry(country)
    setPhoneNumber(number)
  }, [user.phone])

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
    onUserChange({ phone: fullPhoneNumber })
  }

  // Handle country change
  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country)
    setIsCountryDropdownOpen(false)
    setCountrySearchQuery('')
    // Update phone number with new country code
    const countryCodeDigits = country.phoneCode.replace(/[\s\-+]/g, '')
    const fullPhoneNumber = `+${countryCodeDigits}${phoneNumber.replace(/[\s\-\(\)\.]/g, '')}`
    onUserChange({ phone: fullPhoneNumber })
  }

  // Handle form submission
  const handleSave = () => {
    // Combine country code and phone number in E.164 format
    const countryCodeDigits = selectedCountry.phoneCode.replace(/[\s\-+]/g, '')
    const fullPhoneNumber = `+${countryCodeDigits}${phoneNumber.replace(/[\s\-\(\)\.]/g, '')}`

    updatePersonalInfoReq({
      successRes: (response: any) => {
        if (response?.data?.data) {
          // Update Redux store with updated user data
          dispatch(setUserData(response.data.data))
          // Update local state
          onUserChange({
            firstName: response.data.data.firstName,
            lastName: response.data.data.lastName,
            phone: response.data.data.phoneNumber || '',
          })
          // Call onSaveSuccess callback if provided
          if (onSaveSuccess) {
            onSaveSuccess()
          }
        }
      },
      requestConfig: {
        url: '/user/update-personal-info',
        method: 'PUT',
        body: {
          firstName: user.firstName.trim(),
          lastName: user.lastName.trim(),
          phoneNumber: fullPhoneNumber,
        },
        successMessage: 'Personal information updated successfully',
      },
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={user.firstName}
            onChange={(e) => onUserChange({ firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={user.lastName}
            onChange={(e) => onUserChange({ lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCountryDropdownOpen(!isCountryDropdownOpen)
                  setCountrySearchQuery('')
                }}
                className="flex items-center justify-center gap-2 px-3 h-[42px] border border-gray-300 rounded-md bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 min-w-[120px] hover:border-primary-500"
              >
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isCountryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-[320px] max-h-[400px] overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg z-20">
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
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                className="block w-full px-4 h-[42px] border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Enter your phone number without the country code
          </p>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSaving ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  )
}


