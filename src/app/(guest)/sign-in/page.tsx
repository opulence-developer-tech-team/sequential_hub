'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'
import { AlertCircle, Eye, EyeOff, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setUserData } from '@/store/redux/user/user-data-slice'
import { authActions } from '@/store/redux/auth/auth-slice'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'

export default function SignInPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isLoading, sendHttpRequest: signInReq, error } = useHttp()
  const { isLoading: isFetchingUser, sendHttpRequest: fetchUserReq } = useHttp()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  // Custom email validation
  const validateEmail = (email: string): string | null => {
    if (!email || email.trim() === '') {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address'
    }
    return null
  }

  // Custom password validation
  const validatePassword = (password: string): string | null => {
    if (!password || password.trim() === '') {
      return 'Password is required'
    }
    return null
  }

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    
    const emailError = validateEmail(formData.email)
    if (emailError) {
      errors.email = emailError
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      errors.password = passwordError
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchUserSuccessResHandler = (response: any) => {
    // Store user data in Redux
    if (response?.data?.data) {
      dispatch(setUserData(response.data.data))
    }
    
    // Update auth state to authenticated
    dispatch(authActions.setAuthStatus(true))
    
    // Check if there's a redirect path stored (e.g., from wishlist action)
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectPath)
    } else {
      // Default redirect to account page
      router.push('/account')
    }
  }

  const signInSuccessResHandler = () => {
    // Authentication is handled via httpOnly cookies set by the server
    // No need to manually store tokens - the server sets 'user_auth_token' cookie
    // which is automatically sent with subsequent requests
    // This is the production-ready, secure approach (prevents XSS attacks)
    
    // Fetch user details after successful sign-in
    fetchUserReq({
      successRes: fetchUserSuccessResHandler,
      requestConfig: {
        url: '/user/fetch-user-details',
        method: 'GET',
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }

    signInReq({
      successRes: signInSuccessResHandler,
      errorRes: (errorResponse: any) => {
        // Check if the error is due to unverified email (403 status with requiresVerification)
        if (errorResponse?.status === 403 && errorResponse?.data?.data?.requiresVerification) {
          const email = errorResponse.data.data.email || formData.email.trim()
          // Show the email verification UI instead of navigating
          setVerificationEmail(email)
          setShowEmailVerification(true)
          // Return false to prevent default error handling (toast.error)
          return false
        }
        // Return true or undefined to allow default error handling
        return true
      },
      requestConfig: {
        url: '/auth/sign-in',
        method: 'POST',
        body: {
          email: formData.email.trim(),
          password: formData.password,
          rememberMe,
        },
        successMessage: 'Signed in successfully',
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

    if (name === 'email') {
      error = validateEmail(value)
    } else if (name === 'password') {
      error = validatePassword(value)
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

  return (
    <div className="min-h-screen bg-white bg-watermark relative flex items-center justify-center px-4 py-12">
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
                {/* Sewing Animation: Needle, Thread, and Stitches */}
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
                      <linearGradient id="signInThreadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="signInNeedleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="signInStitchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="1" />
                      </linearGradient>
                      <filter id="signInGlow">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Thread Spool - Rotating at top */}
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ transformOrigin: '50px 15px' }}
                      filter="url(#signInGlow)"
                    >
                      <circle cx="50" cy="15" r="4.5" fill="#0071e3" opacity="1" />
                      <rect x="46" y="15" width="8" height="5" rx="0.5" fill="#0ea5e9" opacity="1" />
                      <circle cx="50" cy="20" r="4.5" fill="#0071e3" opacity="1" />
                    </motion.g>

                    {/* Thread flowing down from spool */}
                    <motion.path
                      d="M 50 20 Q 48 30 50 40 Q 52 50 50 60"
                      stroke="#0071e3"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      filter="url(#signInGlow)"
                      animate={{
                        pathLength: [0, 1, 0],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />

                    {/* Needle - Moving up and down (sewing motion) */}
                    <motion.g
                      animate={{
                        y: [0, 8, 0],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ transformOrigin: '50px 50px' }}
                      filter="url(#signInGlow)"
                    >
                      <rect x="47.5" y="42" width="5" height="12" rx="1" fill="#0071e3" opacity="1" />
                      <circle cx="50" cy="47" r="1.2" fill="#ffffff" opacity="1" />
                      <circle cx="50" cy="47" r="0.8" fill="#0071e3" opacity="0.8" />
                      <path d="M 50 54 L 47 62 L 53 62 Z" fill="#0369a1" opacity="1" />
                      <line
                        x1="50"
                        y1="54"
                        x2="50"
                        y2="62"
                        stroke="#0071e3"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </motion.g>

                    {/* Presser Foot - Moves with needle */}
                    <motion.g
                      animate={{
                        y: [0, 1.5, 0],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.1,
                      }}
                      filter="url(#signInGlow)"
                    >
                      <rect x="47.5" y="54" width="5" height="2" rx="0.5" fill="#38bdf8" opacity="1" />
                      <path d="M 46 56 L 54 56 L 53 60 L 47 60 Z" fill="#0ea5e9" opacity="1" />
                    </motion.g>

                    {/* Stitch pattern forming */}
                    <motion.g
                      animate={{
                        opacity: [0.7, 1, 0.7],
                        scaleX: [0.95, 1, 0.95],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      filter="url(#signInGlow)"
                    >
                      <path
                        d="M 30 72 Q 35 70 40 72 T 50 72 T 60 72 T 70 72"
                        stroke="#0ea5e9"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </motion.g>

                    {/* Thread tension guide - Pulsing */}
                    <motion.circle
                      cx="50"
                      cy="35"
                      r="2.5"
                      fill="#0ea5e9"
                      opacity="1"
                      filter="url(#signInGlow)"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.9, 1, 0.9],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </svg>
                </motion.div>
              </motion.div>
              <h1 className="text-2xl font-semibold text-apple-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">
                Sequential Hub
              </h1>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-apple-gray-200 rounded-2xl p-8 shadow-sm">
            {showEmailVerification ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                    <Mail className="h-8 w-8 text-primary-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-apple-gray-900 mb-2">
                    Verify Your Email
                  </h1>
                  <p className="text-sm text-apple-gray-600">
                    We've sent a verification link to your email address. Please check your inbox to verify your account.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-apple-gray-900 mb-2">
                    Check your email
                  </h2>
                  <p className="text-sm text-apple-gray-600 mb-6">
                    We've sent a verification link to <strong>{verificationEmail}</strong>. Please check your inbox and click the link to verify your email address.
                  </p>
                  <div className="space-y-3">
                    <p className="text-xs text-apple-gray-500">
                      Didn't receive the email? Check your spam folder or try signing in again.
                    </p>
                    <button
                      onClick={() => {
                        setShowEmailVerification(false)
                        setVerificationEmail('')
                      }}
                      className="text-sm text-primary-600 hover:underline font-medium"
                    >
                      Back to sign in
                    </button>
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-apple-gray-900 mb-2 text-center">
                  Sign in
                </h2>
                <p className="text-sm text-apple-gray-600 text-center mb-8">
                  Use your email and password to continue
                </p>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-apple-gray-900 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`block w-full px-4 py-2.5 border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                    fieldErrors.email
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                  placeholder="name@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-apple-gray-900 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full px-4 py-2.5 pr-12 border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.password
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-apple-gray-500 hover:text-apple-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-apple-gray-300 rounded focus:ring-primary-500/20 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-apple-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-apple-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-apple-gray-500">New to Sequential Hub?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-apple-gray-300 text-apple-gray-900 font-medium rounded-lg hover:bg-apple-gray-50 focus:outline-none focus:ring-2 focus:ring-apple-gray-300 focus:ring-offset-2 transition-all duration-200 text-base"
              >
                Create your account
              </Link>
            </div>
              </>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-apple-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary-600 hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}



