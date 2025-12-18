import { Package, Search } from 'lucide-react'

export default function EmptyOrdersState() {
  return (
    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-gray-100 rounded-full">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        We couldn't find any orders matching your criteria. Try adjusting your search terms or filters.
      </p>
    </div>
  )
}

