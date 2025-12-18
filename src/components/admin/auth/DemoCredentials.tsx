'use client'

import { motion } from 'framer-motion'

export default function DemoCredentials() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-6 p-4 bg-apple-gray-100 rounded-xl border border-apple-gray-200"
    >
      <p className="text-xs font-medium text-apple-gray-700 mb-2">Demo Credentials:</p>
      <div className="text-xs text-apple-gray-600 space-y-1">
        <p>
          Email: <span className="font-mono font-medium">admin@sequentialhub.com</span>
        </p>
        <p>
          Password: <span className="font-mono font-medium">admin123</span>
        </p>
      </div>
    </motion.div>
  )
}
