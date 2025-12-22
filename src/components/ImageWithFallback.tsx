'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { isPlaceholderImage } from '@/lib/utils'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  fallbackSrc?: string
}

export default function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  priority = false,
  sizes,
  fallbackSrc = 'https://via.placeholder.com/400x400?text=Product',
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
  }

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        {hasError ? (
          <div className="absolute inset-0 bg-apple-gray-100 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-apple-gray-400" aria-hidden="true" />
            <span className="sr-only">Image not available</span>
          </div>
        ) : (
          <Image
            src={imgSrc}
            alt={alt}
            fill
            className={className}
            priority={priority}
            sizes={sizes}
            unoptimized={isPlaceholderImage(imgSrc)}
            onError={handleError}
          />
        )}
      </div>
    )
  }

  return (
    <>
      {hasError ? (
        <div className={`bg-apple-gray-100 flex items-center justify-center ${className}`} style={{ width, height }}>
          <ImageIcon className="h-12 w-12 text-apple-gray-400" aria-hidden="true" />
          <span className="sr-only">Image not available</span>
        </div>
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
          sizes={sizes}
          unoptimized={isPlaceholderImage(imgSrc)}
          onError={handleError}
        />
      )}
    </>
  )
}






































