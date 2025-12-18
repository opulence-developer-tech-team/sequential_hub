import type { Metadata } from 'next'
import { connectDB } from '@/lib/server/utils/db'
import { productService } from '@/lib/server/products/service'
import ProductDetailClient from '@/components/product-details/ProductDetailClient'

export const dynamic = 'force-dynamic'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://sequentialhub.com'

const DEFAULT_OG_IMAGE = '/logo/og-default.png'

function toAbsoluteUrl(urlOrPath: string) {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath
  return new URL(urlOrPath, SITE_URL).toString()
}

function getFirstProductImage(productDoc: any): string | null {
  const variants = Array.isArray(productDoc?.productVariant) ? productDoc.productVariant : []
  for (const v of variants) {
    if (Array.isArray(v?.imageUrls) && v.imageUrls.length > 0) {
      const first = v.imageUrls.find((u: any) => typeof u === 'string' && u.trim().length > 0)
      if (first) return first
    }
    const legacy = (v as any)?.imageUrl
    if (typeof legacy === 'string' && legacy.trim().length > 0) return legacy
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const rawSlug = params?.slug || ''
  const slug = decodeURIComponent(rawSlug)
  const canonicalPath = `/products/${encodeURIComponent(slug)}`

  try {
    await connectDB()
    const product = await productService.findProductBySlug(slug)

    if (!product) {
      return {
        title: 'Product not found',
        description: 'This product may have been removed or is unavailable.',
        alternates: { canonical: canonicalPath },
        openGraph: {
          type: 'website',
          title: 'Product not found | Sequential Hub',
          description: 'This product may have been removed or is unavailable.',
          url: canonicalPath,
          images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Product not found | Sequential Hub',
          description: 'This product may have been removed or is unavailable.',
          images: [DEFAULT_OG_IMAGE],
        },
      }
    }

    const name = String((product as any).name || 'Product')
    const descriptionRaw = String((product as any).description || '')
    const description =
      descriptionRaw.trim().length > 0
        ? descriptionRaw.trim().slice(0, 180)
        : 'Premium custom tailoring and ready-to-wear clothing from Sequential Hub.'

    const image = getFirstProductImage(product)
    const ogImage = image ? toAbsoluteUrl(image) : DEFAULT_OG_IMAGE

    return {
      title: `${name} | Buy Online in Nigeria`,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        type: 'website',
        title: `${name} | Sequential Hub (Nigeria)`,
        description,
        url: canonicalPath,
        images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} | Sequential Hub (Nigeria)`,
        description,
        images: [ogImage],
      },
    }
  } catch {
    return {
      title: 'Product | Sequential Hub',
      description: 'Explore premium custom tailoring and ready-to-wear clothing.',
      alternates: { canonical: canonicalPath },
      openGraph: {
        type: 'website',
        title: 'Product | Sequential Hub',
        description: 'Explore premium custom tailoring and ready-to-wear clothing.',
        url: canonicalPath,
        images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Product | Sequential Hub',
        description: 'Explore premium custom tailoring and ready-to-wear clothing.',
        images: [DEFAULT_OG_IMAGE],
      },
    }
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />
}
