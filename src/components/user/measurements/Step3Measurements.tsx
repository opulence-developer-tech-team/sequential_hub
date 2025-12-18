import { motion } from 'framer-motion'
import { Ruler } from 'lucide-react'
import { MeasurementData } from './types'
import TopMeasurements from './TopMeasurements'
import BottomMeasurements from './BottomMeasurements'

interface Step3MeasurementsProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: string | number | boolean) => void
}

export default function Step3Measurements({ formData, errors, onInputChange }: Step3MeasurementsProps) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <Ruler className="h-5 w-5 text-primary-600" />
          </div>
          Body Measurements
        </h2>
        <p className="text-gray-600 ml-13">Enter your measurements in inches. Use a measuring tape for accuracy.</p>
      </div>
      
      {formData.needsTopMeasurements && (
        <TopMeasurements formData={formData} errors={errors} onInputChange={onInputChange} />
      )}
      
      {formData.needsBottomMeasurements && (
        <BottomMeasurements formData={formData} errors={errors} onInputChange={onInputChange} />
      )}
    </motion.div>
  )
}





































