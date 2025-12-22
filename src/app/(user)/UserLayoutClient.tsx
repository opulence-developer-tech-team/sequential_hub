'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'

interface UserLayoutClientProps {
  children: ReactNode
}

export default function UserLayoutClient({ children }: UserLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Scroll to the very top when route changes
  useEffect(() => {
    // Use smooth scroll to the very top
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    
    // Also scroll the document element and body to ensure compatibility
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
  }, [pathname])

  // Check authentication for user pages
  useEffect(() => {
    // Check for user auth token
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken')
    
    if (!token) {
      // Redirect to login or home if not authenticated
      // For now, we'll allow access but you can add redirect logic here
      setIsAuthenticated(false)
    } else {
      setIsAuthenticated(true)
    }
  }, [pathname, router])

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center">
        <SewingMachineLoader size="md" text="Verifying authentication, please wait..." />
      </div>
    )
  }

  return <>{children}</>
}






























