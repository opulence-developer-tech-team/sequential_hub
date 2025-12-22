'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ lies and says "MacIntel"
  const isIPadOS = (navigator as any).platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIOS || isIPadOS
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  const mqStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
  const iosStandalone = Boolean((navigator as any).standalone)
  return mqStandalone || iosStandalone
}

export default function PwaInstallButton({
  variant = 'icon',
  className = '',
}: {
  variant?: 'icon' | 'full'
  className?: string
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    setInstalled(isInStandaloneMode())

    const onBeforeInstallPrompt = (e: Event) => {
      // Chrome/Edge fires this when criteria are met.
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any)
    window.addEventListener('appinstalled', onAppInstalled as any)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onMqChange = () => setInstalled(isInStandaloneMode())
    mq?.addEventListener?.('change', onMqChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any)
      window.removeEventListener('appinstalled', onAppInstalled as any)
      mq?.removeEventListener?.('change', onMqChange)
    }
  }, [])

  // Show when:
  // - Not already installed AND
  // - (we have a deferred prompt on supporting browsers) OR (iOS needs A2HS instructions)
  const canShow = !installed && (Boolean(deferredPrompt) || isIos)

  const openOverlay = () => {
    if (installed) return
    // Open our custom overlay. The overlay will handle iOS instructions and/or native prompt.
    window.dispatchEvent(new CustomEvent('pwa:open-install'))
  }

  if (!canShow) return null

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openOverlay}
        aria-label="Install app"
        className={`p-2 sm:p-2.5 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-100 transition-all duration-200 flex-shrink-0 ${className}`}
        title="Install app"
      >
        <Download className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openOverlay}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-base font-semibold text-white hover:bg-primary-700 transition-colors ${className}`}
    >
      <Download className="h-5 w-5" />
      Install app
    </button>
  )
}













