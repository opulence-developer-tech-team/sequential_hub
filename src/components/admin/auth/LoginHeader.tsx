'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function LoginHeader() {
  return (
    <div className="bg-gradient-to-r from-apple-gray-900 to-apple-gray-800 px-8 py-10 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4"
      >
        <Shield className="h-8 w-8 text-white" />
      </motion.div>
      <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
      <p className="text-white/80 text-sm">Sign in to access the admin dashboard</p>
    </div>
  )
}
