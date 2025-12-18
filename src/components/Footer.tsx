'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import Newsletter from './Newsletter'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: "Featured Products", href: '/products?featured=true' },
    { name: "Measurement", href: '/measurements' },
    { name: 'Track order', href: '/track-order' },
  ],
  customerService: [
    { name: 'Contact Us', href: '/contact' },
    // { name: 'Shipping Info', href: '/shipping' },
    // { name: 'Returns & Exchanges', href: '/returns' },
    // { name: 'Size Guide', href: '/size-guide' },
    { name: 'FAQ', href: '/faq' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-apple-gray-50 border-t border-apple-gray-200 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 w-full">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <h3 className="text-2xl font-semibold text-apple-gray-900">Sequential Hub</h3>
            <p className="text-apple-gray-600 leading-relaxed max-w-md break-words">
              Your premier destination for custom-tailored clothing and accessories. 
              We bring style and quality together for the modern individual.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: Facebook, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Instagram, href: '#' },
              ].map(({ icon: Icon, href }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-200 transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Shop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4 min-w-0"
          >
            <h4 className="text-sm font-semibold text-apple-gray-900 uppercase tracking-wider">
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-apple-gray-600 hover:text-apple-gray-900 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 min-w-0"
          >
            <h4 className="text-sm font-semibold text-apple-gray-900 uppercase tracking-wider">
              Customer Service
            </h4>
            <ul className="space-y-3">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-apple-gray-600 hover:text-apple-gray-900 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="min-w-0 w-full"
          >
            <Newsletter source="footer" variant="footer" />
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4 min-w-0"
          >
            <h4 className="text-sm font-semibold text-apple-gray-900 uppercase tracking-wider">
              Contact
            </h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-apple-gray-600 mt-0.5 flex-shrink-0" />
                <span className="text-apple-gray-600 text-sm leading-relaxed break-words">
                  123 Fashion Street<br />
                  New York, NY 10001
                </span>
              </div>
              <div className="flex items-center space-x-3 min-w-0">
                <Phone className="h-5 w-5 text-apple-gray-600 flex-shrink-0" />
                <a
                  href="tel:+15551234567"
                  className="text-apple-gray-600 hover:text-apple-gray-900 transition-colors duration-200 text-sm break-all"
                >
                  +1 (555) 123-4567
                </a>
              </div>
              <div className="flex items-center space-x-3 min-w-0">
                <Mail className="h-5 w-5 text-apple-gray-600 flex-shrink-0" />
                <a
                  href="mailto:info@sequentialhub.com"
                  className="text-apple-gray-600 hover:text-apple-gray-900 transition-colors duration-200 text-sm break-all"
                >
                  info@sequentialhub.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-apple-gray-200 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 gap-4">
            <p className="text-apple-gray-600 text-sm text-center md:text-left break-words">
              © {new Date().getFullYear()} Sequential Hub. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
              <Link
                href="/privacy"
                className="text-apple-gray-600 hover:text-apple-gray-900 text-sm transition-colors duration-200 whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-apple-gray-600 hover:text-apple-gray-900 text-sm transition-colors duration-200 whitespace-nowrap"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
