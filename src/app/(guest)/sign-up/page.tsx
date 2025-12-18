'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useHttp } from '@/hooks/useHttp'
import { AlertCircle, Eye, EyeOff, ChevronDown, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'
import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'

export default function SignUpPage() {
  const router = useRouter()
  const { isLoading, sendHttpRequest: signUpReq, error } = useHttp()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [selectedCountry, setSelectedCountry] = useState<Country>(worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0])
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Filter countries based on search query
  const filteredCountries = worldCountries.filter(country =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    country.phoneCode.includes(countrySearchQuery) ||
    country.countryCode.toLowerCase().includes(countrySearchQuery.toLowerCase())
  )
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false)
        setCountrySearchQuery('')
      }
    }
    
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCountryDropdownOpen])
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    password?: string
    confirmPassword?: string
  }>({})

  // Custom validation functions
  const validateFirstName = (firstName: string): string | null => {
    if (!firstName || firstName.trim() === '') {
      return 'First name is required'
    }
    if (firstName.trim().length < 2) {
      return 'First name must be at least 2 characters'
    }
    if (firstName.trim().length > 50) {
      return 'First name must not exceed 50 characters'
    }
    return null
  }

  const validateLastName = (lastName: string): string | null => {
    if (!lastName || lastName.trim() === '') {
      return 'Last name is required'
    }
    if (lastName.trim().length < 2) {
      return 'Last name must be at least 2 characters'
    }
    if (lastName.trim().length > 50) {
      return 'Last name must not exceed 50 characters'
    }
    return null
  }

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

  const validatePhoneNumber = (phoneNumber: string, countryCode: string): string | null => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return 'Phone number is required'
    }
    
    const trimmedPhone = phoneNumber.trim()
    
    // Remove all formatting characters (spaces, hyphens, parentheses, dots)
    const cleanedPhone = trimmedPhone.replace(/[\s\-\(\)\.]/g, '')
    
    // Must contain only digits
    if (!/^\d+$/.test(cleanedPhone)) {
      return 'Phone number can only contain digits, spaces, hyphens, and parentheses'
    }
    
    // Length validation (typically 7-15 digits for the number part, excluding country code)
    if (cleanedPhone.length < 7) {
      return 'Phone number is too short'
    }
    
    if (cleanedPhone.length > 15) {
      return 'Phone number is too long. Maximum 15 digits allowed'
    }
    
    // Validate country code exists in our list
    const country = worldCountries.find(c => c.phoneCode === countryCode)
    if (!country) {
      return 'Invalid country code selected'
    }
    
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password || password.trim() === '') {
      return 'Password is required'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
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

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}
    
    const firstNameError = validateFirstName(formData.firstName)
    if (firstNameError) errors.firstName = firstNameError

    const lastNameError = validateLastName(formData.lastName)
    if (lastNameError) errors.lastName = lastNameError

    const emailError = validateEmail(formData.email)
    if (emailError) errors.email = emailError

    const phoneError = validatePhoneNumber(formData.phoneNumber, selectedCountry.phoneCode)
    if (phoneError) errors.phoneNumber = phoneError

    const passwordError = validatePassword(formData.password)
    if (passwordError) errors.password = passwordError

    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const signUpSuccessResHandler = (responseData?: any) => {
    // Authentication is handled via httpOnly cookies set by the server
    // No need to manually store tokens - the server sets 'user_auth_token' cookie
    // which is automatically sent with subsequent requests
    // This is the production-ready, secure approach (prevents XSS attacks)
    
    // PRODUCTION: Never rely on verification tokens returned to the client.
    // After sign-up, we route using the email only so the user can enter the OTP
    // (or click the verification link sent to their email).
    const email = formData.email.trim()
    router.push(`/verify-email/${encodeURIComponent(email)}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    signUpReq({
      successRes: signUpSuccessResHandler,
      requestConfig: {
        url: '/auth/sign-up',
        method: 'POST',
        body: {
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phoneNumber: `${selectedCountry.phoneCode}${formData.phoneNumber.trim().replace(/[\s\-\(\)\.]/g, '')}`,
        },
        successMessage: 'Account created successfully',
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

    // Special handling for confirm password - validate against password
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, value)
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmError || undefined,
      }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let error: string | null = null

    if (name === 'firstName') {
      error = validateFirstName(value)
    } else if (name === 'lastName') {
      error = validateLastName(value)
    } else if (name === 'email') {
      error = validateEmail(value)
    } else if (name === 'phoneNumber') {
      error = validatePhoneNumber(value, selectedCountry.phoneCode)
    } else if (name === 'password') {
      error = validatePassword(value)
      // Also validate confirm password if it has a value
      if (formData.confirmPassword) {
        const confirmError = validateConfirmPassword(formData.confirmPassword, value)
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: confirmError || undefined,
        }))
      }
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

  const displayError = error

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
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
                      <linearGradient id="signUpThreadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="signUpNeedleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="signUpStitchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="1" />
                      </linearGradient>
                      <filter id="signUpGlow">
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
                      filter="url(#signUpGlow)"
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
                      filter="url(#signUpGlow)"
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
                      filter="url(#signUpGlow)"
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
                      filter="url(#signUpGlow)"
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
                      filter="url(#signUpGlow)"
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
                      filter="url(#signUpGlow)"
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
            <h2 className="text-2xl font-semibold text-apple-gray-900 mb-2 text-center">
              Create your account
            </h2>
            <p className="text-sm text-apple-gray-600 text-center mb-8">
              Enter your information to get started
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Error Message */}
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{displayError}</span>
                </motion.div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-apple-gray-900 mb-1.5">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full px-4 py-2.5 border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.firstName
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                    placeholder="John"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-apple-gray-900 mb-1.5">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full px-4 py-2.5 border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.lastName
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                    placeholder="Doe"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1.5 text-xs text-red-600">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

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

              {/* Phone Number Field */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-apple-gray-900 mb-1.5">
                  Phone number
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCountryDropdownOpen(!isCountryDropdownOpen)
                        setCountrySearchQuery('')
                      }}
                      className={`flex items-center justify-center gap-2 px-3 h-[42px] border rounded-lg bg-white text-apple-gray-900 text-base focus:outline-none focus:ring-2 transition-all duration-200 min-w-[120px] ${
                        fieldErrors.phoneNumber
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                      <ChevronDown className={`h-4 w-4 text-apple-gray-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-[320px] max-h-[400px] overflow-hidden bg-white border border-apple-gray-200 rounded-lg shadow-lg z-20">
                        <div className="p-3 border-b border-apple-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-sm border border-apple-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                              <button
                                key={country.countryCode}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setIsCountryDropdownOpen(false)
                                  setCountrySearchQuery('')
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-apple-gray-50 transition-colors ${
                                  selectedCountry.countryCode === country.countryCode ? 'bg-primary-50' : ''
                                }`}
                              >
                                <span className="text-lg flex-shrink-0">{country.flag}</span>
                                <span className="flex-1 text-left text-apple-gray-900">{country.name}</span>
                                <span className="text-apple-gray-600 font-medium flex-shrink-0">{country.phoneCode}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-apple-gray-500">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Phone Number Input */}
                  <div className="flex-1">
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`block w-full px-4 h-[42px] border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                        fieldErrors.phoneNumber
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                {fieldErrors.phoneNumber ? (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.phoneNumber}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-apple-gray-500">
                    Enter your phone number without the country code
                  </p>
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full px-4 py-2.5 pr-12 border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.password
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                    placeholder="Create a password"
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
                {fieldErrors.password ? (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-apple-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-apple-gray-900 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full px-4 py-2.5 pr-12 border rounded-lg bg-white text-apple-gray-900 placeholder-apple-gray-400 text-base focus:outline-none focus:ring-2 transition-all duration-200 ${
                      fieldErrors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-apple-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-apple-gray-500 hover:text-apple-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base mt-2"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-apple-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-apple-gray-500">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center w-full px-6 py-3 border-2 border-apple-gray-300 text-apple-gray-900 font-medium rounded-lg hover:bg-apple-gray-50 focus:outline-none focus:ring-2 focus:ring-apple-gray-300 focus:ring-offset-2 transition-all duration-200 text-base"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-apple-gray-500">
              By creating an account, you agree to our{' '}
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







