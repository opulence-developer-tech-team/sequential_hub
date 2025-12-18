'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setUserData, clearUserData } from '@/store/redux/user/user-data-slice'
import { authActions } from '@/store/redux/auth/auth-slice'
import { setWishlist, clearWishlist } from '@/store/redux/user/user-wishlist-slice'
import { useHttp } from '@/hooks/useHttp'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import AccountSidebar from '@/components/user/account/AccountSidebar'
import LogoutConfirmationModal from '@/components/user/LogoutConfirmationModal'
import ProfileTab from '@/components/user/account/ProfileTab'
import OrdersTab from '@/components/user/account/OrdersTab'
import WishlistTab from '@/components/user/account/WishlistTab'
import AddressesTab from '@/components/user/account/AddressesTab'
import PaymentTab from '@/components/user/account/PaymentTab'
import SettingsTab from '@/components/user/account/SettingsTab'

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { isLoading: isFetchingUser, sendHttpRequest: fetchUserReq, error: fetchError } = useHttp()
  const { isLoading: isFetchingWishlist, sendHttpRequest: fetchWishlistReq } = useHttp()
  const { isLoading: isLoggingOut, sendHttpRequest: logoutRequest } = useHttp()
  const userData = useAppSelector((state) => state.userData.user)
  const hasFetchedUserData = useAppSelector((state) => state.userData.hasFetchedUserData)
  const wishlistData = useAppSelector((state) => state.userWishlist.wishlist)
  const hasFetchedWishlist = useAppSelector((state) => state.userWishlist.hasFetchedWishlist)
  const [activeTab, setActiveTab] = useState('profile')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Get redirect path from query params
  const redirectPath = searchParams.get('redirect')
  const initialTab = searchParams.get('tab')
  const [user, setUser] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    phone: userData?.phoneNumber || '',
    address: {
      street: userData?.street || '',
      city: userData?.city || '',
      state: userData?.state || '',
      zipCode: userData?.zipCode || '',
      country: userData?.country || 'Nigeria'
    }
  })

  // Fetch user data on component mount if not fetched yet
  useEffect(() => {
    if (!hasFetchedUserData) {
      fetchUserReq({
        successRes: (response: any) => {
          if (response?.data?.data) {
            dispatch(setUserData(response.data.data))
            const user = response.data.data
            setUser(prev => ({
              ...prev,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email,
              phone: user.phoneNumber || '',
              address: {
                street: user.street || '',
                city: user.city || '',
                state: user.state || '',
                zipCode: user.zipCode || '',
                country: user.country || 'Nigeria'
              }
            }))
          }
        },
        requestConfig: {
          url: '/user/fetch-user-details',
          method: 'GET',
        },
      })
    } else if (userData) {
      // Update local state from Redux
      setUser(prev => ({
        ...prev,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        address: {
          street: userData.street || '',
          city: userData.city || '',
          state: userData.state || '',
          zipCode: userData.zipCode || '',
          country: userData.country || 'Nigeria'
        }
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFetchedUserData, userData])

  // Sync active tab with ?tab= query parameter (e.g. /account?tab=orders)
  useEffect(() => {
    if (!initialTab) return
    const validTabs = ['profile', 'orders', 'wishlist', 'addresses', 'payment', 'settings']
    if (validTabs.includes(initialTab) && initialTab !== activeTab) {
      setActiveTab(initialTab)
    }
    // We intentionally exclude activeTab from deps to avoid loops when user clicks tabs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab])

  // Fetch wishlist when wishlist tab is active
  useEffect(() => {
    if (activeTab === 'wishlist' && !hasFetchedWishlist) {
      fetchWishlistReq({
        successRes: (response: any) => {
          if (response?.data?.data) {
            dispatch(setWishlist(response.data.data))
          }
        },
        requestConfig: {
          url: '/user/fetch-wish-list',
          method: 'GET',
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasFetchedWishlist])

  // Loading state - show loader while fetching user data
  if (isFetchingUser && !hasFetchedUserData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SewingMachineLoader size="lg" text="Loading account, please wait..." />
      </div>
    )
  }

  // Error state - show error if fetch failed and no user data
  if (fetchError && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load account</h2>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <button
            onClick={() => {
              fetchUserReq({
                successRes: (response: any) => {
                  if (response?.data?.data) {
                    dispatch(setUserData(response.data.data))
                    const user = response.data.data
                    setUser(prev => ({
                      ...prev,
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      email: user.email,
                      phone: user.phoneNumber || '',
                      address: {
                        street: user.street || '',
                        city: user.city || '',
                        state: user.state || '',
                        zipCode: user.zipCode || '',
                        country: user.country || ''
                      }
                    }))
                  }
                },
                requestConfig: {
                  url: '/user/fetch-user-details',
                  method: 'GET',
                },
              })
            }}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const handleSignOut = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    // Call logout API to clear httpOnly cookie
    logoutRequest({
      requestConfig: {
        method: 'POST',
        url: '/auth/logout',
      },
      successRes: () => {
        // Clear user data from Redux
        dispatch(clearUserData())
        // Clear wishlist data from Redux
        dispatch(clearWishlist())
        // Set auth status to false (not authenticated) so Header shows Login button
        dispatch(authActions.setAuthStatus(false))
        // Close modal
        setShowLogoutModal(false)
        // Redirect to home page
        router.push('/')
      },
    })
  }


  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Close sidebar on mobile when tab changes
    setIsSidebarOpen(false)
    // Keep URL in sync with selected tab for deep linking
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    const queryString = params.toString()
    router.replace(queryString ? `/account?${queryString}` : '/account', { scroll: false })
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-watermark relative py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with mobile menu button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your account settings and preferences</p>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Desktop: always visible, Mobile: slide in/out */}
          <div className="lg:col-span-1">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <AccountSidebar
                userName={`${user.firstName} ${user.lastName}`.trim() || 'User'}
                userEmail={user.email}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onSignOut={handleSignOut}
              />
            </div>

            {/* Mobile Sidebar - Slide in/out */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                  />
                  {/* Sidebar */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                    className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 overflow-y-auto"
                  >
                    {/* Header with close button */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 flex items-center justify-center"
                        aria-label="Close menu"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="p-4">
                      <AccountSidebar
                        userName={`${user.firstName} ${user.lastName}`.trim() || 'User'}
                        userEmail={user.email}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        onSignOut={handleSignOut}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              {activeTab === 'profile' && (
                <ProfileTab
                  user={user}
                  onUserChange={(updatedUser) => setUser({ ...user, ...updatedUser })}
                  onSaveSuccess={() => {
                    // Redirect back to checkout if user came from there
                    if (redirectPath) {
                      router.push(redirectPath)
                    }
                  }}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersTab />
              )}

              {activeTab === 'wishlist' && (
                <WishlistTab 
                  isLoading={isFetchingWishlist}
                  products={wishlistData?.products}
                  productIds={wishlistData?.productIds || []}
                />
              )}

              {activeTab === 'addresses' && (
                <AddressesTab 
                  address={user.address} 
                  onAddressChange={(updatedAddress) => 
                    setUser(prev => ({
                      ...prev,
                      address: { ...prev.address, ...updatedAddress }
                    }))
                  }
                  onSaveSuccess={() => {
                    // Redirect back to checkout if user came from there
                    if (redirectPath) {
                      router.push(redirectPath)
                    }
                  }}
                />
              )}

              {activeTab === 'payment' && (
                <PaymentTab />
              )}

              {activeTab === 'settings' && (
                <SettingsTab />
              )}
            </div>
          </div>
        </div>
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

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SewingMachineLoader size="lg" text="Loading account, please wait..." />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  )
}
