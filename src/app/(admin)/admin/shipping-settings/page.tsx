'use client'

import { useEffect, useState } from 'react'
import { Truck, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import { toast } from 'sonner'
import { shippingLocation } from '@/lib/resources'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ShippingLocationFee {
  location: string
  fee: number
}

export default function ShippingSettingsPage() {
  const { sendHttpRequest, isLoading } = useHttp()
  const [locationFees, setLocationFees] = useState<ShippingLocationFee[]>([])
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Fetch shipping settings
  useEffect(() => {
    sendHttpRequest({
      successRes: (res) => {
        try {
          const data = res?.data?.data
          if (data) {
            setLocationFees(data.locationFees || [])
            setFreeShippingThreshold(data.freeShippingThreshold || 0)
          }
        } catch (error) {
          console.error('Error processing shipping settings response:', error)
          toast.error('Failed to load shipping settings')
        } finally {
          setIsLoadingData(false)
        }
      },
      errorRes: () => {
        setIsLoadingData(false)
      },
      requestConfig: {
        url: '/admin/shipping-settings',
        method: 'GET',
      },
    })
  }, [])

  const handleAddLocation = () => {
    // Find first location not already in the list
    const availableLocation = shippingLocation.find(
      (loc) => !locationFees.some((lf) => lf.location === loc)
    )

    if (!availableLocation) {
      toast.error('All locations have been added')
      return
    }

    setLocationFees([...locationFees, { location: availableLocation, fee: 0 }])
  }

  const handleRemoveLocation = (index: number) => {
    setLocationFees(locationFees.filter((_, i) => i !== index))
  }

  const handleLocationChange = (index: number, location: string) => {
    const newFees = [...locationFees]
    newFees[index].location = location
    setLocationFees(newFees)
  }

  const handleFeeChange = (index: number, fee: number) => {
    const newFees = [...locationFees]
    newFees[index].fee = Math.max(0, fee)
    setLocationFees(newFees)
  }

  const handleSave = () => {
    // Validate that all locations are unique
    const locations = locationFees.map((lf) => lf.location)
    const uniqueLocations = new Set(locations)
    if (locations.length !== uniqueLocations.size) {
      toast.error('Each location can only be added once')
      return
    }

    setIsSaving(true)
    sendHttpRequest({
      successRes: () => {
        toast.success('Shipping settings saved successfully')
        setIsSaving(false)
      },
      errorRes: () => {
        setIsSaving(false)
      },
      requestConfig: {
        url: '/admin/shipping-settings',
        method: 'PUT',
        body: {
          locationFees,
          freeShippingThreshold,
        },
      },
    })
  }

  if (isLoadingData) {
    return <LoadingSpinner fullScreen text="Loading shipping settings..." />
  }

  // Get available locations (not yet added)
  const availableLocations = shippingLocation.filter(
    (loc) => !locationFees.some((lf) => lf.location === loc)
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-primary-600" />
              Shipping Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage shipping fees by location and free shipping threshold</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center sm:justify-start"
          >
            {isSaving || isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving || isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Free Shipping Threshold */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Free Shipping Threshold</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set the minimum order amount for free shipping. This amount will be displayed on the homepage.
          </p>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Order Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                placeholder="0.00"
              />
              <div className="absolute right-3 top-2.5 text-sm text-gray-500">
                Current: {formatPrice(freeShippingThreshold)}
              </div>
            </div>
          </div>
        </div>

        {/* Location Fees */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Shipping Fees by Location</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set shipping fees for each location. Customers will see these fees during checkout.
              </p>
            </div>
            {availableLocations.length > 0 && (
              <button
                onClick={handleAddLocation}
                className="w-full sm:w-auto justify-center flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </button>
            )}
          </div>

          {locationFees.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No shipping locations configured</p>
              {availableLocations.length > 0 && (
                <button
                  onClick={handleAddLocation}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Location
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {locationFees.map((locationFee, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <select
                      value={locationFee.location}
                      onChange={(e) => handleLocationChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                    >
                      <option value={locationFee.location}>{locationFee.location}</option>
                      {availableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Fee
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={locationFee.fee}
                        onChange={(e) => handleFeeChange(index, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-black"
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-2.5 text-sm text-gray-500">
                        {formatPrice(locationFee.fee)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleRemoveLocation(index)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove location"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableLocations.length > 0 && locationFees.length > 0 && (
            <div className="mt-4">
              <button
                onClick={handleAddLocation}
                className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Another Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}































