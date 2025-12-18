'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MeasurementForm from '@/components/MeasurementForm'
import { Ruler, Scissors, Sparkles, ArrowRight, CheckCircle2, Award, Clock } from 'lucide-react'

interface MeasurementRequestSectionProps {
  className?: string
  containerClassName?: string
}

export default function MeasurementRequestSection({ 
  className = '',
  containerClassName = ''
}: MeasurementRequestSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const handleStartMeasurement = () => {
    // Show form first
    setShowForm(true)
  }

  // Scroll to form when it becomes visible (fallback if onAnimationComplete doesn't fire)
  useEffect(() => {
    if (showForm) {
      const scrollTimeout = setTimeout(() => {
        if (formRef.current) {
          const rect = formRef.current.getBoundingClientRect()
          if (rect.height > 0) {
            const elementTop = rect.top + window.pageYOffset
            window.scrollTo({
              top: elementTop - 20,
              behavior: 'smooth'
            })
          }
        }
      }, 800) // Wait for animation to complete (600ms) + buffer
      
      return () => clearTimeout(scrollTimeout)
    }
  }, [showForm])

  return (
    <div className={`w-full ${containerClassName}`}>
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            // Trigger as soon as any part enters the viewport
            viewport={{ once: true, amount: 0 }}
            exit={{ opacity: 0, y: -100, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full py-12 px-4 ${className}`}
          >
            <div className="max-w-4xl mx-auto">
              {/* Main Hero Section */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: 0.02, duration: 0.35 }}
                className="text-center mb-12"
              >
                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0.9, rotate: -6, opacity: 0 }}
                  whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0 }}
                  transition={{ delay: 0.04, type: 'spring', stiffness: 220, damping: 20 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl shadow-2xl mb-8"
                >
                  <Ruler className="h-12 w-12 text-white" strokeWidth={2} />
                </motion.div>

                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                  Request for Measurement
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
                  Experience the art of custom tailoring
                </p>
                <p className="text-lg text-gray-500 max-w-xl mx-auto">
                  Get perfectly fitted clothing tailored to your exact measurements by our master tailors
                </p>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: 0.04, duration: 0.35 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
              >
                {[
                  {
                    icon: Scissors,
                    title: 'Master Tailors',
                    description: 'Expert craftsmen with years of experience',
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    icon: Award,
                    title: 'Premium Quality',
                    description: 'Finest fabrics and meticulous attention to detail',
                    color: 'from-purple-500 to-purple-600'
                  },
                  {
                    icon: Clock,
                    title: 'Fast Turnaround',
                    description: 'Quick delivery without compromising quality',
                    color: 'from-green-500 to-green-600'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ y: 8, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, amount: 0 }}
                    transition={{ delay: 0.06 + index * 0.04, duration: 0.3 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                      <feature.icon className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Benefits List */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: 0.06, duration: 0.35 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 md:p-10 border border-gray-200 shadow-lg mb-12"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Tailoring Service?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Precision measurements for perfect fit',
                    'Custom design consultation available',
                    'Wide selection of premium fabrics',
                    'Professional fitting sessions',
                    'Lifetime alterations guarantee',
                    'Expert style recommendations'
                  ].map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      initial={{ x: -12, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0 }}
                      transition={{ delay: 0.08 + index * 0.03, duration: 0.3 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="text-center"
              >
                <motion.button
                  onClick={handleStartMeasurement}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-primary-600/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  
                  <span className="relative z-10 flex items-center flex-wrap justify-center gap-2 sm:gap-0">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-0 sm:mr-3 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      <span className="hidden sm:inline">Start Your Measurement Request</span>
                      <span className="sm:hidden">Start Measurement</span>
                    </span>
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 ml-0 sm:ml-3 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
                  </span>
                </motion.button>
                
                <p className="mt-4 text-sm text-gray-500 px-2">
                  It only takes a few minutes to get started
                </p>
              </motion.div>

              {/* Decorative Elements */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mt-12 flex justify-center space-x-8 text-gray-400"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Scissors className="h-8 w-8" strokeWidth={1.5} />
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Ruler className="h-8 w-8" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            ref={formRef}
            key="form"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => {
              // Scroll to form after animation completes
              if (formRef.current) {
                const rect = formRef.current.getBoundingClientRect()
                const elementTop = rect.top + window.pageYOffset
                window.scrollTo({
                  top: elementTop - 20, // 20px offset from top
                  behavior: 'smooth'
                })
              }
            }}
            className="w-full py-8"
          >
            <MeasurementForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

