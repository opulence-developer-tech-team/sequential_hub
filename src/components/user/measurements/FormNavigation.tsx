import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'

interface FormNavigationProps {
  currentStep: number
  isSubmitting: boolean
  onPrevious: () => void
  onNext: () => void
  onSubmit?: () => void
  isModalOpen?: boolean
}

export default function FormNavigation({ currentStep, isSubmitting, onPrevious, onNext, onSubmit, isModalOpen = false }: FormNavigationProps) {
  return (
    <div className="flex justify-between items-center mt-10 pt-6 border-t-2 border-gray-200">
      <motion.button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        whileHover={currentStep > 1 ? { scale: 1.05 } : {}}
        whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
        className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
          currentStep === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-600 text-white hover:bg-gray-700 shadow-md hover:shadow-lg'
        }`}
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Previous
      </motion.button>
      
      {currentStep < 4 ? (
        <motion.button
          type="button"
          onClick={onNext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
        >
          Next
          <ArrowRight className="h-5 w-5 ml-2" />
        </motion.button>
      ) : (
        <motion.button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onSubmit) {
              onSubmit()
            }
          }}
          disabled={isSubmitting && !isModalOpen}
          whileHover={!isSubmitting || isModalOpen ? { scale: 1.05 } : {}}
          whileTap={!isSubmitting || isModalOpen ? { scale: 0.95 } : {}}
          className={`flex items-center px-8 py-3 rounded-lg font-semibold shadow-md transition-all ${
            isSubmitting && !isModalOpen
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
          }`}
        >
          {isSubmitting && !isModalOpen ? (
            <>
              <SewingMachineLoader size="sm" inline className="mr-2 text-white" />
              Submitting...
            </>
          ) : (
            <>
              Submit Measurements
              <CheckCircle2 className="h-5 w-5 ml-2" />
            </>
          )}
        </motion.button>
      )}
    </div>
  )
}




