import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop Custom Tailored Clothing & Ready-to-Wear',
  description:
    'Browse premium clothing and accessories in Nigeria. Choose your size and color, or request made-to-measure tailoring with your measurements.',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'Shop Products in Nigeria | Sequential Hub',
    description:
      'Browse premium clothing and accessories in Nigeria. Choose your size and color, or request made-to-measure tailoring.',
    url: '/products',
    images: [
      {
        url: '/logo/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Sequential Hub - Shop Products in Nigeria',
      },
    ],
  },
  twitter: {
    title: 'Shop Products in Nigeria | Sequential Hub',
    description:
      'Browse premium clothing and accessories in Nigeria. Choose your size and color, or request made-to-measure tailoring.',
    images: ['/logo/og-default.png'],
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}



















