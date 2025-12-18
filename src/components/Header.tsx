'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, User, Search, Menu, X, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { products } from '@/data/products'
import { Product } from '@/types'
import sewingMachineIcon from '@/assets/icon/sewing-machine.png'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useHttp } from '@/hooks/useHttp'
import { authActions } from '@/store/redux/auth/auth-slice'
import { setUserData } from '@/store/redux/user/user-data-slice'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  // Get cartLength from state, with fallback to calculating from items
  const cartState = useAppSelector((state) => state.clientCart)
  const cartLength = cartState.cartLength > 0 
    ? cartState.cartLength 
    : (Array.isArray(cartState.clientCartItems) ? cartState.clientCartItems.length : 0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, hasCheckedAuth } = useAppSelector((state) => state.auth)
  const { sendHttpRequest: sendAuthCheckRequest } = useHttp()
  const [hasTriedClientAuthCheck, setHasTriedClientAuthCheck] = useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Products', href: '/products' },
    { name: 'Measurements', href: '/measurements' },
  ]

  const popularSearches = [
    'Designer Suits', 'Casual Shirts', 'Formal Wear', 'Summer Collection',
    'Winter Jackets', 'Business Attire', 'Evening Dresses', 'Custom Tailoring'
  ]

  // Handle scroll effect with throttling
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load search history with error handling
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory')
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed)
        }
      }
    } catch (error) {
      // Silently fail if localStorage is unavailable or corrupted
      console.warn('Failed to load search history:', error)
      setSearchHistory([])
    }
  }, [])

  // Fallback client-side auth check:
  // In rare cases where the initial server-side auth check was stale,
  // re-verify once on the client if we think the user is logged out.
  useEffect(() => {
    if (!hasCheckedAuth || isAuthenticated || hasTriedClientAuthCheck) {
      return
    }

    setHasTriedClientAuthCheck(true)

    sendAuthCheckRequest({
      requestConfig: {
        method: 'GET',
        url: '/user/fetch-user-details',
      },
      successRes: (response: any) => {
        const user = response?.data?.data
        if (user) {
          // We have a valid user session on the client – update Redux auth & user data
          dispatch(authActions.setAuthStatus(true))
          dispatch(setUserData(user))
        } else {
          dispatch(authActions.setAuthStatus(false))
        }
      },
      errorRes: () => {
        // Explicitly mark as not authenticated on failure
        dispatch(authActions.setAuthStatus(false))
        // Returning false prevents default toast from useHttp
        return false
      },
    })
  }, [hasCheckedAuth, isAuthenticated, hasTriedClientAuthCheck, sendAuthCheckRequest, dispatch])

  const saveToHistory = (term: string) => {
    try {
      if (term.trim() && !searchHistory.includes(term.trim())) {
        const newHistory = [term.trim(), ...searchHistory].slice(0, 5)
        setSearchHistory(newHistory)
        localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      }
    } catch (error) {
      // Silently fail if localStorage is unavailable
      console.warn('Failed to save search history:', error)
    }
  }

  const handleSearch = (term: string) => {
    if (term.trim()) {
      saveToHistory(term)
      router.push(`/search?q=${encodeURIComponent(term)}`)
    }
    setShowSuggestions(false)
    setSearchTerm('')
    setIsSearchOpen(false)
  }

  const getSearchSuggestions = () => {
    if (!searchTerm.trim()) return []
    
    const term = searchTerm.toLowerCase()
    const productsArray: Product[] = Array.isArray(products) ? products : []
    return productsArray
      .filter((product) => 
        product.name?.toLowerCase()?.includes(term) ||
        product.category?.toLowerCase()?.includes(term)
      )
      .slice(0, 5)
      .map((product) => ({
        type: 'product' as const,
        text: product.name || '',
        category: product.category || ''
      }))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auth state is now initialized from server-side check in RootLayout

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-[99999999] transition-all duration-300',
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-apple-gray-200'
          : 'bg-white/95 backdrop-blur-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Sewing Machine Logo with Sewing Animation */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative w-8 h-8 flex items-center justify-center"
            >
              <Image
                src={sewingMachineIcon}
                alt="Sequential Hub Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                priority
              />
              {/* Sewing Animation: Needle, Thread, and Stitches */}
              <motion.div
                className="absolute inset-0 pointer-events-none overflow-visible"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="headerThreadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                      <stop offset="50%" stopColor="#0ea5e9" stopOpacity="1" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="headerNeedleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="headerStitchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="1" />
                    </linearGradient>
                    {/* Glow filter for better visibility */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Thread Spool - Rotating at top - Larger and more visible */}
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ transformOrigin: '50px 15px' }}
                    filter="url(#glow)"
                  >
                    <circle cx="50" cy="15" r="4.5" fill="#0071e3" opacity="1" />
                    <rect x="46" y="15" width="8" height="5" rx="0.5" fill="#0ea5e9" opacity="1" />
                    <circle cx="50" cy="20" r="4.5" fill="#0071e3" opacity="1" />
                  </motion.g>

                  {/* Thread flowing down from spool - Thicker and brighter */}
                  <motion.path
                    d="M 50 20 Q 48 30 50 40 Q 52 50 50 60"
                    stroke="#0071e3"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    animate={{
                      pathLength: [0, 1, 0],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Needle - Moving up and down (sewing motion) - Larger movement */}
                  <motion.g
                    animate={{
                      y: [0, 8, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{ transformOrigin: '50px 50px' }}
                    filter="url(#glow)"
                  >
                    {/* Needle body - Thicker */}
                    <rect x="47.5" y="42" width="5" height="12" rx="1" fill="#0071e3" opacity="1" />
                    {/* Needle eye - More visible */}
                    <circle cx="50" cy="47" r="1.2" fill="#ffffff" opacity="1" />
                    <circle cx="50" cy="47" r="0.8" fill="#0071e3" opacity="0.8" />
                    {/* Needle point - Larger */}
                    <path d="M 50 54 L 47 62 L 53 62 Z" fill="#0369a1" opacity="1" />
                    <line
                      x1="50"
                      y1="54"
                      x2="50"
                      y2="62"
                      stroke="#0071e3"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </motion.g>

                  {/* Presser Foot - Moves with needle - More visible */}
                  <motion.g
                    animate={{
                      y: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.1,
                    }}
                    filter="url(#glow)"
                  >
                    <rect x="47.5" y="54" width="5" height="2" rx="0.5" fill="#38bdf8" opacity="1" />
                    <path d="M 46 56 L 54 56 L 53 60 L 47 60 Z" fill="#0ea5e9" opacity="1" />
                  </motion.g>

                  {/* Stitch pattern forming - Thicker and brighter */}
                  <motion.g
                    animate={{
                      opacity: [0.7, 1, 0.7],
                      scaleX: [0.95, 1, 0.95],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    filter="url(#glow)"
                  >
                    <path
                      d="M 30 72 Q 35 70 40 72 T 50 72 T 60 72 T 70 72"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </motion.g>

                  {/* Thread tension guide - Pulsing - More visible */}
                  <motion.circle
                    cx="50"
                    cy="35"
                    r="2.5"
                    fill="#0ea5e9"
                    opacity="1"
                    filter="url(#glow)"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.9, 1, 0.9],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </svg>
              </motion.div>
            </motion.div>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm sm:text-xl font-semibold text-apple-gray-900 group-hover:text-primary-600 transition-colors duration-300 whitespace-nowrap"
            >
              Sequential Hub
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative px-4 py-2 text-xs font-medium transition-colors duration-200',
                    isActive
                      ? 'text-apple-gray-900'
                      : 'text-apple-gray-600 hover:text-apple-gray-900'
                  )}
                >
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-apple-gray-900"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full flex items-center" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-apple-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch(searchTerm)
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                    setSearchTerm('')
                  }
                }}
                placeholder="Search products..."
                aria-label="Search products"
                aria-expanded={showSuggestions}
                aria-controls="search-suggestions"
                className="block w-full pl-11 pr-12 py-2.5 bg-apple-gray-50 border border-apple-gray-200 rounded-full text-sm text-apple-gray-900 placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => handleSearch(searchTerm)}
                aria-label="Search"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
              
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    id="search-suggestions"
                    role="listbox"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 w-full top-full mt-2 bg-white border border-apple-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
                    style={{ marginTop: '8px' }}
                  >
                    {searchTerm && getSearchSuggestions().length > 0 && (
                      <div className="p-2">
                        {getSearchSuggestions().map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(suggestion.text)}
                            className="flex items-center w-full px-4 py-3 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 rounded-xl transition-colors duration-150"
                          >
                            <Search className="h-4 w-4 mr-3 text-apple-gray-400" />
                            <div>
                              <div className="font-medium">{suggestion.text}</div>
                              <div className="text-xs text-apple-gray-500 capitalize">{suggestion.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {!searchTerm && (
                      <div className="p-2 border-b border-apple-gray-100">
                        <h3 className="text-xs font-medium text-apple-gray-500 mb-2 px-4">Popular Searches</h3>
                        {popularSearches.slice(0, 4).map((term, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(term)}
                            className="flex items-center w-full px-4 py-3 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 rounded-xl transition-colors duration-150"
                          >
                            <TrendingUp className="h-4 w-4 mr-3 text-apple-gray-400" />
                            {term}
                          </button>
                        ))}
                      </div>
                    )}

                    {!searchTerm && searchHistory.length > 0 && (
                      <div className="p-2">
                        <h3 className="text-xs font-medium text-apple-gray-500 mb-2 px-4">Recent Searches</h3>
                        {searchHistory.slice(0, 3).map((term, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(term)}
                            className="flex items-center w-full px-4 py-3 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 rounded-xl transition-colors duration-150"
                          >
                            <Clock className="h-4 w-4 mr-3 text-apple-gray-400" />
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            {/* Mobile search button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={isSearchOpen}
              className="lg:hidden p-2 sm:p-2.5 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-100 transition-all duration-200 flex-shrink-0"
            >
              <Search className="h-5 w-5" />
            </motion.button>

            {/* User account / Auth buttons */}
            {!hasCheckedAuth ? (
              // Auth state loading - reserve space to avoid layout shift
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
            ) : isAuthenticated ? (
              // Authenticated - show user icon linking to dashboard
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Link
                  href="/account"
                  aria-label="Account Dashboard"
                  className="flex items-center justify-center p-2 sm:p-2.5 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-100 transition-all duration-200"
                >
                  <User className="h-5 w-5" />
                </Link>
              </motion.div>
            ) : (
              // Not authenticated - show Login button (sign-up link is on login page)
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Link
                  href="/sign-in"
                  className="flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  Login
                </Link>
              </motion.div>
            )}

            {/* Shopping cart */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Link
                href="/cart"
                aria-label={`Shopping cart${cartLength > 0 ? ` with ${cartLength} ${cartLength === 1 ? 'item' : 'items'}` : ''}`}
                className="relative flex items-center justify-center p-2 sm:p-2.5 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-100 transition-all duration-200"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartLength > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-sm"
                    aria-hidden="true"
                  >
                    {cartLength > 99 ? '99+' : cartLength}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="md:hidden p-2 sm:p-2.5 text-apple-gray-600 hover:text-apple-gray-900 rounded-full hover:bg-apple-gray-100 transition-all duration-200 flex-shrink-0"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden pb-4 overflow-hidden"
            >
              <div className="relative" ref={searchRef}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-apple-gray-400" />
                </div>
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSearch(searchTerm)
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false)
                        setSearchTerm('')
                        setIsSearchOpen(false)
                      }
                    }}
                    placeholder="Search products..."
                    aria-label="Search products"
                    aria-expanded={showSuggestions}
                    aria-controls="mobile-search-suggestions"
                    className="block w-full pl-11 pr-12 py-2.5 bg-apple-gray-50 border border-apple-gray-200 rounded-full text-sm text-apple-gray-900 placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                  />
                  {searchTerm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        setShowSuggestions(false)
                      }}
                      className="absolute inset-y-0 right-0 pr-10 flex items-center"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-apple-gray-400 hover:text-apple-gray-600" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleSearch(searchTerm)}
                    aria-label="Search"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Mobile Search Suggestions */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      id="mobile-search-suggestions"
                      role="listbox"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-50 w-full mt-2 bg-white border border-apple-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto"
                    >
                      {searchTerm && getSearchSuggestions().length > 0 && (
                        <div className="p-2">
                          {getSearchSuggestions().map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(suggestion.text)}
                              className="flex items-center w-full px-4 py-3 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 rounded-xl transition-colors duration-150"
                            >
                              <Search className="h-4 w-4 mr-3 text-apple-gray-400" />
                              <div>
                                <div className="font-medium">{suggestion.text}</div>
                                <div className="text-xs text-apple-gray-500 capitalize">{suggestion.category}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {!searchTerm && searchHistory.length > 0 && (
                        <div className="p-2 border-b border-apple-gray-100">
                          <h3 className="text-xs font-medium text-apple-gray-500 mb-2 px-4">Recent Searches</h3>
                          {searchHistory.slice(0, 3).map((term, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(term)}
                              className="flex items-center w-full px-4 py-3 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 rounded-xl transition-colors duration-150"
                            >
                              <Clock className="h-4 w-4 mr-3 text-apple-gray-400" />
                              {term}
                            </button>
                          ))}
                        </div>
                      )}

                      {!searchTerm && (
                        <div className="p-2">
                          <h3 className="text-xs font-medium text-apple-gray-500 mb-2 px-4">Popular Searches</h3>
                          {popularSearches.slice(0, 4).map((term, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(term)}
                              className="flex items-center w-full px-4 py-3 text-left text-sm text-apple-gray-700 hover:bg-apple-gray-50 rounded-xl transition-colors duration-150"
                            >
                              <TrendingUp className="h-4 w-4 mr-3 text-apple-gray-400" />
                              {term}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-apple-gray-200"
            >
              <div className="px-2 pt-4 pb-6 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-4 py-3 text-base font-medium rounded-xl transition-colors duration-200',
                      pathname === item.href
                        ? 'text-apple-gray-900 bg-apple-gray-100'
                        : 'text-apple-gray-600 hover:text-apple-gray-900 hover:bg-apple-gray-50'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Auth Buttons */}
                {!hasCheckedAuth ? null : isAuthenticated ? (
                  <Link
                    href="/account"
                    className="flex items-center px-4 py-3 text-base font-medium text-apple-gray-600 hover:text-apple-gray-900 hover:bg-apple-gray-50 rounded-xl transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    My Account
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    className="block px-4 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors duration-200 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
