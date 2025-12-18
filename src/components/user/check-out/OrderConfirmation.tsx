'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'

interface OrderConfirmationProps {
  isAuthenticated: boolean | null
  showCreateAccount: boolean
  onContinueShopping: () => void
}

export default function OrderConfirmation({
  isAuthenticated,
  showCreateAccount,
  onContinueShopping,
}: OrderConfirmationProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <Check className="h-10 w-10 text-green-600" strokeWidth={2.5} />
        </motion.div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Order Confirmed!</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Thank you for your purchase. You will receive a confirmation email shortly.
        </p>
        {!isAuthenticated && showCreateAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100"
          >
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Create an account to track your orders and save your information for faster checkout next time.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Create Account <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinueShopping}
          className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium text-base"
        >
          Continue Shopping
        </motion.button>
      </motion.div>
    </div>
  )
}

