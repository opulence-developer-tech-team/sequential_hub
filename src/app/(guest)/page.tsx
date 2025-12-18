import type { Metadata } from 'next'
import Hero from '@/components/Hero'
import CraftsmanshipSection from '@/components/CraftsmanshipSection'
import FeaturedProducts from '@/components/FeaturedProducts'
import AllProducts from '@/components/AllProducts'
import CategorySection from '@/components/CategorySection'
import CustomMeasurementsCTA from '@/components/CustomMeasurementsCTA'
import Features from '@/components/Features'
import Newsletter from '@/components/Newsletter'
import { getFeaturedProducts, getProducts } from '@/lib/get-products'

export const metadata: Metadata = {
  title: 'Custom Tailoring & Premium Clothing in Nigeria',
  description:
    'Shop premium ready-to-wear pieces and request made-to-measure tailoring. Share your measurements online and get your outfit delivered in Nigeria.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sequential Hub - Custom Tailoring & Premium Clothing',
    description:
      'Premium ready-to-wear and made-to-measure tailoring. Share your measurements online and get delivery in Nigeria.',
    url: '/',
    images: [
      {
        url: '/logo/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Sequential Hub - Custom Tailoring & Premium Clothing',
      },
    ],
  },
  twitter: {
    title: 'Sequential Hub - Custom Tailoring & Premium Clothing',
    description:
      'Premium ready-to-wear and made-to-measure tailoring. Share your measurements online and get delivery in Nigeria.',
    images: ['/logo/og-default.png'],
  },
}

export default async function HomePage() {
  // Fetch products in parallel for better performance
  // Shipping settings are now fetched in guest layout and stored in Redux
  const [featuredProducts, allProducts] = await Promise.all([
    getFeaturedProducts(3),
    getProducts({ page: 1, limit: 8 }),
  ])

  return (
    <div>
      <Hero />
      <FeaturedProducts products={featuredProducts} />
      <AllProducts products={allProducts} />
      <CategorySection />
      <CustomMeasurementsCTA />
      <CraftsmanshipSection />
      <Features />
      <Newsletter source="homepage" variant="standalone" />
    </div>
  )
}