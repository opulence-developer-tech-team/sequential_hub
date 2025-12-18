'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ProductBreadcrumbProps {
  productName: string
}

export default function ProductBreadcrumb({ productName }: ProductBreadcrumbProps) {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-700">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{productName}</span>
      </nav>

      {/* Back button */}
      <Link
        href="/products"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Link>
    </>
  )
}








































