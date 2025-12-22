'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Ruler, Scissors, Send } from 'lucide-react'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'

interface ContactFormData {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  orderNumber?: string
  preferredContact: 'email' | 'phone'
}

const initialFormData: ContactFormData = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  orderNumber: '',
  preferredContact: 'email',
}

export default function ContactPage() {
  const { sendHttpRequest, isLoading, error } = useHttp()
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (localError) setLocalError(null)
  }

  const handlePreferredChange = (value: 'email' | 'phone') => {
    setFormData((prev) => ({
      ...prev,
      preferredContact: value,
    }))
    if (localError) setLocalError(null)
  }

  const validate = (): string | null => {
    if (!formData.fullName.trim()) return 'Please enter your full name.'

    const email = formData.email.trim()
    const phone = formData.phone.trim()

    if (formData.preferredContact === 'email') {
      if (!email) return 'Please enter your email address.'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return 'Please enter a valid email address.'
    } else {
      if (!phone) return 'Please enter your phone number.'
      if (phone.length < 7) return 'Please enter a valid phone number.'
    }

    if (!formData.subject.trim()) return 'Please enter a subject.'
    if (!formData.message.trim() || formData.message.trim().length < 20) {
      return 'Please provide at least 20 characters in your message so our tailors can assist you properly.'
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessMessage(null)

    const validationError = validate()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    const email = formData.email.trim()
    const phone = formData.phone.trim()

    sendHttpRequest({
      requestConfig: {
        method: 'POST',
        url: '/guest/contact',
        body: {
          fullName: formData.fullName.trim(),
          email: email || undefined,
          phone: phone || undefined,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          orderNumber: formData.orderNumber?.trim() || undefined,
          preferredContact: formData.preferredContact,
        },
        contentType: 'application/json',
        successMessage: 'Your message has been sent to our master tailors.',
      },
      successRes: () => {
        setSuccessMessage(
          'Thank you for reaching out. Our team will get back to you within 1–2 business days.'
        )
        setFormData(initialFormData)
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 sm:mb-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 shadow-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/icon/sewing-machine.png"
                alt="Sequential Hub Logo"
                width={40}
                height={40}
                className="object-contain brightness-0 invert"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                Contact Sequential Hub
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Premium tailoring support for your custom pieces and orders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary-600" />
              <span>Precision measurements</span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary-600" />
              <span>Master tailoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-600" />
              <span>Response within 1–2 business days</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Contact details / Story */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 lg:col-span-1"
          >
            <div className="rounded-2xl border border-primary-100 bg-white/90 shadow-md p-6 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-primary-700 uppercase tracking-[0.2em] mb-1">
                  Tailors Studio
                </h2>
                <p className="text-base font-semibold text-gray-900">
                  Let&apos;s talk about your next clothing.
                </p>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  Share your ideas, questions, or order concerns and our team will respond with the
                  same level of care we put into every stitch.
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
                    <Mail className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">
                      We typically reply within 24 to 48 hours on business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
                    <Phone className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-0 leading-tight">
                      <span className="block mb-0.5">Phone (Mon-Fri)</span>
                      <span className="text-gray-600 text-sm font-normal">+234 (0) 000 000 0000</span>
                      <br />
                      <span className="text-xs text-gray-500 mt-1">
                      For urgent clothing or fitting issues, please include your order number in the
                      message form.
                    </span>
                    </p>
                    
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
                    <MapPin className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Atelier</p>
                    <p className="text-gray-600 text-sm">
                      Lagos, Nigeria
                      <br />
                      By appointment only
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-5 space-y-3">
              <p className="text-sm font-semibold text-primary-800 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Measurement Questions?
              </p>
              <p className="text-xs text-primary-800/80 leading-relaxed">
                If your question is about sizing or fit, include your{' '}
                <span className="font-semibold">order number</span> and any measurements you&apos;ve
                already shared so our tailors can advise precisely.
              </p>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-gray-100 bg-white/95 shadow-lg p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Send a message to our tailoring team
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  All fields marked with * are required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. Adewale John"
                    />
                  </div>
                  <div>
                    {formData.preferredContact === 'email' ? (
                      <>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Email address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="you@example.com"
                        />
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Phone number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="+234 801 234 5678"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. Fitting issue with my senator set"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order number (optional)
                    </label>
                    <input
                      type="text"
                      name="orderNumber"
                      value={formData.orderNumber || ''}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. ORD-20240115-ABC123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    How should we contact you?
                  </label>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handlePreferredChange('email')}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border ${
                        formData.preferredContact === 'email'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreferredChange('phone')}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border ${
                        formData.preferredContact === 'phone'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      <Phone className="h-3 w-3" />
                      <span>Phone</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your request, clothing, or question. The more details you share, the better we can help."
                  />
                </div>

                {localError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                    {localError}
                  </p>
                )}
                {!localError && error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                    {error}
                  </p>
                )}
                {successMessage && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
                    {successMessage}
                  </p>
                )}

                <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-gray-400 max-w-none sm:max-w-xs">
                    By submitting this form, you agree that we may contact you regarding your
                    request and related tailoring services.
                  </p>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}






































