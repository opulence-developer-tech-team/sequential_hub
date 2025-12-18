'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowLeft, Truck, Shield, Star } from 'lucide-react'
import { isPlaceholderImage, formatPrice } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'

const heroSlides = [
  {
    id: 1,
    title: 'New Collection',
    subtitle: 'Premium Tailored Clothing',
    description: 'Discover our latest collection of custom-fit clothing designed for the modern professional',
    image: 'https://via.placeholder.com/1200x800/E5E7EB/6B7280?text=New+Collection',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    badge: 'New Arrivals'
  },
  {
    id: 2,
    title: 'Custom Measurements',
    subtitle: 'Perfect Fit Guaranteed',
    description: 'Get clothing tailored to your exact measurements. 100% satisfaction guaranteed.',
    image: 'https://via.placeholder.com/1200x800/E5E7EB/6B7280?text=Custom+Measurements',
    ctaText: 'Get Measured',
    ctaLink: '/measurements',
    badge: 'Custom Fit'
  },
  {
    id: 3,
    title: 'Summer Sale',
    subtitle: 'Up to 40% Off',
    description: 'Limited time offer on selected items. Premium quality at unbeatable prices.',
    image: 'https://via.placeholder.com/1200x800/E5E7EB/6B7280?text=Summer+Sale',
    ctaText: 'Shop Sale',
    ctaLink: '/products?sale=true',
    badge: 'Sale'
  }
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const freeShippingThreshold = useAppSelector((state) => state.shippingSettings.freeShippingThreshold) ?? 0
  const resumeAutoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchLastXRef = useRef<number | null>(null)
  const touchLastYRef = useRef<number | null>(null)

  const trustIndicators = [
    { icon: Truck, text: 'Free Shipping', subtext: `On orders over ${formatPrice(freeShippingThreshold)}` },
    { icon: Shield, text: 'Secure Payment', subtext: '100% Protected' },
    { icon: Star, text: 'Premium Quality', subtext: '5-Star Rated' }
  ]

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const pauseAutoplayTemporarily = (ms: number = 10000) => {
    setIsAutoPlaying(false)
    if (resumeAutoplayTimeoutRef.current) {
      clearTimeout(resumeAutoplayTimeoutRef.current)
    }
    resumeAutoplayTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true)
      resumeAutoplayTimeoutRef.current = null
    }, ms)
  }

  useEffect(() => {
    return () => {
      if (resumeAutoplayTimeoutRef.current) {
        clearTimeout(resumeAutoplayTimeoutRef.current)
      }
    }
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    pauseAutoplayTemporarily()
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    pauseAutoplayTemporarily()
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
    pauseAutoplayTemporarily()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    touchStartXRef.current = t.clientX
    touchStartYRef.current = t.clientY
    touchLastXRef.current = t.clientX
    touchLastYRef.current = t.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    touchLastXRef.current = t.clientX
    touchLastYRef.current = t.clientY
  }

  const handleTouchEnd = () => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    const endX = touchLastXRef.current
    const endY = touchLastYRef.current

    touchStartXRef.current = null
    touchStartYRef.current = null
    touchLastXRef.current = null
    touchLastYRef.current = null

    if (startX == null || startY == null || endX == null || endY == null) return

    const dx = endX - startX
    const dy = endY - startY

    // Only treat it as a swipe if it's primarily horizontal and exceeds threshold.
    const SWIPE_THRESHOLD_PX = 50
    const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy) * 1.2
    if (!isHorizontalSwipe || Math.abs(dx) < SWIPE_THRESHOLD_PX) return

    if (dx < 0) {
      nextSlide() // swipe left -> next
    } else {
      prevSlide() // swipe right -> previous
    }
  }

  return (
    <div className="relative w-full bg-white">
      {/* Main Hero Carousel */}
      <div
        className="relative h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, index) => {
            if (index !== currentSlide) return null

            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    unoptimized={isPlaceholderImage(slide.image)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="max-w-2xl text-white"
                  >
                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4"
                    >
                      <span className="text-xs md:text-sm font-medium">{slide.badge}</span>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 leading-tight"
                    >
                      {slide.title}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3 text-white/90"
                    >
                      {slide.subtitle}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="text-base md:text-lg mb-6 text-white/80 max-w-xl leading-relaxed"
                    >
                      {slide.description}
                    </motion.p>

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.6 }}
                    >
                      <Link
                        href={slide.ctaLink}
                        className="group inline-flex items-center px-6 py-3 bg-white text-apple-gray-900 font-semibold rounded-full hover:bg-apple-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base"
                      >
                        {slide.ctaText}
                        <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="hidden md:inline-flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 text-white"
        >
          <ArrowRight className="h-6 w-6" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-apple-gray-50 border-b border-apple-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-center space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-apple-gray-900">{indicator.text}</div>
                    <div className="text-sm text-apple-gray-600">{indicator.subtext}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
