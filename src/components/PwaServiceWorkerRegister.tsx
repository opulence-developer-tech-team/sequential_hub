'use client'

import { useEffect } from 'react'

export default function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        // Register at site root so it controls the whole app.
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch {
        // Silent fail: installability should not break the app UX.
      }
    }

    // Defer to idle to avoid competing with critical rendering.
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(register, { timeout: 2000 })
    } else {
      setTimeout(register, 500)
    }
  }, [])

  return null
}














