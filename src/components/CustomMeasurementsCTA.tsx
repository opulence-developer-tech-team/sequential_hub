'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Ruler, Scissors, CheckCircle, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: Ruler,
    title: 'Submit Measurements',
    description: 'Provide your detailed body measurements using our comprehensive form'
  },
  {
    icon: Scissors,
    title: 'Expert Tailoring',
    description: 'Our skilled tailors craft your clothing to your exact specifications'
  },
  {
    icon: CheckCircle,
    title: 'Perfect Fit',
    description: 'Receive clothing that fits you perfectly and enhances your style'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export default function CustomMeasurementsCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-apple-gray-900 via-apple-gray-800 to-apple-gray-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Ruler className="h-12 w-12 text-white" />
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 tracking-tight">
            Custom Tailored Clothing
          </h2>
          
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Get perfectly fitted clothing tailored to your exact measurements. 
            Submit your measurements and let our expert tailors create the perfect fit for you.
          </p>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/20 transition-all duration-300"
                >
                  <Icon className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/70 leading-relaxed font-light">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Link
            href="/measurements"
            className="group inline-flex items-center justify-center px-8 py-3.5 bg-white text-apple-gray-900 font-medium rounded-full hover:bg-apple-gray-100 transition-all duration-300 apple-button"
          >
            <Ruler className="mr-2 h-5 w-5" />
            Submit Your Measurements
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <Link
            href="/categories"
            className="group inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all duration-300 apple-button backdrop-blur-sm"
          >
            Browse Categories
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-white/60 font-light">
            Available for all clothing categories: Packet Shirts, Vintage Shirts, Plain Pants, 
            Joggers, Senators, Kaftan, and Agbada
          </p>
        </motion.div>
      </div>
    </section>
  )
}
