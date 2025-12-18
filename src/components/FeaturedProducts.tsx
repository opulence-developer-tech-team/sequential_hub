'use client'

import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Product } from '@/types'

interface FeaturedProductsProps {
  products: Product[]
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const featuredProducts = products || []

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  if (featuredProducts.length === 0) {
    // Don't show section if there are no products
    return null
  }

  return (
    <section className="py-24 bg-white bg-watermark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-apple-gray-900 mb-4 tracking-tight">
            Featured Products
          </h2>
          <p className="text-xl text-apple-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Discover our handpicked selection of premium clothing and accessories, 
            carefully curated for the modern individual.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto"
        >
          {featuredProducts.map((product, index) => (
            <ProductCard key={product._id} product={product} index={index} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <Link
            href="/products?featured=true"
            className="group inline-flex items-center px-8 py-3.5 border-2 border-apple-gray-300 text-apple-gray-900 font-medium rounded-full hover:bg-apple-gray-50 transition-all duration-300 apple-button"
          >
            View All Featured Products
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
