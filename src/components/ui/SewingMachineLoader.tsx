'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'

interface SewingMachineLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
  inline?: boolean // For inline use in buttons, etc.
}

export default function SewingMachineLoader({
  size = 'md',
  text = 'Loading, please wait...',
  fullScreen = false,
  className = '',
  inline = false,
}: SewingMachineLoaderProps) {
  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      image: 'w-12 h-12',
      inline: 'w-4 h-4',
      text: 'text-xs',
    },
    md: {
      container: 'w-16 h-16',
      image: 'w-16 h-16',
      inline: 'w-5 h-5',
      text: 'text-sm',
    },
    lg: {
      container: 'w-20 h-20',
      image: 'w-20 h-20',
      inline: 'w-6 h-6',
      text: 'text-base',
    },
  }

  const currentSize = sizeClasses[size]
  
  // Luxury blue color scheme for tailoring and sewing theme
  // Using Tailwind primary colors for consistency
  const colors = {
    thread: {
      primary: 'rgb(0, 113, 227)', // primary-600
      secondary: 'rgb(14, 165, 233)', // primary-500
      accent: 'rgb(56, 189, 248)', // primary-400
    },
    needle: {
      primary: 'rgb(0, 113, 227)', // primary-600
      secondary: 'rgb(3, 105, 161)', // primary-700
    },
    stitch: {
      primary: 'rgb(14, 165, 233)', // primary-500
      secondary: 'rgb(56, 189, 248)', // primary-400
    },
    wheel: {
      primary: 'rgb(0, 113, 227)', // primary-600
      secondary: 'rgb(14, 165, 233)', // primary-500
    },
  }
  
  // Tailor-themed animated elements with beautiful colors
  const animatedElements = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Thread Spool - Rotating at top with luxury blue gradient colors */}
        <defs>
          <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.thread.primary} stopOpacity="0.9" />
            <stop offset="50%" stopColor={colors.thread.secondary} stopOpacity="0.75" />
            <stop offset="100%" stopColor={colors.thread.accent} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.needle.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.needle.secondary} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="stitchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.stitch.primary} stopOpacity="0.7" />
            <stop offset="50%" stopColor={colors.stitch.secondary} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colors.stitch.primary} stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="glowGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor={colors.thread.accent} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.thread.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Glowing background effect with luxury blue pulse */}
        <motion.circle
          cx="50"
          cy="50"
          r="35"
          fill="url(#glowGradient)"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.g
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '50px 15px' }}
        >
          <circle cx="50" cy="15" r="4" fill="url(#threadGradient)" />
          <rect x="46" y="15" width="8" height="5" rx="0.5" fill="url(#threadGradient)" />
          <circle cx="50" cy="20" r="4" fill="url(#threadGradient)" />
        </motion.g>

        {/* Thread flowing down from spool with animated gradient */}
        <motion.path
          d="M 50 20 Q 48 30 50 40 Q 52 50 50 60"
          stroke="url(#threadGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Needle - Moving up and down with gradient */}
        <motion.g
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '50px 50px' }}
        >
          <rect x="48" y="45" width="4" height="12" rx="1" fill="url(#needleGradient)" />
          <path d="M 50 57 L 48 65 L 52 65 Z" fill={colors.needle.secondary} />
          <line
            x1="50"
            y1="57"
            x2="50"
            y2="65"
            stroke={colors.needle.primary}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Presser Foot - Subtle movement */}
        <motion.g
          animate={{
            y: [0, 1.5, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.1,
          }}
        >
          <rect x="48.5" y="57" width="3" height="2" rx="0.5" fill={colors.thread.accent} className="opacity-80" />
          <path d="M 46 59 L 54 59 L 53 62 L 47 62 Z" fill={colors.thread.secondary} className="opacity-70" />
        </motion.g>

        {/* Stitch pattern forming with gradient */}
        <motion.g
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path
            d="M 30 70 Q 35 68 40 70 T 50 70 T 60 70 T 70 70"
            stroke="url(#stitchGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Thread tension guide - Pulsing with color */}
        <motion.circle
          cx="50"
          cy="35"
          r="2"
          fill={colors.thread.secondary}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Hand wheel - Rotating with luxury blue gradient colors */}
        <motion.circle
          cx="75"
          cy="50"
          r="5"
          fill="none"
          stroke={colors.wheel.primary}
          strokeWidth="2"
          className="opacity-70"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '75px 50px' }}
        />
        <motion.circle
          cx="75"
          cy="50"
          r="3"
          fill="none"
          stroke={colors.wheel.secondary}
          strokeWidth="1.5"
          className="opacity-60"
          animate={{ rotate: -360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: '75px 50px' }}
        />
        {/* Wheel center dot */}
        <circle cx="75" cy="50" r="1.5" fill={colors.wheel.primary} className="opacity-80" />
      </svg>
    </div>
  )
  
  // Inline version for buttons (no text, just icon)
  if (inline) {
    return (
      <motion.div
        className={`inline-flex items-center justify-center relative ${className}`}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-label="Loading"
      >
        <Image
          src={sewingMachineIcon}
          alt=""
          width={16}
          height={16}
          className={currentSize.inline}
          priority
          aria-hidden="true"
        />
        {animatedElements}
      </motion.div>
    )
  }

  const sewingMachine = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center gap-6 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {/* Sewing Machine Image with Luxury Blue Animations */}
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Decorative luxury blue ring around the machine */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-200/50"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10"
        >
          <Image
            src={sewingMachineIcon}
            alt=""
            width={64}
            height={64}
            className={`${currentSize.image} drop-shadow-xl filter brightness-110`}
            priority
            aria-hidden="true"
          />
        </motion.div>
        {animatedElements}
      </div>

      {/* Loading Text with beautiful animation */}
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col items-center gap-2"
        >
          <motion.p
            className={`${currentSize.text} font-semibold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent tracking-wide`}
            animate={{
              backgroundPosition: ['0%', '100%', '0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {text}
          </motion.p>
          {/* Animated luxury blue dots with elegant pulse */}
          <motion.div
            className="flex gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="w-2 h-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm"
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.4, 1, 0.4],
                  boxShadow: [
                    '0 0 0 0 rgba(0, 113, 227, 0)',
                    '0 0 0 4px rgba(0, 113, 227, 0.2)',
                    '0 0 0 0 rgba(0, 113, 227, 0)',
                  ],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      <span className="sr-only">{text || 'Loading...'}</span>
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary-50/30 via-white to-primary-50/20 z-50 backdrop-blur-sm">
        {sewingMachine}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[200px] py-12">
      {sewingMachine}
    </div>
  )
}

















































