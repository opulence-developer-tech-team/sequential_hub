import type { MetadataRoute } from 'next'
import { connectDB } from '@/lib/server/utils/db'
import Product from '@/lib/server/products/entity'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://sequentialhub.com'

const baseUrl = SITE_URL.replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/measurements`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/faq`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    await connectDB()

    // Keep sitemap generation lightweight and fail-safe.
    // We only need slug + updatedAt for canonical product URLs.
    const products = await Product.find({}, { slug: 1, updatedAt: 1 })
      .limit(5000)
      .lean()
      .exec()

    const productRoutes: MetadataRoute.Sitemap = (Array.isArray(products) ? products : [])
      .filter((p: any) => typeof p?.slug === 'string' && p.slug.trim().length > 0)
      .map((p: any) => ({
        url: `${baseUrl}/products/${encodeURIComponent(p.slug)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))

    return [...staticRoutes, ...productRoutes]
  } catch {
    // If DB is unavailable, still serve the static routes.
    return staticRoutes
  }
}






