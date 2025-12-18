'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, LogIn } from 'lucide-react'

interface CheckoutHeaderProps {
  onBack: () => void
  isAuthenticated: boolean | null
  userEmail?: string
}

export default function CheckoutHeader({ onBack, isAuthenticated, userEmail }: CheckoutHeaderProps) {
  return (
    <div className="mb-12">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Cart</span>
      </motion.button>
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-semibold text-gray-900 tracking-tight"
        >
          Checkout
        </motion.h1>
        {isAuthenticated ? (
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
            <User className="h-4 w-4 mr-2" />
            <span className="font-medium">{userEmail || 'User'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Guest Checkout</span>
            <Link
              href={`/sign-in?redirect=${encodeURIComponent('/checkout')}`}
              className="inline-flex items-center text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}


































