'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
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
  
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-16" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  )
}













































