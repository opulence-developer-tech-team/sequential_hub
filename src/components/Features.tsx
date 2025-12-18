'use client'

import { motion } from 'framer-motion'
import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: (threshold: number) => `Free shipping on orders over ${formatPrice(threshold)}. Fast and reliable delivery to your doorstep.`
  },
  {
    icon: Shield,
    title: 'Quality Guarantee',
    description: 'Premium materials and craftsmanship. We stand behind every product we sell.'
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy. Not satisfied? Return it for a full refund.'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our customer service team is here to help you anytime, anywhere.'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export default function Features() {
  const freeShippingThreshold = useAppSelector((state) => state.shippingSettings.freeShippingThreshold) ?? 0

  return (
    <section className="py-24 bg-apple-gray-50 bg-watermark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const description = typeof feature.description === 'function' 
              ? feature.description(freeShippingThreshold)
              : feature.description
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-6 shadow-sm group-hover:shadow-md transition-shadow duration-300"
                >
                  <Icon className="h-10 w-10 text-primary-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-apple-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-apple-gray-600 leading-relaxed font-light">
                  {description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
