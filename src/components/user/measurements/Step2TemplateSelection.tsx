import { motion } from 'framer-motion'
import { Shirt, Info, Loader2, Check } from 'lucide-react'
import { MeasurementData, MeasurementTemplate } from './types'

interface Step2TemplateSelectionProps {
  formData: MeasurementData
  errors: Record<string, string>
  onInputChange: (field: keyof MeasurementData, value: any) => void
  templates: MeasurementTemplate[]
  isLoading: boolean
}

export default function Step2TemplateSelection({ 
  formData, 
  errors, 
  onInputChange, 
  templates,
  isLoading 
}: Step2TemplateSelectionProps) {
  const isTemplateSelected = (templateId: string): boolean => {
    return formData.selectedTemplates.some(t => t._id === templateId)
  }

  const handleTemplateSelect = (template: MeasurementTemplate) => {
    const isSelected = isTemplateSelected(template._id)
    
    if (isSelected) {
      // Deselect template
      const updatedTemplates = formData.selectedTemplates.filter(t => t._id !== template._id)
      onInputChange('selectedTemplates', updatedTemplates)
      
      // Remove measurements for this template
      const updatedMeasurements = { ...formData.measurements }
      delete updatedMeasurements[template._id]
      onInputChange('measurements', updatedMeasurements)
      
      // Remove quantity for this template
      const updatedQuantities = { ...formData.quantities }
      delete updatedQuantities[template._id]
      onInputChange('quantities', updatedQuantities)
    } else {
      // Select template
      const updatedTemplates = [...formData.selectedTemplates, template]
      onInputChange('selectedTemplates', updatedTemplates)
      
      // Initialize measurements object with empty values for all fields
      const initialMeasurements: Record<string, number> = {}
      template.fields.forEach(field => {
        initialMeasurements[field.name] = 0
      })
      
      // Update measurements with new template measurements
      const updatedMeasurements = {
        ...formData.measurements,
        [template._id]: initialMeasurements
      }
      onInputChange('measurements', updatedMeasurements)
      
      // Initialize quantity to 1 for new template
      const updatedQuantities = {
        ...formData.quantities,
        [template._id]: 1
      }
      onInputChange('quantities', updatedQuantities)
    }
  }

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
          Select Measurement Templates
        </h2>
        <p className="text-gray-600 ml-13">Choose one or more measurement templates (e.g., Shirt and Trouser)</p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Loading templates...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-600">No measurement templates available at the moment.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const selected = isTemplateSelected(template._id)
              return (
                <motion.button
                  key={template._id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                    selected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 mb-2 pr-8">{template.title}</h3>
                  <p className="text-sm text-gray-600">
                    {template.fields.length} measurement field{template.fields.length !== 1 ? 's' : ''}
                  </p>
                </motion.button>
              )
            })}
          </div>
          
          {formData.selectedTemplates.length > 0 && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-800 font-medium">
                {formData.selectedTemplates.length} template{formData.selectedTemplates.length !== 1 ? 's' : ''} selected: {formData.selectedTemplates.map(t => t.title).join(', ')}
              </p>
            </div>
          )}
        </>
      )}
      
      {errors.templateId && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <Info className="h-4 w-4 mr-1" />
          {errors.templateId}
        </p>
      )}
    </motion.div>
  )
}
