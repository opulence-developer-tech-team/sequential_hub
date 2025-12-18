/* eslint-disable no-restricted-globals */
/**
 * Minimal production-safe service worker for installability + offline basics.
 * - Pre-caches core app shell assets
 * - Network-first for navigations (HTML)
 * - Cache-first for same-origin static assets (images, css, js, fonts)
 * - Bypasses /api requests (always network)
 */

const CACHE_VERSION = 'v1'
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`

// Keep this list conservative to avoid cache poisoning and stale HTML.
const APP_SHELL_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/maskable-192.png',
  '/pwa/maskable-512.png',
  '/pwa/apple-touch-icon.png',
  '/logo/og-default.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE)
      await cache.addAll(APP_SHELL_ASSETS)
      self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.map((key) => {
          if (key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key)
          }
          return null
        })
      )
      self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle GET requests.
  if (req.method !== 'GET') return

  // Never cache API responses.
  if (url.pathname.startsWith('/api/')) return

  // Ignore cross-origin requests (e.g. Cloudinary). Let the browser handle them.
  if (url.origin !== self.location.origin) return

  const accept = req.headers.get('accept') || ''
  const isNavigation = req.mode === 'navigate' || accept.includes('text/html')

  // Network-first for HTML navigations.
  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(RUNTIME_CACHE)
          cache.put(req, fresh.clone())
          return fresh
        } catch (err) {
          const cached = await caches.match(req)
          return cached || (await caches.match('/offline')) || Response.error()
        }
      })()
    )
    return
  }

  // Cache-first for static assets.
  const isStaticAsset =
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/logo/') ||
    url.pathname.startsWith('/pwa/') ||
    /\.(?:png|jpg|jpeg|webp|gif|svg|ico|css|js|woff2?)$/i.test(url.pathname)

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req)
        if (cached) return cached
        const res = await fetch(req)
        const cache = await caches.open(RUNTIME_CACHE)
        cache.put(req, res.clone())
        return res
      })()
    )
  }
})

