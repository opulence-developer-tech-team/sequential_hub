'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Scissors, Ruler, Shirt, Shield, Truck } from 'lucide-react'

interface FaqItem {
  id: string
  question: string
  answer: ReactNode
  category: 'orders' | 'sizing' | 'tailoring' | 'account' | 'general'
}

const faqs: FaqItem[] = [
  {
    id: 'sizing-1',
    category: 'sizing',
    question: 'Are the measurements for the clothing or for my body?',
    answer: (
      <>
        All measurements shown on product pages are for the finished clothing item itself, not your
        body. The products listed here are already made pieces, so we show you the exact
        measurements of each clothing item so you know what to expect before you order. For best
        results, compare these product measurements with a similar item you already own that fits
        you well.
      </>
    ),
  },
  {
    id: 'sizing-2',
    category: 'sizing',
    question: 'How do I submit my custom measurements?',
    answer: (
      <>
        You can submit your measurements through the dedicated{' '}
        <Link
          href="/measurements"
          className="text-primary-600 underline-offset-2 hover:underline font-medium"
        >
          Measurements page
        </Link>{' '}
        or directly from the custom measurements section after placing an order. The form will guide
        you through each required point with clear labels such as neck, shoulder, chest, waist, and
        trouser length. You can also submit your measurements if you want us to sew a new piece
        using a sample you like—simply share the sample product name or link in your note.
      </>
    ),
  },
  {
    id: 'sizing-3',
    category: 'sizing',
    question: 'What if my measurements change after I submit them?',
    answer:
      'If your measurements change shortly after submitting them, please reach out via the contact page with your order number and updated measurements. If production has not started, our team will adjust your measurements on the order. Once cutting has begun, only minor adjustments may be possible.',
  },
  {
    id: 'tailoring-1',
    category: 'tailoring',
    question: 'Are your pieces mass-produced or individually tailored?',
    answer:
      'Each piece is individually crafted in our studio by our tailoring team. We do not resell factory-made clothing. Every order is cut, sewn, and finished per request, with careful attention to stitching, finishing, and fit.',
  },
  {
    id: 'tailoring-2',
    category: 'tailoring',
    question: 'Can I request design changes like length or sleeve adjustments?',
    answer:
      'Yes, small design adjustments such as lengthening a top, adjusting sleeve length, or minor neckline changes are usually possible. Please include these requests in the order notes or contact us immediately after placing your order so our team can confirm feasibility before production begins.',
  },
  {
    id: 'orders-1',
    category: 'orders',
    question: 'How long does it take to receive my order?',
    answer:
      'Production timelines vary based on the piece and current workload, but most orders ship within 7–14 business days. Once shipped, delivery time depends on your location and the shipping method selected at checkout. You can track your order using the “Track Order” section with your order number.',
  },
  {
    id: 'orders-2',
    category: 'orders',
    question: 'Can I track the status of my tailoring order?',
    answer:
      'Yes. After your order is confirmed, you can track its status on the Track Order page using your order number and email. You will see updates as your order moves through measurement confirmation, cutting, sewing, quality check, and shipping.',
  },
  {
    id: 'orders-3',
    category: 'orders',
    question: 'What if I made a mistake in my order details?',
    answer:
      'If you notice an error in your order (size, color, address, or measurements), contact us as soon as possible with your order number. If production or shipping has not yet started, we will correct the details for you. Once production is underway, changes may be limited.',
  },
  {
    id: 'account-1',
    category: 'account',
    question: 'Do I need an account to place an order or leave a review?',
    answer:
      'You can place an order as a guest or as a signed-in user. For reviews, signed-in users are marked as Verified, while guest reviews are clearly labeled as Guest reviews. Creating an account makes it easier to manage measurements, track orders, and access your full history.',
  },
  {
    id: 'account-2',
    category: 'account',
    question: 'Why are some reviews marked as verified and others as guest reviews?',
    answer:
      'Verified reviews are written by customers who were signed in when placing an order and submitting the review. Guest reviews are from customers who chose to review without signing in. This label helps you understand which reviews are tied to an account and completed purchase.',
  },
  {
    id: 'general-1',
    category: 'general',
    question: 'Can I speak to someone about measurements before ordering?',
    answer: (
      <>
        Absolutely. If you are unsure about sizing or which measurements to submit, you can reach
        out via our Contact page. Let us know whether you are choosing from the already made pieces
        you see on the site or if you want to sew something new using one of them as a sample.
        Include your questions, any existing measurements, and (if available) your order number so
        our team can give precise guidance.
      </>
    ),
  },
  {
    id: 'general-2',
    category: 'general',
    question: 'What should I do if my order does not fit as expected?',
    answer:
      'If your order does not fit as expected, please contact us within 3 days of receiving your item. Share clear photos and details of the issue, and our team will review whether adjustments, alterations guidance, or a remake is appropriate based on the original measurements submitted.',
  },
]

