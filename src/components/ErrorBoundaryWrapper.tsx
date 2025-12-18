'use client'

import { ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'

interface ErrorBoundaryWrapperProps {
  children: ReactNode
}

export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}



































