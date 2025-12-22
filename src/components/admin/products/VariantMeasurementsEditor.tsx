'use client'

import React from 'react'

export const MEASUREMENT_FIELDS = [
  'neck',
  'shoulder',
  'chest',
  'shortSleeve',
  'longSleeve',
  'roundSleeve',
  'tummy',
  'topLength',
  'waist',
  'laps',
  'kneelLength',
  'roundKneel',
  'trouserLength',
  'quarterLength',
  'ankle',
] as const

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]

export const MEASUREMENT_LABELS: Record<MeasurementField, string> = {
  neck: 'Neck',
  shoulder: 'Shoulder',
  chest: 'Chest',
  shortSleeve: 'Short sleeve',
  longSleeve: 'Long sleeve',
  roundSleeve: 'Round sleeve',
  tummy: 'Tummy',
  topLength: 'Top length',
  waist: 'Waist',
  laps: 'Laps',
  kneelLength: 'Kneel length',
  roundKneel: 'Round kneel',
  trouserLength: 'Trouser length',
  quarterLength: 'Quarter length',
  ankle: 'Ankle',
}

interface VariantMeasurementsEditorProps {
  index: number
  measurements: Partial<Record<MeasurementField, number | undefined>>
  errors: Record<string, string>
  minCountErrorKey: string
  minRequired?: number
  onChange: (field: MeasurementField, value: number | undefined) => void
  clearError: (key: string) => void
}

export default function VariantMeasurementsEditor({
  index,
  measurements,
  errors,
  minCountErrorKey,
  minRequired = 5,
  onChange,
  clearError,
}: VariantMeasurementsEditorProps) {
  const currentFilledCount = MEASUREMENT_FIELDS.reduce((count, field) => {
    const value = measurements[field]
    return value !== undefined && value !== null ? count + 1 : count
  }, 0)

  return (
    <div className="mt-3 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
          Measurements (inches)
        </span>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-medium ${
            currentFilledCount >= minRequired
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {currentFilledCount} / {MEASUREMENT_FIELDS.length} filled
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        Provide at least <span className="font-semibold">{minRequired}</span> key measurements for a better fit.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEASUREMENT_FIELDS.map((field) => {
          const fieldErrorKey = `variant_${index}_measurements_${field}`
          const fieldError = errors[fieldErrorKey]

          return (
            <div key={field}>
              <label className="block text-[11px] font-medium text-gray-700 mb-1 leading-normal break-words whitespace-normal">
                <span>{MEASUREMENT_LABELS[field]}</span>{' '}
                <span className="text-[10px] text-gray-500">(inches)</span>
              </label>
              <input
                type="number"
                min="0"
                value={measurements[field] ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value)

                  // Update measurements in parent
                  onChange(field, value)

                  // Clear field-level error if any
                  if (fieldError) {
                    clearError(fieldErrorKey)
                  }

                  // Recompute filled count including this new value
                  const nextMeasurements = {
                    ...measurements,
                    [field]: value,
                  }
                  const nextFilledCount = MEASUREMENT_FIELDS.reduce((count, f) => {
                    const v = nextMeasurements[f]
                    return v !== undefined && v !== null ? count + 1 : count
                  }, 0)

                  // If we now meet the minimum, clear the min-count error
                  if (nextFilledCount >= minRequired && errors[minCountErrorKey]) {
                    clearError(minCountErrorKey)
                  }
                }}
                className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black ${
                  fieldError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. 42"
              />
              {fieldError && (
                <p className="mt-1 text-[10px] text-red-600">
                  {fieldError}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {errors[minCountErrorKey] && (
        <p className="mt-3 text-[11px] text-red-600 font-medium">
          {errors[minCountErrorKey]}
        </p>
      )}
    </div>
  )
}








































