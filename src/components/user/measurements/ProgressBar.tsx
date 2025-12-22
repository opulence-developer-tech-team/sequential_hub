import { motion } from 'framer-motion'
import { User, Shirt, Ruler, CheckCircle2 } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
}

const stepLabels = ['Personal Info', 'Category', 'Measurements', 'Review']
const stepIcons = [User, Shirt, Ruler, CheckCircle2]

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const steps = [1, 2, 3, 4]
  const circleSize = 'w-10 h-10 sm:w-12 sm:h-14'
  const circleCenter = 'top-5 sm:top-7' // Center of circle for line alignment
  
  return (
    <div className="w-full py-4 sm:py-5">
      <div className="relative w-full">
        {/* Background track line - spans full width */}
        <div className={`absolute ${circleCenter} left-0 right-0 h-0.5 sm:h-1 bg-white/20 rounded-full`} />
        
        {/* Progress fill line */}
        <motion.div
          className={`absolute ${circleCenter} left-0 h-0.5 sm:h-1 bg-primary-400 rounded-full z-[1]`}
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentStep - 1) / 3) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* Steps container - using grid for perfect equal spacing */}
        <div className="relative grid grid-cols-4 gap-0 w-full z-10">
          {steps.map((step) => {
            const Icon = stepIcons[step - 1]
            const isActive = step === currentStep
            const isCompleted = step < currentStep
            
            return (
              <div
                key={step}
                className="relative flex flex-col items-center"
              >
                {/* Step Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={`${circleSize} rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                    isCompleted
                      ? 'bg-primary-500 text-white shadow-lg'
                      : isActive
                      ? 'bg-primary-500 text-white shadow-lg ring-4 ring-primary-300/30'
                      : 'bg-white/10 text-white/70 border-2 border-white/30'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </motion.div>
                
                {/* Label */}
                <span
                  className={`mt-2 sm:mt-3 text-[10px] sm:text-xs font-medium text-center px-0.5 ${
                    isActive
                      ? 'text-white font-semibold'
                      : isCompleted
                      ? 'text-white/90'
                      : 'text-white/60'
                  }`}
                >
                  {/* Mobile: Show first word only */}
                  <span className="block sm:hidden truncate max-w-[60px]">
                    {stepLabels[step - 1].split(' ')[0]}
                  </span>
                  {/* Desktop: Show full label */}
                  <span className="hidden sm:block whitespace-nowrap">
                    {stepLabels[step - 1]}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

















































