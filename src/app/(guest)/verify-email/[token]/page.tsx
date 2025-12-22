'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'
import { Mail, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'

export default function VerifyEmailPage() {
  const router = useRouter()
  const params = useParams()
  const tokenOrEmail = params.token as string
  const { isLoading: isVerifyingByToken, sendHttpRequest: verifyByTokenReq } = useHttp()
  const { isLoading: isResendingOtp, sendHttpRequest: resendOtpReq } = useHttp()
  
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasVerifiedRef = useRef(false)

  const isTokenMode = useMemo(() => /^[a-f0-9]{64}$/i.test(tokenOrEmail || ''), [tokenOrEmail])
  const emailFromParam = useMemo(() => {
    if (!tokenOrEmail || isTokenMode) return ''
    // Next route params are already decoded, but be defensive.
    try {
      return decodeURIComponent(tokenOrEmail).trim()
    } catch {
      return tokenOrEmail.trim()
    }
  }, [tokenOrEmail, isTokenMode])

  const isEmailMode = useMemo(() => {
    if (!emailFromParam) return false
    // Basic email format check for client UI gating (server still validates).
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFromParam)
  }, [emailFromParam])

  // Auto-verify ONLY when page loads with a real token from email (only once).
  useEffect(() => {
    // Prevent double verification (React Strict Mode causes double renders in dev)
    if (hasVerifiedRef.current || isVerified || isVerifying) {
      return
    }

    // In email-mode we do NOT auto-verify (user must enter OTP or click emailed link).
    if (!isTokenMode) {
      if (!isEmailMode) {
        setError('Invalid verification link')
      }
      return
    }

    hasVerifiedRef.current = true
    setIsVerifying(true)
    verifyByTokenReq({
      successRes: (res: any) => {
        setIsVerified(true)
        setIsVerifying(false)

        const messageFromServer: string | undefined = res?.data?.description
        const message =
          typeof messageFromServer === 'string' && messageFromServer.trim().length > 0
            ? messageFromServer.trim()
            : 'Email verified successfully!'

        toast.success(message, {
          description: 'Redirecting to sign in...',
        })

        // Redirect to sign-in page after 3 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 3000)
      },
      errorRes: (errorResponse: any) => {
        setIsVerifying(false)
        const errorMessage = errorResponse?.data?.description || 'Failed to verify email. The link may be invalid or expired.'
        setError(errorMessage)
        toast.error(errorMessage)
      },
      requestConfig: {
        url: `/auth/verify-email-token/${tokenOrEmail}`,
        method: 'GET',
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenOrEmail, isTokenMode, isEmailMode])

  const handleResendOtp = () => {
    if (!isEmailMode) {
      toast.error('Invalid email for resend.')
      return
    }
    resendOtpReq({
      successRes: () => {
        toast.success('Verification email sent. Please check your inbox.')
      },
      errorRes: (errorResponse: any) => {
        const errorMessage =
          errorResponse?.data?.description || 'Failed to resend OTP. Please try again.'
        toast.error(errorMessage)
      },
      requestConfig: {
        url: '/auth/resend-otp',
        method: 'POST',
        body: { email: emailFromParam },
      },
    })
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
                      <linearGradient id="verifyEmailThreadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <filter id="verifyEmailGlow">
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
                      filter="url(#verifyEmailGlow)"
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
                      filter="url(#verifyEmailGlow)"
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

                    {/* Mail Icon Animation */}
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
                      <rect x="42" y="65" width="16" height="12" rx="2" fill="none" stroke="#0071e3" strokeWidth="2.5" />
                      <path d="M 42 65 L 50 72 L 58 65" fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" />
                    </motion.g>
                  </svg>
                </motion.div>
              </motion.div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {isVerifying ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-primary-600/30 border-t-primary-600 rounded-full"
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying your email...
                </h2>
                <p className="text-sm text-gray-600">
                  Please wait while we verify your email address.
                </p>
              </motion.div>
            ) : isVerified ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Verified!
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Your email has been verified successfully. You will be redirected to the sign-in page shortly.
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center text-sm text-primary-600 hover:underline font-medium"
                >
                  Go to sign in now
                </Link>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Verification Failed
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  {error}
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    The verification link may have expired or is invalid. Please login to request a new verification link if email is not verified.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/sign-in"
                      className="inline-flex items-center justify-center px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Go to sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
                    >
                      Create a new account
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : isEmailMode ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                  <Mail className="h-8 w-8 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
                <p className="text-sm text-gray-600 mb-6">
                  We sent a verification link to <strong>{emailFromParam}</strong>. Open your inbox and click the link to verify your email.
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleResendOtp}
                    disabled={isResendingOtp}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {isResendingOtp ? 'Resending…' : 'Resend verification email'}
                  </button>

                  <button
                    onClick={() => router.push('/sign-in')}
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors font-medium"
                  >
                    Go to sign in
                  </button>

                  <p className="text-xs text-gray-500">
                    Tip: Check your spam/junk folder. The link expires after a limited time.
                  </p>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Footer Links */}
          {!isVerifying && (
            <div className="mt-8 text-center space-y-2">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <Link href="/contact" className="text-primary-600 hover:underline font-medium">
                  Contact us
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}






































