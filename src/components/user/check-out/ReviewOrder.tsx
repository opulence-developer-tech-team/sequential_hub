'use client'

import { motion } from 'framer-motion'
import { CheckoutFormData } from './types'

interface ReviewOrderProps {
  formData: CheckoutFormData
}

export default function ReviewOrder({ formData }: ReviewOrderProps) {
  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">Review Your Order</h2>
      
      <div className="space-y-8">
        <div className="pb-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Shipping Address</h3>
          <p className="text-gray-600 leading-relaxed">
            {formData.firstName} {formData.lastName}<br />
            {formData.address}<br />
            {formData.city}, {formData.state} {formData.zipCode}<br />
            {formData.country}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Payment Method</h3>
          <p className="text-gray-600 leading-relaxed">
            Monnify Payment Gateway<br />
            You will be redirected to complete payment securely
          </p>
        </div>
      </div>
    </motion.div>
  )
}


































