'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { isPlaceholderImage } from '@/lib/utils'

interface ProductImagesProps {
  images: string[]
  productName: string
  selectedImage: number
  onImageSelect: (index: number) => void
}

export default function ProductImages({
  images,
  productName,
  selectedImage,
  onImageSelect,
}: ProductImagesProps) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const selectedImageRef = useRef(selectedImage)
  const imagesRef = useRef(images)

  // Keep refs in sync with props
  useEffect(() => {
    selectedImageRef.current = selectedImage
    imagesRef.current = images
  }, [selectedImage, images])

  const currentImage = images[selectedImage] || 'https://via.placeholder.com/500x600?text=Product+Image'

  // Auto-slide images every 3 seconds
  useEffect(() => {
    // Don't auto-play if there's only one image, or if user is hovering/interacting
    if (images.length <= 1 || !isAutoPlaying || isHovered) return

    const interval = setInterval(() => {
      const currentIndex = selectedImageRef.current
      const currentImages = imagesRef.current
      const nextIndex = (currentIndex + 1) % currentImages.length
      onImageSelect(nextIndex)
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [images.length, isAutoPlaying, isHovered, onImageSelect])

  // Handle manual image selection - pause auto-play temporarily
  const handleImageSelect = (index: number) => {
    onImageSelect(index)
    setIsAutoPlaying(false)
    
    // Clear any existing timeout
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current)
    }
    
    // Resume auto-play after 8 seconds
    autoPlayTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 8000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div 
      className="space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 relative group">
        <div className="relative h-96 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={currentImage}
                alt={productName}
                fill
                className="object-cover"
                unoptimized={isPlaceholderImage(currentImage)}
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/500x600?text=Product+Image'
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Thumbnail Images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => handleImageSelect(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg transition-all duration-200 ${
                selectedImage === index ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <motion.div
                className="relative h-20 w-full"
                animate={{
                  scale: selectedImage === index ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={isPlaceholderImage(image)}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/100x120?text=Image'
                  }}
                />
              </motion.div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}







































