'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, AlertCircle, Scissors } from 'lucide-react'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'

interface NewsletterProps {
  source?: string
  variant?: 'footer' | 'standalone'
  className?: string
}

export default function Newsletter({ source = 'unknown', variant = 'standalone', className = '' }: NewsletterProps) {
  const { sendHttpRequest, isLoading, error } = useHttp()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [success, setSuccess] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const validate = (): string | null => {
    if (!email.trim()) {
      return 'Please enter your email address.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.'
    }
    if (!consent) {
      return 'You must consent to receive email communications.'
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSuccess(false)

    const validationError = validate()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    sendHttpRequest({
      requestConfig: {
        method: 'POST',
        url: '/guest/newsletter',
        body: {
          email: email.trim().toLowerCase(),
          consent: true,
          source,
        },
        contentType: 'application/json',
        successMessage: 'Successfully subscribed to our newsletter!',
      },
      successRes: () => {
        setSuccess(true)
        setEmail('')
        setConsent(false)
        setTimeout(() => setSuccess(false), 5000)
      },
    })
  }

  if (variant === 'footer') {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="relative h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 shadow-md flex items-center justify-center overflow-hidden">
            <Scissors className="h-4 w-4 text-white flex-shrink-0" />
          </div>
          <h4 className="text-sm font-semibold text-apple-gray-900 uppercase tracking-wider">
            Newsletter
          </h4>
        </div>
        <p className="text-xs text-apple-gray-600 leading-relaxed">
          Get exclusive offers and tailoring insights delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-3.5 w-3.5 text-primary-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (localError) setLocalError(null)
                if (success) setSuccess(false)
              }}
              placeholder="your@email.com"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-primary-200 bg-white/90 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-apple-gray-900 placeholder-apple-gray-400 transition-all"
              disabled={isLoading || success}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-xs shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <>
                <span className="h-3 w-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Subscribed!</span>
              </>
            ) : (
              <>
                <Mail className="h-3 w-3" />
                <span>Subscribe</span>
              </>
            )}
          </button>
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id={`newsletter-consent-${source}`}
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (localError) setLocalError(null)
              }}
              className="mt-0.5 h-3.5 w-3.5 text-primary-600 border-primary-300 rounded focus:ring-primary-500 focus:ring-1 flex-shrink-0"
              disabled={isLoading || success}
            />
            <label
              htmlFor={`newsletter-consent-${source}`}
              className="text-[10px] text-apple-gray-500 leading-relaxed cursor-pointer"
            >
              I consent to receive email communications from Sequential Hub.
            </label>
          </div>
          {(localError || error) && (
            <div className="flex items-start gap-1.5 text-[10px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}
          {success && !localError && !error && (
            <div className="flex items-start gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
              <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Subscribed successfully!</span>
            </div>
          )}
        </form>
      </div>
    )
  }

  // Standalone variant (for homepage)
  return (
    <section className={`py-20 sm:py-24 lg:py-28 relative overflow-hidden ${className}`}>
      {/* Luxury blue gradient background with tailoring theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-primary-50/80 to-white"></div>
      
      {/* Decorative sewing elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231d4ed8' fill-opacity='1'%3E%3Cpath d='M30 0l5 10 10 5-10 5-5 10-5-10-10-5 10-5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Floating decorative circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-300/15 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo and icon header */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 shadow-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/icon/sewing-machine.png"
                alt="Sequential Hub"
                width={40}
                height={40}
                className="object-contain filter brightness-0 invert"
              />
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary-300 to-transparent"></div>
            <div className="relative h-14 w-14 rounded-xl bg-primary-100 border-2 border-primary-200 shadow-lg flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary-700" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
          >
            Stay Connected with Our Atelier
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Subscribe to receive exclusive offers, new collection launches, and expert tailoring
            insights delivered straight to your inbox. Join our community of discerning clients.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto space-y-4"
          >
            {/* Email input with luxury styling */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-primary-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (localError) setLocalError(null)
                  if (success) setSuccess(false)
                }}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-primary-200 bg-white/90 backdrop-blur-sm text-base focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-gray-900 placeholder-gray-400 shadow-sm transition-all"
                disabled={isLoading || success}
              />
              {/* Decorative border accent */}
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent transition-all duration-300 group-focus-within:w-full"></div>
            </div>

            {/* Subscribe button with gradient */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white font-semibold rounded-xl hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <span className="h-5 w-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <Scissors className="h-5 w-5" />
                  <span>Subscribe to Newsletter</span>
                </>
              )}
            </button>

            {/* Consent checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id={`newsletter-consent-standalone-${source}`}
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked)
                  if (localError) setLocalError(null)
                }}
                className="mt-0.5 h-4 w-4 text-primary-600 border-primary-300 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                disabled={isLoading || success}
              />
              <label
                htmlFor={`newsletter-consent-standalone-${source}`}
                className="text-sm text-gray-600 leading-relaxed cursor-pointer"
              >
                I consent to receive email communications about new products, exclusive offers, and
                tailoring updates from Sequential Hub. You can unsubscribe at any time.
              </label>
            </div>

            {/* Error message */}
            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{localError || error}</span>
              </motion.div>
            )}

            {/* Success message */}
            {success && !localError && !error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3"
              >
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Thank you for subscribing! Check your inbox for confirmation.</span>
              </motion.div>
            )}
          </motion.form>

          {/* Decorative bottom accent */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-primary-300 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  )
}































