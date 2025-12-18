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
  onInstalled,
}: {
  variant?: 'icon' | 'full'
  className?: string
  onInstalled?: () => void
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

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
      setShowIosHelp(false)
      onInstalled?.()
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
  }, [onInstalled])

  // Show when:
  // - Not already installed AND
  // - (we have a deferred prompt on supporting browsers) OR (iOS needs A2HS instructions)
  const canShow = !installed && (Boolean(deferredPrompt) || isIos)

  const handleInstall = async () => {
    if (installed) return

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          // appinstalled event should also fire; this is a backup.
          setInstalled(true)
          onInstalled?.()
        }
      } finally {
        setDeferredPrompt(null)
      }
      return
    }

    if (isIos) {
      setShowIosHelp(true)
    }
  }

  if (!canShow) return null

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstall}
          aria-label="Install app"
          className={`p-2 sm:p-2.5 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-100 transition-all duration-200 flex-shrink-0 ${className}`}
          title="Install app"
        >
          <Download className="h-5 w-5" />
        </button>

        {showIosHelp && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100000002] flex items-end sm:items-center justify-center"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowIosHelp(false)}
            />
            <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-apple-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-apple-gray-900">Install Sequential Hub</p>
                  <p className="mt-1 text-sm text-apple-gray-600">
                    On iPhone/iPad, tap <strong>Share</strong> and then <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-apple-gray-500 hover:text-apple-gray-900"
                  onClick={() => setShowIosHelp(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-base font-semibold text-white hover:bg-primary-700 transition-colors ${className}`}
      >
        <Download className="h-5 w-5" />
        Install app
      </button>

      {showIosHelp && (
        <div className="mt-3 rounded-xl border border-apple-gray-200 bg-white px-4 py-3 text-sm text-apple-gray-700">
          On iPhone/iPad: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
        </div>
      )}
    </>
  )
}

