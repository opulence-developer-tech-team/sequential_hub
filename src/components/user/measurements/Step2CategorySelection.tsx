import { motion } from 'framer-motion'
import { Shirt, Info } from 'lucide-react'
import { categories } from '@/data/products'
import { MeasurementData } from './types'

interface Step2CategorySelectionProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: string | number | boolean) => void
}

export default function Step2CategorySelection({ formData, errors, onInputChange }: Step2CategorySelectionProps) {
  const selectedCategory = categories.find(cat => cat.id === formData.category)

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <Shirt className="h-5 w-5 text-primary-600" />
          </div>
          Select Clothing Category
        </h2>
        <p className="text-gray-600 ml-13">Choose the type of clothing you need custom measurements for</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => {
              onInputChange('category', e.target.value)
              onInputChange('subcategory', '')
            }}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
              errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.category}
            </p>
          )}
        </div>
        
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.subcategory}
              onChange={(e) => onInputChange('subcategory', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
                errors.subcategory ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <option value="">Select a subcategory</option>
              {selectedCategory.subcategories?.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {errors.subcategory && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                {errors.subcategory}
              </p>
            )}
          </motion.div>
        )}

        {/* Measurement Type Selection */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
          <label className="block text-sm font-semibold text-gray-900 mb-4">
            What measurements do you need? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
              formData.needsTopMeasurements
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={formData.needsTopMeasurements}
                onChange={(e) => onInputChange('needsTopMeasurements', e.target.checked)}
                className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Top Measurements</div>
                <div className="text-sm text-gray-600 mt-1">
                  Shirts, blouses, jackets, etc.
                </div>
              </div>
            </label>
            <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
              formData.needsBottomMeasurements
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={formData.needsBottomMeasurements}
                onChange={(e) => onInputChange('needsBottomMeasurements', e.target.checked)}
                className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Bottom Measurements</div>
                <div className="text-sm text-gray-600 mt-1">
                  Pants, skirts, shorts, etc.
                </div>
              </div>
            </label>
          </div>
          {errors.measurementType && (
            <p className="mt-3 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.measurementType}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}


















































