'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Eye, EyeOff, Info, Scissors, Ruler, UserPlus, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface GuestAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateAccount: (password: string, confirmPassword: string) => void
  onContinueAsGuest: () => void
  email: string
  isSubmitting?: boolean
  context?: 'measurement' | 'checkout' // Context to determine which text to show
}

export default function GuestAccountModal({
  isOpen,
  onClose,
  onCreateAccount,
  onContinueAsGuest,
  email,
  isSubmitting = false,
  context = 'measurement'
}: GuestAccountModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateAccount = () => {
    if (validateForm()) {
      onCreateAccount(password, confirmPassword)
      // Reset form
      setPassword('')
      setConfirmPassword('')
      setErrors({})
      // Scroll to top when submitting
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }

  const handleContinueAsGuest = () => {
    onContinueAsGuest()
    // Reset form
    setPassword('')
    setConfirmPassword('')
    setErrors({})
    // Scroll to top when continuing as guest
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handleClose = () => {
    setPassword('')
    setConfirmPassword('')
    setErrors({})
    onClose()
    // Scroll to top when modal closes
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[100000000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-apple-gray-200 relative"
        >

          {/* Header with Tailor Theme */}
          <div className="relative bg-gradient-to-r from-primary-50 via-blue-50 to-primary-50 border-b border-primary-100/50 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Scissors className="h-7 w-7 text-white" strokeWidth={2.5} />
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="h-5 w-5 text-primary-400" />
                  </motion.div>
                </motion.div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-apple-gray-900 mb-1 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary-600" />
                    Create Your Account
                  </h2>
                  <p className="text-sm text-apple-gray-600 leading-relaxed">
                    {context === 'measurement' 
                      ? 'Create an account to track your measurement orders and save your information for faster checkout next time'
                      : 'Create an account to track your orders and save your information for faster checkout next time'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-apple-gray-400 hover:text-apple-gray-700 hover:bg-white/50 rounded-lg p-1.5 transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Decorative Elements */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-primary-200/50">
              <Ruler className="h-4 w-4 text-primary-600" />
              <div className="flex-1 h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
              <div className="text-xs font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
                Optional
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
              <Ruler className="h-4 w-4 text-primary-600" />
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">

            {/* Account Creation Form */}
            <div className="space-y-5 mb-6">
              {/* Email Display */}
              <div className="relative p-4 bg-white border-2 border-apple-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-apple-gray-500 uppercase tracking-wide mb-1">
                      Your Email Address
                    </p>
                    <p className="text-sm font-medium text-apple-gray-900 truncate">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-apple-gray-800 mb-2.5">
                  <Lock className="h-4 w-4 text-primary-600" />
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }))
                      }
                    }}
                    className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-600 transition-all text-apple-gray-900 font-medium ${
                      errors.password 
                        ? 'border-red-400 bg-red-50 focus:ring-red-500/50 focus:border-red-500' 
                        : 'border-apple-gray-300 bg-white hover:border-apple-gray-400'
                    }`}
                    placeholder="Min 8 chars: uppercase, lowercase, number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                  >
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.password}</span>
                  </motion.p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-apple-gray-800 mb-2.5">
                  <Lock className="h-4 w-4 text-primary-600" />
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: undefined }))
                      }
                    }}
                    className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-600 transition-all text-apple-gray-900 font-medium ${
                      errors.confirmPassword 
                        ? 'border-red-400 bg-red-50 focus:ring-red-500/50 focus:border-red-500' 
                        : 'border-apple-gray-300 bg-white hover:border-apple-gray-400'
                    }`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1.5"
                  >
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.confirmPassword}</span>
                  </motion.p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                type="button"
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                onClick={handleCreateAccount}
                className={`w-full py-3.5 px-6 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/30'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Account & Submit Order
                  </>
                )}
              </motion.button>
              
              <motion.button
                type="button"
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                onClick={handleContinueAsGuest}
                className={`w-full border-2 py-3.5 px-6 rounded-xl transition-all duration-200 font-semibold ${
                  isSubmitting
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-apple-gray-300 text-apple-gray-700 hover:border-apple-gray-400 hover:bg-apple-gray-50'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Continue as Guest'}
              </motion.button>
            </div>

            {/* Guest Instructions */}
            <div className="mt-6 p-5 bg-white border-2 border-apple-gray-200 rounded-xl shadow-md" style={{ backgroundColor: '#ffffff' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Ruler className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-apple-gray-900 mb-1.5">Continue as Guest?</h3>
                  <p className="text-xs text-apple-gray-600 leading-relaxed mb-3">
                    {context === 'measurement'
                      ? 'No problem! You can track your custom measurement order using your order number. After submission, you\'ll receive a unique order number to monitor your order status.'
                      : 'No problem! You can track your order using your order number. After payment, you\'ll receive a unique order number to monitor your order status.'
                    }
                  </p>
                  <Link
                    href="/track-order"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors group"
                  >
                    <span>Track Your Order</span>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="inline-block"
                    >
                      →
                    </motion.span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Decoration */}
          <div className="relative border-t border-apple-gray-200/50 bg-gradient-to-r from-primary-50/30 via-transparent to-primary-50/30 p-4">
            <div className="flex items-center justify-center gap-2 text-xs text-apple-gray-500">
              <Scissors className="h-3.5 w-3.5" />
              <span className="font-medium">Crafted with Precision</span>
              <Scissors className="h-3.5 w-3.5" />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

