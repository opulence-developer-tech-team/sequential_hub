'use client'

import { motion } from 'framer-motion'
import { Scissors, Sparkles, Heart, Award } from 'lucide-react'

const craftsmanshipPoints = [
  {
    icon: Scissors,
    title: 'Handcrafted with Care',
    description: 'Every stitch is carefully placed by our master tailor, ensuring quality that mass production simply cannot match.'
  },
  {
    icon: Sparkles,
    title: 'Original Designs',
    description: 'Each piece is personally designed and created in our workshop, making every piece of clothing truly one-of-a-kind.'
  },
  {
    icon: Heart,
    title: 'Made with Passion',
    description: 'We pour our heart into every creation, treating each piece of clothing as a work of art that reflects your unique style.'
  },
  {
    icon: Award,
    title: 'Authentic Craftsmanship',
    description: 'Experience the difference of authentic tailoring—where tradition meets modern elegance in every detail.'
  }
]

export default function CraftsmanshipSection() {
  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50 to-white py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="text-center mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-6"
          >
            <Scissors className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight"
          >
            Handmade with Heart
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed mb-6"
          >
            Every piece you see here is personally designed and handcrafted by our master tailor—not mass-produced or resold.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            From the initial sketch to the final stitch, each piece of clothing is a testament to traditional craftsmanship, 
            attention to detail, and the passion we bring to creating clothing that's as unique as you are.
          </motion.p>
        </div>

        {/* Craftsmanship Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {craftsmanshipPoints.map((point, index) => {
            const Icon = point.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {point.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 lg:mt-16 text-center"
        >
          <p className="text-lg text-gray-600 font-medium">
            Discover the difference that authentic craftsmanship makes.
          </p>
        </motion.div>
      </div>
    </section>
  )
}













































