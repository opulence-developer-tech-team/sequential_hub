'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Ruler, Save, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { useHttp } from '@/hooks/useHttp'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/redux'
import { measurementTemplateActions, MeasurementTemplate } from '@/store/redux/adminSlice/measurement-template-slice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'

interface MeasurementField {
  id: string
  name: string
}

export default function AdminMeasurementsPage() {
  const dispatch = useDispatch()
  const { sendHttpRequest, isLoading, error } = useHttp()
  const { templates, hasFetchedTemplates } = useSelector(
    (state: RootState) => state.admin.measurementTemplates
  )

  const [title, setTitle] = useState('')
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([])
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddField = () => {
    const newField: MeasurementField = {
      id: `field-${Date.now()}-${Math.random()}`,
      name: ''
    }
    setMeasurementFields([...measurementFields, newField])
  }

  const handleRemoveField = (fieldId: string) => {
    setMeasurementFields(measurementFields.filter(field => field.id !== fieldId))
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setMeasurementFields(
      measurementFields.map(field =>
        field.id === fieldId ? { ...field, name: value } : field
      )
    )
  }

  const fetchTemplates = useCallback(() => {
    sendHttpRequest({
      requestConfig: {
        method: 'GET',
        url: '/admin/get-measurement-template',
      },
      successRes: (response: any) => {
        if (response?.data?.data) {
          const templatesData = response.data.data.map((template: any) => ({
            _id: template._id,
            adminId: template.adminId,
            title: template.title,
            fields: template.fields,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          }))
          dispatch(measurementTemplateActions.setTemplates(templatesData))
        }
      },
    })
  }, [sendHttpRequest, dispatch])

  // Reset submitting state when useHttp's isLoading changes (handles both success and error)
  useEffect(() => {
    if (!isLoading && isSubmitting) {
      // Small delay to ensure state updates are processed
      const timer = setTimeout(() => {
        setIsSubmitting(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isSubmitting])

  // Fetch templates on mount
  useEffect(() => {
    if (!hasFetchedTemplates) {
      fetchTemplates()
    }
  }, [hasFetchedTemplates, fetchTemplates])

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please enter a title for the measurement template')
      return
    }

    if (measurementFields.length === 0) {
      toast.error('Please add at least one measurement field')
      return
    }

    const fieldsWithNames = measurementFields
      .filter(field => field.name.trim())
      .map(field => ({ name: field.name.trim() }))

    if (fieldsWithNames.length === 0) {
      toast.error('Please enter names for at least one measurement field')
      return
    }

    setIsSubmitting(true)

    if (editingTemplateId) {
      // Update existing template
      sendHttpRequest({
        requestConfig: {
          method: 'PUT',
          url: '/admin/update-measurement-template',
          body: {
            templateId: editingTemplateId,
            title: title.trim(),
            fields: fieldsWithNames,
          },
        },
        successRes: (response: any) => {
          if (response?.data?.data) {
            const updatedTemplate: MeasurementTemplate = {
              _id: response.data.data._id,
              adminId: response.data.data.adminId,
              title: response.data.data.title,
              fields: response.data.data.fields,
              createdAt: response.data.data.createdAt,
              updatedAt: response.data.data.updatedAt,
            }
            dispatch(measurementTemplateActions.updateTemplate({
              _id: editingTemplateId,
              updated: updatedTemplate,
            }))
            toast.success('Measurement template updated successfully')
            
            // Reset form
            setTitle('')
            setMeasurementFields([])
            setEditingTemplateId(null)
          }
        },
      })
      return
    } else {
      // Create new template
      sendHttpRequest({
        requestConfig: {
          method: 'POST',
          url: '/admin/submit-measurement-template',
          body: {
            title: title.trim(),
            fields: fieldsWithNames,
          },
        },
        successRes: (response: any) => {
          if (response?.data?.data) {
            const newTemplate: MeasurementTemplate = {
              _id: response.data.data._id,
              adminId: response.data.data.adminId,
              title: response.data.data.title,
              fields: response.data.data.fields,
              createdAt: response.data.data.createdAt,
              updatedAt: response.data.data.updatedAt,
            }
            dispatch(measurementTemplateActions.addTemplate(newTemplate))
            toast.success('Measurement template created successfully')
            
            // Reset form
            setTitle('')
            setMeasurementFields([])
            setEditingTemplateId(null)
          }
        },
      })
    }
  }

  const handleEdit = (template: MeasurementTemplate) => {
    setTitle(template.title)
    setMeasurementFields(
      template.fields.map((field, index) => ({
        id: `field-${template._id}-${index}`,
        name: field.name,
      }))
    )
    setEditingTemplateId(template._id)
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this measurement template?')) {
      // TODO: Add delete endpoint
      dispatch(measurementTemplateActions.removeTemplate(templateId))
      toast.success('Measurement template deleted successfully')
      
      // If deleting the template being edited, reset form
      if (editingTemplateId === templateId) {
        setTitle('')
        setMeasurementFields([])
        setEditingTemplateId(null)
      }
    }
  }

  const handleCancel = () => {
    setTitle('')
    setMeasurementFields([])
    setEditingTemplateId(null)
    toast.info('Form reset')
  }

  const handleRetry = () => {
    if (hasFetchedTemplates) return

    // Error will be cleared automatically by useHttp when new request starts
    fetchTemplates()
  }

  // Show loading state for initial fetch
  if (isLoading && !hasFetchedTemplates) {
    return (
      <div className="p-6">
        <LoadingSpinner fullScreen={false} text="Loading measurement templates..." />
      </div>
    )
  }

  // Show error state for initial fetch errors
  if (error && !hasFetchedTemplates) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load measurement templates"
          message={error || "We couldn't load your measurement templates. Please try again."}
          onRetry={handleRetry}
          retryLabel="Retry"
          fullScreen={false}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
            <Ruler className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Measurement Templates</h1>
            <p className="text-gray-600 mt-1">Create and manage measurement templates for different clothing types</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="lg:sticky lg:top-6 h-fit">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingTemplateId ? 'Edit Measurement Template' : 'Create New Template'}
            </h2>

            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clothing Type / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senator Top, Trousers, Shirt"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white"
              />
            </div>

            {/* Measurement Fields */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Measurement Fields <span className="text-red-500">*</span>
                </label>
                <motion.button
                  onClick={handleAddField}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </motion.button>
              </div>

              <AnimatePresence>
                {measurementFields.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50"
                  >
                    <Ruler className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No measurement fields added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Field" to get started</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {measurementFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={`Measurement ${index + 1} (e.g., Chest, Waist, Length)`}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 bg-white"
                          />
                        </div>
                        <motion.button
                          onClick={() => handleRemoveField(field.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove field"
                        >
                          <X className="h-5 w-5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleSave}
                disabled={isSubmitting || isLoading}
                whileHover={isSubmitting || isLoading ? {} : { scale: 1.02 }}
                whileTap={isSubmitting || isLoading ? {} : { scale: 0.98 }}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <SewingMachineLoader size="sm" inline className="mr-2" />
                    {editingTemplateId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {editingTemplateId ? 'Update Template' : 'Save Template'}
                  </>
                )}
              </motion.button>
              {editingTemplateId && (
                <motion.button
                  onClick={handleCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Templates List */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Saved Templates ({templates.length})
            </h2>

            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No templates created yet</p>
                <p className="text-sm text-gray-500">Create your first measurement template to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {templates.map((template) => (
                    <motion.div
                      key={template._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {template.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {template.fields.map((field, index) => (
                              <span
                                key={`${template._id}-${index}`}
                                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                              >
                                {field.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <motion.button
                            onClick={() => handleEdit(template)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            aria-label="Edit template"
                          >
                            <Edit2 className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(template._id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete template"
                          >
                            <Trash2 className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-3">
                        {template.fields.length} measurement field{template.fields.length !== 1 ? 's' : ''}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

