import { motion } from 'framer-motion'
import { CheckCircle2, User, Shirt, Ruler, MapPin, Image as ImageIcon } from 'lucide-react'
import { MeasurementData } from './types'
import Image from 'next/image'

interface Step4ReviewProps {
  formData: MeasurementData
  onInputChange: (field: keyof MeasurementData, value: string | number | boolean) => void
}

export default function Step4Review({ formData, onInputChange }: Step4ReviewProps) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <CheckCircle2 className="h-5 w-5 text-primary-600" />
          </div>
          Review Your Information
        </h2>
        <p className="text-gray-600 ml-[52px]">Please review your details before submitting</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-2 text-gray-700">
            <p><span className="font-semibold">Name:</span> {`${formData.firstName} ${formData.lastName}`.trim()}</p>
            <p><span className="font-semibold">Email:</span> {formData.email}</p>
            <p><span className="font-semibold">Phone:</span> {formData.phone}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-green-600" />
            Address Information
          </h3>
          <div className="space-y-1 text-gray-700">
            <p>{formData.address}</p>
            <p>{formData.city}, {formData.state} {formData.zipCode}</p>
            <p>{formData.country}</p>
          </div>
        </div>

        {formData.selectedTemplates && formData.selectedTemplates.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Shirt className="h-5 w-5 mr-2 text-purple-600" />
              Selected Templates
            </h3>
            <div className="space-y-2">
              {formData.selectedTemplates.map((template) => {
                const quantity = formData.quantities[template._id] || 1
                return (
                  <p key={template._id} className="text-gray-700">
                    <span className="font-semibold">{template.title}</span>
                    <span className="ml-2 text-gray-600">(Quantity: {quantity})</span>
                  </p>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      {formData.selectedTemplates && formData.selectedTemplates.length > 0 && (
        <div className="space-y-6">
          {formData.selectedTemplates.map((template) => {
            const templateMeasurements = formData.measurements[template._id] || {}
            const hasMeasurements = Object.keys(templateMeasurements).some(key => templateMeasurements[key] > 0)
            
            if (!hasMeasurements) return null
            
            const quantity = formData.quantities[template._id] || 1
            return (
              <div key={template._id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <Ruler className="h-5 w-5 mr-2 text-gray-700" />
                    Measurements - {template.title}
                  </h3>
                  <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                    Quantity: <span className="font-semibold text-gray-900">{quantity}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {template.fields.map((field) => {
                    const value = templateMeasurements[field.name]
                    if (value && value > 0) {
                      return (
                        <div key={field.name} className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">{field.name}</p>
                          <p className="text-lg font-semibold text-gray-900">{value}&quot;</p>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formData.sampleImageUrl && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-yellow-600" />
            Sample Image
          </h3>
          <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
            <Image
              src={formData.sampleImageUrl}
              alt="Sample"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {formData.preferredStyle && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Style Notes
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
              {formData.preferredStyle || 'None'}
            </div>
          </div>
        )}
        
        {formData.notes && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
              {formData.notes || 'None'}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
