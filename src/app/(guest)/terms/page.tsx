'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Scissors, Shield, ShoppingBag, Ruler, Mail } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Header */}
        <header className="mb-8 sm:mb-12 lg:mb-14">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border-2 border-primary-100 shadow-md flex items-center justify-center overflow-hidden">
              <Image
                src="/icon/sewing-machine.png"
                alt="Sequential Hub Logo"
                width={52}
                height={52}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-primary-600 mb-1">
                Terms of Service
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Our commitment to you
              </h1>
              <p className="mt-1 text-sm text-gray-500 max-w-xl">
                These terms outline the agreement between you and Sequential Hub for our tailoring services and ready-made products.
              </p>
            </div>
          </div>

          {/* Last updated notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <FileText className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-900">
                  Last Updated
                </p>
                <p className="mt-0.5 text-[11px] text-primary-900/80 leading-relaxed">
                  These terms were last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. We may update these terms from time to time, and continued use of our services constitutes acceptance of any changes.
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Content */}
        <div className="space-y-8 sm:space-y-10">
          {/* Section 1 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  1. Acceptance of Terms
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    By accessing and using Sequential Hub&apos;s website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                  </p>
                  <p>
                    Our services include the sale of ready-made clothing items and custom tailoring services based on your submitted measurements. Each order is individually crafted in our studio by our tailoring team.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 2 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Ruler className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  2. Products and Services
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-gray-900">Ready-Made Products:</strong> We offer already made clothing items with detailed measurements displayed on each product page. These measurements represent the finished clothing item itself, not your body measurements.
                  </p>
                  <p>
                    <strong className="text-gray-900">Custom Tailoring:</strong> You may submit your measurements for custom sewing based on samples from our collection. Each custom piece is individually cut, sewn, and finished by our tailoring team. Production timelines typically range from 7–14 business days.
                  </p>
                  <p>
                    <strong className="text-gray-900">Measurement Accuracy:</strong> It is your responsibility to provide accurate measurements. We are not liable for fit issues resulting from incorrect measurements provided by you. If you are unsure about measurements, please contact us before placing your order.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 3 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  3. Orders and Payment
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-gray-900">Order Placement:</strong> When you place an order, you are making an offer to purchase products or services at the prices listed. We reserve the right to accept or decline your order for any reason.
                  </p>
                  <p>
                    <strong className="text-gray-900">Pricing:</strong> All prices are displayed in the currency shown and are subject to change without notice. Prices do not include shipping costs, which will be calculated at checkout.
                  </p>
                  <p>
                    <strong className="text-gray-900">Payment:</strong> Payment must be made in full at the time of order placement. We accept major credit cards and other payment methods as displayed at checkout. All payments are processed securely.
                  </p>
                  <p>
                    <strong className="text-gray-900">Order Modifications:</strong> If you need to modify your order (size, color, address, or measurements), contact us immediately with your order number. Changes may be limited once production has begun.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 4 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Scissors className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  4. Production and Shipping
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-gray-900">Production Time:</strong> Custom orders typically take 7–14 business days to complete, depending on complexity and current workload. Ready-made items are shipped within 1–3 business days.
                  </p>
                  <p>
                    <strong className="text-gray-900">Shipping:</strong> Once your order is ready, it will be shipped to the address provided at checkout. Shipping times vary based on your location and the selected shipping method. You can track your order using the order number provided.
                  </p>
                  <p>
                    <strong className="text-gray-900">Delivery:</strong> We are not responsible for delays caused by shipping carriers or customs. Please ensure your shipping address is correct, as we are not liable for orders shipped to incorrect addresses provided by you.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 5 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  5. Returns and Refunds
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-gray-900">Ready-Made Products:</strong> Ready-made items may be returned within 14 days of delivery if they are unworn, unwashed, and in original condition with tags attached. Custom-made items are not eligible for returns unless there is a manufacturing defect.
                  </p>
                  <p>
                    <strong className="text-gray-900">Fit Issues:</strong> If your custom order does not fit as expected due to our error, contact us within 3 days of delivery with photos and details. We will review whether adjustments, alterations, or a remake is appropriate.
                  </p>
                  <p>
                    <strong className="text-gray-900">Refunds:</strong> Refunds for eligible returns will be processed to the original payment method within 10–14 business days. Shipping costs are non-refundable unless the return is due to our error.
                  </p>
                  <p>
                    <strong className="text-gray-900">Cancellations:</strong> Orders may be cancelled within 24 hours of placement if production has not begun. Once production starts, cancellations are not possible, but we may be able to accommodate modifications.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 6 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  6. Intellectual Property
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    All content on this website, including designs, images, text, logos, and product descriptions, is the property of Sequential Hub and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 7 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Shield className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  7. Limitation of Liability
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    To the maximum extent permitted by law, Sequential Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or products.
                  </p>
                  <p>
                    Our total liability for any claim related to our services or products shall not exceed the amount you paid for the specific product or service in question.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 8 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <FileText className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  8. Changes to Terms
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to this page. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 9 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-700" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  9. Contact Information
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>
                    If you have any questions about these Terms of Service, please contact us through our{' '}
                    <Link
                      href="/contact"
                      className="text-primary-600 underline-offset-2 hover:underline font-medium"
                    >
                      Contact page
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
          className="mt-10 sm:mt-12 rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-4 shadow-sm"
        >
          <p className="text-xs text-primary-900/80 leading-relaxed text-center">
            By using Sequential Hub&apos;s services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
