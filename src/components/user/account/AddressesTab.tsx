'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'
import { useHttp } from '@/hooks/useHttp'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setUserData } from '@/store/redux/user/user-data-slice'

interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface AddressesTabProps {
  address: Address
  onAddressChange: (updatedAddress: Partial<Address>) => void
  onSaveSuccess?: () => void
}

export default function AddressesTab({ address, onAddressChange, onSaveSuccess }: AddressesTabProps) {
  const dispatch = useAppDispatch()
  const { isLoading: isSaving, sendHttpRequest: updateAddressReq } = useHttp()
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Find selected country from address.country, default to Nigeria
  const selectedCountry = worldCountries.find(
    c => c.name === address.country || c.countryCode === address.country
  ) || worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]

  // Filter countries based on search query
  const filteredCountries = worldCountries.filter(country =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
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

  const handleCountryChange = (country: Country) => {
    onAddressChange({ country: country.name })
    setIsCountryDropdownOpen(false)
    setCountrySearchQuery('')
  }

  // Handle form submission
  const handleSave = () => {
    updateAddressReq({
      successRes: (response: any) => {
        if (response?.data?.data) {
          // Update Redux store with updated user data
          dispatch(setUserData(response.data.data))
          // Update local state
          onAddressChange({
            street: response.data.data.street || '',
            city: response.data.data.city || '',
            state: response.data.data.state || '',
            zipCode: response.data.data.zipCode || '',
            country: response.data.data.country || '',
          })
          // Call onSaveSuccess callback if provided
          if (onSaveSuccess) {
            onSaveSuccess()
          }
        }
      },
      requestConfig: {
        url: '/user/update-address',
        method: 'PUT',
        body: {
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          zipCode: address.zipCode.trim(),
          country: address.country.trim(),
        },
        successMessage: 'Address updated successfully',
      },
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Addresses</h2>
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Default Address</h3>
        
        <div className="space-y-6">
          {/* Street Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => onAddressChange({ street: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
              placeholder="123 Main Street"
            />
          </div>

          {/* City, State, ZipCode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => onAddressChange({ city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => onAddressChange({ state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip/Postal Code
              </label>
              <input
                type="text"
                value={address.zipCode}
                onChange={(e) => onAddressChange({ zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="10001"
              />
            </div>
          </div>

          {/* Country Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCountryDropdownOpen(!isCountryDropdownOpen)
                  setCountrySearchQuery('')
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 h-[42px] border border-gray-300 rounded-md bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 hover:border-primary-500"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-medium">{selectedCountry.name}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isCountryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-[400px] overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg z-20">
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
            'Save Address'
          )}
        </button>
      </div>
    </div>
  )
}


