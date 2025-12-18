'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Settings, LogOut, User, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useHttp } from '@/hooks/useHttp'
import LogoutConfirmationModal from '@/components/user/LogoutConfirmationModal'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { sendHttpRequest: checkAuthRequest, error: authError } = useHttp()
  const { sendHttpRequest: logoutRequest, isLoading: isLoggingOut } = useHttp()
  const mainContentRef = useRef<HTMLElement>(null)

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
    
    // Scroll the admin main content container to top as well
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
  }, [pathname])

  // Check authentication via httpOnly cookie (production-ready approach)
  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setIsAuthenticated(true)
      return
    }

    // Verify authentication by calling API endpoint
    // The server checks the httpOnly cookie automatically
    checkAuthRequest({
      requestConfig: {
        method: 'GET',
        url: '/admin/verify',
      },
      successRes: (response: any) => {
        const isAuth = response?.data?.data?.authenticated === true
        setIsAuthenticated(isAuth)
        if (!isAuth) {
          router.push('/admin/login')
        }
      },
    })
  }, [pathname, router, checkAuthRequest])

  // Handle auth check errors
  useEffect(() => {
    if (authError && isAuthenticated === null && pathname !== '/admin/login') {
      // If auth check fails, redirect to login
      setIsAuthenticated(false)
      router.push('/admin/login')
    }
  }, [authError, isAuthenticated, pathname, router])

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    // Call logout API to clear httpOnly cookie
    logoutRequest({
      requestConfig: {
        method: 'POST',
        url: '/admin/logout',
      },
      successRes: () => {
        // Logout successful - cookie cleared
        // Redirect is handled optimistically below
      },
    })
    setIsAuthenticated(false)
    setShowLogoutModal(false)
    // Redirect to login page immediately (optimistic redirect)
    // The API call will clear the cookie in the background
    router.push('/admin/login')
  }

  // Show loading state while checking auth
  if (isAuthenticated === null && pathname !== '/admin/login') {
    return <LoadingSpinner fullScreen text="Loading..." />
  }

  // Don't render layout on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Products', href: '/admin/products', icon: '👕' },
    { name: 'Orders', href: '/admin/orders', icon: '📦' },
    { name: 'Customers', href: '/admin/customers', icon: '👥' },
    { name: 'Measurements', href: '/admin/measurements', icon: '📏' },
    // { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
    { name: 'Shipping Settings', href: '/admin/shipping-settings', icon: '🚚' },
    // { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ]

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 h-screen ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-screen">
          {/* Logo - Fixed at top */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <Link href="/admin" className="flex items-center">
              <span className="text-xl font-bold text-primary-600">Sequential Hub</span>
              <span className="ml-2 text-sm text-gray-500">Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Section - Fixed at bottom */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@sequentialhub.com</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Home className="mr-3 h-4 w-4" />
                View Store
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0 min-w-0 h-screen overflow-hidden">
        {/* Top header */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-500">Welcome back, Admin</p>
              </div>
              {/* <Link 
                href="/admin/settings"
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <Settings className="h-5 w-5" />
              </Link> */}
            </div>
          </div>
        </div>

        {/* Page content - Scrollable */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  )
}
