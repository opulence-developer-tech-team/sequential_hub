import { motion } from 'framer-motion'
import { Users, Info } from 'lucide-react'
import { MeasurementData } from './types'

interface BottomMeasurementsProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: string | number | boolean) => void
}

export default function BottomMeasurements({ formData, errors, onInputChange }: BottomMeasurementsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-100"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
          <Users className="h-4 w-4 text-teal-600" />
        </div>
        Bottom Part Measurements
      </h3>
      <p className="text-sm text-gray-600 mb-6 ml-11">Measurements from the waist down</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hip <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.hip || ''}
              onChange={(e) => onInputChange('hip', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
                errors.hip ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
          {errors.hip && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.hip}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Laps (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.laps || ''}
              onChange={(e) => onInputChange('laps', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Kneel (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.kneel || ''}
              onChange={(e) => onInputChange('kneel', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Round Kneel (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.roundKneel || ''}
              onChange={(e) => onInputChange('roundKneel', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Trouser Length <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.trouserLength || ''}
              onChange={(e) => onInputChange('trouserLength', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white ${
                errors.trouserLength ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
          {errors.trouserLength && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {errors.trouserLength}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ankle/Mouth (inches)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.ankle || ''}
              onChange={(e) => onInputChange('ankle', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white hover:border-gray-400"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">in</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


















































