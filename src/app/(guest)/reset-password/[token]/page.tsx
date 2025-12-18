'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const { isLoading, sendHttpRequest, error } = useHttp()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link', {
        description: 'The password reset link is invalid or has expired.',
      })
      router.push('/forgot-password')
    }
  }, [token, router])

  const validatePassword = (password: string): string | null => {
    if (!password || password.trim() === '') {
      return 'Password is required'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    // Check for uppercase, lowercase, and number
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordPattern.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    return null
  }

  const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
    if (!confirmPassword || confirmPassword.trim() === '') {
      return 'Please confirm your password'
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match'
    }
    return null
  }

  const validateForm = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {}
    
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      errors.password = passwordError
    }

    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password)
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!validateForm() || !token) {
      return
    }

    sendHttpRequest({
      successRes: (response: any) => {
        setSuccess(true)
        toast.success('Password reset successful!', {
          description: 'Your password has been reset. You can now sign in with your new password.',
        })
        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 3000)
      },
      requestConfig: {
        url: '/auth/reset-password',
        method: 'POST',
        body: {
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
      },
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof typeof fieldErrors]
        return newErrors
      })
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let error: string | null = null

    if (name === 'password') {
      error = validatePassword(value)
    } else if (name === 'confirmPassword') {
      error = validateConfirmPassword(value, formData.password)
    }

    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error! }))
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof typeof fieldErrors]
        return newErrors
      })
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 bg-watermark relative flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo/Brand */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex flex-col items-center gap-3 group">
              {/* Sewing Machine Logo with Animation */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative w-16 h-16 flex items-center justify-center"
              >
                <Image
                  src={sewingMachineIcon}
                  alt="Sequential Hub Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                  priority
                />
                {/* Luxury Blue Lock Animation */}
                <motion.div
                  className="absolute inset-0 pointer-events-none overflow-visible"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="resetPasswordGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <filter id="resetPasswordGlow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Lock Icon with Animation */}
                    <motion.g
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.9, 1, 0.9],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ transformOrigin: '50px 70px' }}
                      filter="url(#resetPasswordGlow)"
                    >
                      <rect x="42" y="62" width="16" height="18" rx="3" fill="none" stroke="#0071e3" strokeWidth="3" />
                      <path d="M 45 62 Q 45 55 50 55 Q 55 55 55 62" fill="none" stroke="#0071e3" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="50" cy="71" r="2.5" fill="#0071e3" />
                      
                      {/* Keyhole glow */}
                      <motion.circle
                        cx="50"
                        cy="71"
                        r="3"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="1"
                        opacity="0.5"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </motion.g>

                    {/* Decorative Thread Lines */}
                    <motion.path
                      d="M 30 50 L 50 50"
                      stroke="#0071e3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.6"
                      animate={{
                        pathLength: [0, 1, 0],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.path
                      d="M 50 50 L 70 50"
                      stroke="#0071e3"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.6"
                      animate={{
                        pathLength: [0, 1, 0],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.3,
                      }}
                    />
                  </svg>
                </motion.div>
              </motion.div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Password reset successful!
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Your password has been reset successfully. You will be redirected to the sign-in page shortly.
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center text-sm text-primary-600 hover:underline font-medium"
                >
                  Go to sign in
                  <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                </Link>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                    <Lock className="h-8 w-8 text-primary-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Reset Password
                  </h1>
                  <p className="text-sm text-gray-600">
                    Enter your new password below. It must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`block w-full pl-12 pr-12 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.password
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`block w-full pl-12 pr-12 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                          fieldErrors.confirmPassword
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                    )}
                    {error && (
                      <p className="mt-1.5 text-xs text-red-600">{error}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                        />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Reset Password
                      </>
                    )}
                  </motion.button>
                </form>
              </>
            )}

            {/* Back to Sign In */}
            {!success && (
              <div className="mt-6 text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </Link>
              </div>
            )}
          </div>

          {/* Footer Links */}
          {!success && (
            <div className="mt-8 text-center space-y-2">
              <p className="text-xs text-gray-500">
                Remember your password?{' '}
                <Link href="/sign-in" className="text-primary-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}































