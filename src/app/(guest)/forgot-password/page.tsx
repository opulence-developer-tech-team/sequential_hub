'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'
import { Mail, ArrowLeft, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isLoading, sendHttpRequest, error } = useHttp()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setSuccess(false)

    const validationError = validateEmail(email)
    if (validationError) {
      setEmailError(validationError)
      return
    }

    sendHttpRequest({
      successRes: (response: any) => {
        setSuccess(true)
        toast.success('Password reset link sent!', {
          description: 'Check your email for instructions to reset your password.',
        })
      },
      requestConfig: {
        url: '/auth/forgot-password',
        method: 'POST',
        body: {
          email: email.trim(),
        },
      },
    })
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError(null)
    }
    if (success) {
      setSuccess(false)
    }
  }

  const handleBlur = () => {
    const validationError = validateEmail(email)
    if (validationError) {
      setEmailError(validationError)
    }
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
                {/* Luxury Blue Thread Animation */}
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
                      <linearGradient id="forgotPasswordThreadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <filter id="forgotPasswordGlow">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Thread Spool - Rotating */}
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ transformOrigin: '50px 15px' }}
                      filter="url(#forgotPasswordGlow)"
                    >
                      <circle cx="50" cy="15" r="4.5" fill="#0071e3" opacity="1" />
                      <rect x="46" y="15" width="8" height="5" rx="0.5" fill="#0ea5e9" opacity="1" />
                      <circle cx="50" cy="20" r="4.5" fill="#0071e3" opacity="1" />
                    </motion.g>

                    {/* Thread flowing down */}
                    <motion.path
                      d="M 50 20 Q 48 30 50 40 Q 52 50 50 60"
                      stroke="#0071e3"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      filter="url(#forgotPasswordGlow)"
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

                    {/* Lock Icon Animation */}
                    <motion.g
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ transformOrigin: '50px 70px' }}
                    >
                      <rect x="45" y="65" width="10" height="12" rx="2" fill="none" stroke="#0071e3" strokeWidth="2.5" />
                      <path d="M 47 65 Q 47 60 50 60 Q 53 60 53 65" fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="50" cy="71" r="1.5" fill="#0071e3" />
                    </motion.g>
                  </svg>
                </motion.div>
              </motion.div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h1>
              <p className="text-sm text-gray-600">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="text-sm text-primary-600 hover:underline font-medium"
                  >
                    Try a different email
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleBlur}
                      className={`block w-full pl-12 pr-4 py-2.5 border rounded-lg bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                        emailError
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-600">{emailError}</p>
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Send reset link
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* Back to Sign In */}
            <div className="mt-6 text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Remember your password?{' '}
              <Link href="/sign-in" className="text-primary-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}




































