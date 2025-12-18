'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  fullScreen?: boolean
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this page. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  fullScreen = false,
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-4">
      {/* Error Icon */}
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
      </div>

      {/* Error Content */}
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold text-apple-gray-900">{title}</h2>
        <p className="text-sm text-apple-gray-600">{message}</p>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-full hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={retryLabel}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] py-12">
      {content}
    </div>
  )
}


















































