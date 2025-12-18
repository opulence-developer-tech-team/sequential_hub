'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { categories } from '@/data/products'
import { ArrowRight } from 'lucide-react'
import { isPlaceholderImage } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export default function CategorySection() {
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
            Shop by Category
          </h2>
          <p className="text-xl text-apple-gray-600 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
            Explore our diverse collection of premium clothing and accessories 
            organized by category for easy browsing.
          </p>
          <Link
            href="/categories"
            className="group inline-flex items-center px-8 py-3.5 border-2 border-apple-gray-300 text-apple-gray-900 font-medium rounded-full hover:bg-apple-gray-50 transition-all duration-300 apple-button"
          >
            View All Categories
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <Link href={`/products?category=${category.slug}`}>
                <div className="aspect-[4/3] relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                      unoptimized={isPlaceholderImage(category.image)}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Category+Image'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-500" />
                  </motion.div>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8">
                  <motion.div
                    initial={{ opacity: 1 }}
                    whileHover={{ opacity: 0.95 }}
                    className="text-center text-white"
                  >
                    <h3 className="text-3xl font-semibold mb-2">
                      {category.name}
                    </h3>
                    <p className="text-base opacity-90 mb-6 max-w-xs mx-auto font-light">
                      {category.description}
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-300 border border-white/30"
                    >
                      <span className="text-sm font-medium">Shop Now</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
