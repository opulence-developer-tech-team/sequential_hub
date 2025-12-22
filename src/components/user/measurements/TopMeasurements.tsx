import { motion } from 'framer-motion'
import { Shirt, Info } from 'lucide-react'
import { MeasurementData } from './types'

interface TopMeasurementsProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: string | number | boolean) => void
}

export default function TopMeasurements({ formData, errors, onInputChange }: TopMeasurementsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
          <Shirt className="h-4 w-4 text-purple-600" />
        </div>
        Top Part Measurements
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Neck (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.neck || ''}
              onChange={(e) => onInputChange('neck', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Shoulder <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.shoulder || ''}
              onChange={(e) => onInputChange('shoulder', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
                errors.shoulder ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
          {errors.shoulder && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.shoulder}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Sleeve Length (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.sleeveLength || ''}
              onChange={(e) => onInputChange('sleeveLength', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Round Sleeve (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.roundSleeve || ''}
              onChange={(e) => onInputChange('roundSleeve', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Chest <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.chest || ''}
              onChange={(e) => onInputChange('chest', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
                errors.chest ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
          {errors.chest && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.chest}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tummy/Waist (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.tummy || ''}
              onChange={(e) => onInputChange('tummy', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Shirt Length <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.shirtLength || ''}
              onChange={(e) => onInputChange('shirtLength', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
                errors.shirtLength ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
          {errors.shirtLength && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.shirtLength}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

















































