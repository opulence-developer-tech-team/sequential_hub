'use client'

import { Truck, Shield, RotateCcw } from 'lucide-react'

export default function ProductFeatures() {
  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center">
          <Truck className="h-5 w-5 text-primary-600 mr-2" />
          <span className="text-sm text-gray-600">Free Shipping</span>
        </div>
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-primary-600 mr-2" />
          <span className="text-sm text-gray-600">Quality Guarantee</span>
        </div>
        <div className="flex items-center">
          <RotateCcw className="h-5 w-5 text-primary-600 mr-2" />
          <span className="text-sm text-gray-600">Easy Returns</span>
        </div>
      </div>
    </div>
  )
}




















































