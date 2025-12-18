'use client'

import MeasurementRequestSection from '@/components/MeasurementRequestSection'

export default function MeasurementsPage() {
  return (
    <div className="min-h-screen bg-white bg-watermark relative">
      <MeasurementRequestSection 
        className="min-h-screen flex items-center justify-center"
        containerClassName=""
      />
    </div>
  )
}