const categoryLabels: Record<FaqItem['category'], string> = {
  orders: 'Orders & Shipping',
  sizing: 'Sizing & Measurements',
  tailoring: 'Tailoring & Design',
  account: 'Account & Reviews',
  general: 'General Questions',
}

export default function FaqPage() {
  const [activeId, setActiveId] = useState<string | null>(faqs[0]?.id ?? null)
  const [activeCategory, setActiveCategory] = useState<FaqItem['category'] | 'all'>('all')

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter((item) => item.category === activeCategory)

  const handleToggle = (id: string) => {
    setActiveId((current) => (current === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Header */}
        <header className="mb-8 sm:mb-12 lg:mb-14 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
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
                Frequently Asked Questions
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Tailor-made answers for your order
              </h1>
              <p className="mt-1 text-sm text-gray-500 max-w-xl">
                Find quick answers about measurements, tailoring, and orders. Each response comes from
                how we work in our own studio—handcrafted and detail-focused.
              </p>
            </div>
          </div>

          {/* Small highlight card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 shadow-sm max-w-xs sm:max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <Scissors className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-900">
                  Have a question about a specific order?
                </p>
                <p className="mt-0.5 text-[11px] text-primary-900/80 leading-relaxed">
                  Include your order number and any measurements you&apos;ve shared when contacting us—
                  it helps our tailors assist you precisely.
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Category filters */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center text-xs sm:text-[13px]">
            <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mr-1 sm:mr-2">
              Browse by topic
            </span>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition-colors ${
                activeCategory === 'all'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              <Shirt className="h-3.5 w-3.5" />
              <span>All</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('sizing')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition-colors ${
                activeCategory === 'sizing'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>Sizing &amp; measurements</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('tailoring')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition-colors ${
                activeCategory === 'tailoring'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>Tailoring</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('orders')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition-colors ${
                activeCategory === 'orders'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Orders &amp; shipping</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('account')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition-colors ${
                activeCategory === 'account'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Account &amp; reviews</span>
            </button>
          </div>
        </section>

        {/* FAQ list */}
        <section aria-label="Frequently asked questions" className="space-y-4 sm:space-y-5">
          {filteredFaqs.map((item) => {
            const isOpen = activeId === item.id

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 text-left"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500 mb-0.5">
                      {categoryLabels[item.category]}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {item.question}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 rounded-full border border-gray-200 bg-gray-50 p-1.5 text-gray-500">
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="px-4 sm:px-5 pb-3.5 sm:pb-4"
                    >
                      <div className="h-px w-full bg-gradient-to-r from-primary-100 via-primary-50 to-transparent mb-3" />
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {filteredFaqs.length === 0 && (
            <p className="text-sm text-gray-500">
              No questions found for this category.
            </p>
          )}
        </section>

        {/* Bottom helper note */}
        <section className="mt-10 sm:mt-12">
          <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 px-4 sm:px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-primary-900 text-sm font-medium">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white text-xs font-semibold">
                ?
              </span>
              <span>Still have questions about fit or tailoring?</span>
            </div>
            <p className="text-[11px] sm:text-xs text-primary-900/80 sm:ml-auto max-w-md">
              Visit the{' '}
              <Link
                href="/contact"
                className="text-primary-600 underline-offset-2 hover:underline font-medium"
              >
                Contact page
              </Link>{' '}
              to speak directly with our team. Include your order number and any existing
              measurements so we can guide you as precisely as possible.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
