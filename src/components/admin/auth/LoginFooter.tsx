'use client'

import Link from 'next/link'

export default function LoginFooter() {
  return (
    <div className="px-8 pb-8 pt-4 border-t border-apple-gray-200">
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-apple-gray-500 hover:text-apple-gray-700 transition-colors"
        >
          ← Back to Store
        </Link>
      </div>
    </div>
  )
}
