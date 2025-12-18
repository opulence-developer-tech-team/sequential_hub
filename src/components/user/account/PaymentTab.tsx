'use client'

export default function PaymentTab() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
      <div className="border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No payment methods saved</p>
        <button className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
          Add Payment Method
        </button>
      </div>
    </div>
  )
}












































