export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-apple-gray-900">You’re offline</h1>
        <p className="mt-2 text-sm text-apple-gray-600">
          Please check your internet connection and try again.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Go to homepage
        </a>
      </div>
    </div>
  )
}






