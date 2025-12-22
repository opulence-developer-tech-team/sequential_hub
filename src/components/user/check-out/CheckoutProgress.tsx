'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface CheckoutProgressProps {
  currentStep: number
}

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="mb-16">
      <div className="flex items-center justify-center space-x-12">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                scale: currentStep === step ? 1.1 : 1,
              }}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold transition-all duration-300 ${
                currentStep >= step
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {currentStep > step ? (
                <Check className="h-5 w-5" />
              ) : (
                step
              )}
            </motion.div>
            <span className={`ml-3 text-sm font-medium transition-colors ${
              currentStep >= step ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {step === 1 ? 'Shipping' : 'Review'}
            </span>
            {step < 2 && (
              <motion.div
                initial={false}
                animate={{
                  width: currentStep > step ? 64 : 32,
                  backgroundColor: currentStep > step ? undefined : '#e5e7eb',
                }}
                className={`h-0.5 ml-6 transition-all duration-300 ${
                  currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}















































