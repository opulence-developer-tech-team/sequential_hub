import type { MetadataRoute } from 'next'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://sequentialhub.com'

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL

  return {
    name: 'Sequential Hub',
    short_name: 'Sequential Hub',
    description:
      'Premium custom tailoring and ready-to-wear clothing. Order online, share your measurements, and get worldwide delivery.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#0071e3',
    categories: ['shopping', 'lifestyle', 'business'],
    lang: 'en',
    dir: 'ltr',
    id: `${baseUrl}/`,
    icons: [
      {
        src: '/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/pwa/maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}






