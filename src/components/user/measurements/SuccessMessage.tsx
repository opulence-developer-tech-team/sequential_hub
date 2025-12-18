import { motion } from 'framer-motion'
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

interface SuccessMessageProps {
  onReset: () => void
  orderNumbers?: string[]
  isGuest?: boolean
}

export default function SuccessMessage({ onReset, orderNumbers = [], isGuest = false }: SuccessMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to top of success message when component mounts
  useEffect(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          const offset = 20 // Adjust this value as needed
          const elementPosition = containerRef.current.getBoundingClientRect().top + window.scrollY
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
          })
        }
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [])

  const copyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber)
    toast.success('Order number copied to clipboard!')
  }

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-12 text-center shadow-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <CheckCircle2 className="h-12 w-12 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Measurement Submitted Successfully!</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
          Thank you for submitting your measurements. Our team will review your request and contact you within 24 hours to discuss your custom order.
        </p>

        {/* Order Numbers */}
        {orderNumbers.length > 0 && (
          <div className="mb-8 bg-white rounded-xl p-6 border border-green-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Your Order {orderNumbers.length > 1 ? 'Numbers' : 'Number'}
            </h3>
            <div className="space-y-3">
              {orderNumbers.map((orderNumber, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <span className="font-mono text-lg font-semibold text-gray-900">{orderNumber}</span>
                  <button
                    onClick={() => copyOrderNumber(orderNumber)}
                    className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                    aria-label={`Copy order number ${orderNumber}`}
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest User Instructions */}
        {isGuest && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Track Your Order</h3>
            <p className="text-sm text-blue-800 mb-4">
              You can track your measurement order status using your order number above. Visit our track order page to check the status of your request.
            </p>
            <Link
              href="/track-order"
              className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium transition-colors"
            >
              Go to Track Order Page
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </Link>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md"
        >
          Submit Another Measurement
        </motion.button>
      </motion.div>
    </div>
  )
}

