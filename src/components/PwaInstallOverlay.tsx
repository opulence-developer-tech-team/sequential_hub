'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Download, Shield, Zap, WifiOff, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isIPadOS = (navigator as any).platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isIOS || isIPadOS
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  const mqStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
  const iosStandalone = Boolean((navigator as any).standalone)
  return mqStandalone || iosStandalone
}

const DISMISS_KEY = 'pwa_install_dismissed_at'
const PERMANENT_DISMISS_KEY = 'pwa_install_permanently_dismissed'

function isPermanentlyDismissed(): boolean {
  try {
    return localStorage.getItem(PERMANENT_DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

function markPermanentlyDismissed() {
  try {
    localStorage.setItem(PERMANENT_DISMISS_KEY, 'true')
  } catch {
    // ignore
  }
}

/**
 * Full-screen install overlay.
 * - Shows our UI first
 * - Only triggers native browser prompt when user clicks Install (required by browsers)
 */
export default function PwaInstallOverlay() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    setInstalled(isInStandaloneMode())

    // Clear old dismiss key from previous version so users who cancelled before will see it again
    // Only permanent dismissal should prevent showing the dialog now
    try {
      localStorage.removeItem(DISMISS_KEY)
    } catch {
      // ignore
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Only check for permanent dismissal - previous cancellations won't prevent showing
      if (!isInStandaloneMode() && !isPermanentlyDismissed()) {
        setOpen(true)
      }
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setOpen(false)
    }

    const onOpenInstall = () => {
      if (isInStandaloneMode()) return
      if (isPermanentlyDismissed()) return
      setOpen(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any)
    window.addEventListener('appinstalled', onAppInstalled as any)
    window.addEventListener('pwa:open-install', onOpenInstall as any)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onMqChange = () => setInstalled(isInStandaloneMode())
    mq?.addEventListener?.('change', onMqChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any)
      window.removeEventListener('appinstalled', onAppInstalled as any)
      window.removeEventListener('pwa:open-install', onOpenInstall as any)
      mq?.removeEventListener?.('change', onMqChange)
    }
  }, [])

  const canInstall = !installed && (Boolean(deferredPrompt) || isIos)

  const close = () => {
    setOpen(false)
    // Don't mark as dismissed - this allows it to show again on page refresh
  }

  const handlePermanentDismiss = () => {
    markPermanentlyDismissed()
    setOpen(false)
  }

  const handleInstall = async () => {
    if (installed) return

    // iOS: no prompt API; we can only instruct.
    if (!deferredPrompt) return

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      // If accepted, the appinstalled event usually fires. We also close here.
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        setOpen(false)
      } else {
        // user dismissed native prompt - just close, don't prevent showing again
        setOpen(false)
      }
    } finally {
      setDeferredPrompt(null)
      setIsInstalling(false)
    }
  }

  if (!open || !canInstall) return null

  return (
    <div className="fixed inset-0 z-[100000003]">
      <button
        type="button"
        aria-label="Close install dialog"
        className="absolute inset-0 bg-black/55"
        onClick={close}
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-3 sm:p-6">
        <div className="relative w-full sm:max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-apple-gray-200">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary-500/15 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary-600/15 blur-2xl" />
          </div>

          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white border border-apple-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo/logo.png"
                    alt="Sequential Hub"
                    width={48}
                    height={48}
                    className="h-10 w-10 rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-apple-gray-900">Install Sequential Hub</p>
                  <p className="text-sm text-apple-gray-600">Faster access. App-like experience.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 text-apple-gray-500 hover:text-apple-gray-900 hover:bg-apple-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-4 py-3">
                <Zap className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-apple-gray-900">Launch in one tap</p>
                  <p className="text-sm text-apple-gray-600">Add to your home screen / desktop.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-4 py-3">
                <WifiOff className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-apple-gray-900">Works better on poor networks</p>
                  <p className="text-sm text-apple-gray-600">Basic pages and assets can load from cache.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-apple-gray-200 bg-apple-gray-50 px-4 py-3">
                <Shield className="h-5 w-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-apple-gray-900">Safe install</p>
                  <p className="text-sm text-apple-gray-600">Install is handled by your browser.</p>
                </div>
              </div>
            </div>

            {isIos && (
              <div className="mt-4 rounded-xl border border-apple-gray-200 bg-white px-4 py-3 text-sm text-apple-gray-700">
                <p className="font-medium text-apple-gray-900">iPhone/iPad instructions</p>
                <p className="mt-1">
                  Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={isIos ? close : handleInstall}
                disabled={!deferredPrompt && !isIos}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-5 w-5" />
                {isIos ? 'Got it' : isInstalling ? 'Opening…' : 'Install app'}
              </button>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-apple-gray-200 bg-white px-4 py-3 text-sm font-semibold text-apple-gray-900 hover:bg-apple-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePermanentDismiss}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-apple-gray-200 bg-white px-4 py-3 text-sm font-semibold text-apple-gray-600 hover:bg-apple-gray-50 transition-colors"
                >
                  Don't show this again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}














