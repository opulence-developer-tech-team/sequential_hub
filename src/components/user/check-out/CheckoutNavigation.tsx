'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

interface CheckoutNavigationProps {
  currentStep: number
  onBack: () => void
  onNext: () => void
  onProceedToPayment: () => void
  isProcessing: boolean
  isHttpLoading: boolean
  showGuestAccountModal: boolean
  submitButtonRef: React.RefObject<HTMLButtonElement | null>
}

export default function CheckoutNavigation({
  currentStep,
  onBack,
  onNext,
  onProceedToPayment,
  isProcessing,
  isHttpLoading,
  showGuestAccountModal,
  submitButtonRef,
}: CheckoutNavigationProps) {
  return (
    <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-100">
      <motion.button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        whileHover={currentStep !== 1 ? { scale: 1.02 } : {}}
        whileTap={currentStep !== 1 ? { scale: 0.98 } : {}}
        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-all"
      >
        Back
      </motion.button>
      
      {currentStep < 2 ? (
        <motion.button
          type="button"
          onClick={onNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium transition-all flex items-center gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      ) : (
        <motion.button
          type="button"
          ref={submitButtonRef}
          disabled={isProcessing || Boolean(isHttpLoading) || showGuestAccountModal}
          onClick={onProceedToPayment}
          whileHover={!isProcessing && !isHttpLoading && !showGuestAccountModal ? { scale: 1.02 } : {}}
          whileTap={!isProcessing && !isHttpLoading && !showGuestAccountModal ? { scale: 0.98 } : {}}
          className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
        >
          {isProcessing && !showGuestAccountModal ? 'Processing...' : 'Proceed to Payment'}
        </motion.button>
      )}
    </div>
  )
}

