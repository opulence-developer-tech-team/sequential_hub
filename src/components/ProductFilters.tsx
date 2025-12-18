'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { categories } from '@/data/products'
import { clothingCategories, productSizes } from '@/lib/resources'

export interface CategoryOption {
  value: string
  label: string
  id?: string
  slug?: string
  name?: string
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  isOpen: boolean
  onToggle: () => void
  initialFilters?: FilterState
  onFilterApplied?: () => void // Callback to close filter on mobile after selection
  categoryOptions?: CategoryOption[] // Optional: override default categories
  showColorFilter?: boolean // Optional: show color filter (for search page)
  availableColors?: string[] // Optional: available colors for color filter
}

export interface FilterState {
  category: string
  priceRange: [number, number]
  size: string
  color?: string // Optional color filter
  inStock: boolean
  featured: boolean
}

export default function ProductFilters({ 
  onFilterChange, 
  isOpen, 
  onToggle, 
  initialFilters,
  onFilterApplied,
  categoryOptions,
  showColorFilter = false,
  availableColors = []
}: ProductFiltersProps) {
  // Determine which categories to use
  const getCategoryOptions = (): CategoryOption[] => {
    if (categoryOptions) return categoryOptions
    
    // Default: use categories from @/data/products and map to CategoryOption format
    return categories.map(cat => ({
      value: cat.slug,
      label: cat.name,
      id: cat.id,
      slug: cat.slug,
      name: cat.name
    }))
  }

  const categoryList = getCategoryOptions()

  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      category: '',
      priceRange: [0, 1000],
      size: '',
      ...(showColorFilter ? { color: '' } : {}),
      inStock: false,
      featured: false
    }
  )

  // Debounce timer ref for price range
  const priceRangeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMountRef = useRef(true)
  const filtersRef = useRef(filters)
  const isOpeningRef = useRef(false)
  const previousIsOpenRef = useRef(isOpen)
  const openedAtRef = useRef<number | null>(null)
  const MIN_OPEN_DURATION = 1000 // Minimum 1 second before allowing auto-close
  const [mounted, setMounted] = useState(false)

  // Track mounted state for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Track when panel is opening to prevent auto-close during opening
  useEffect(() => {
    if (!previousIsOpenRef.current && isOpen) {
      // Panel is opening - set flags immediately to block all callbacks
      isOpeningRef.current = true
      openedAtRef.current = Date.now()
      
      // Reset opening flag after animation completes (300ms animation + 200ms buffer)
      const animationTimer = setTimeout(() => {
        isOpeningRef.current = false
      }, 500)
      
      return () => {
        clearTimeout(animationTimer)
      }
    } else if (previousIsOpenRef.current && !isOpen) {
      // Panel is closing - reset flags immediately
      isOpeningRef.current = false
      openedAtRef.current = null
    }
    previousIsOpenRef.current = isOpen
  }, [isOpen])

  // Helper to check if panel was just opened (within minimum duration)
  const canAutoClose = (): boolean => {
    if (!isOpen || isOpeningRef.current) {
      return false
    }
    if (openedAtRef.current === null) {
      return true // Panel has been open for a while
    }
    const timeSinceOpen = Date.now() - openedAtRef.current
    return timeSinceOpen >= MIN_OPEN_DURATION
  }

  // Sync internal filters with initialFilters prop when it changes
  // Only sync when filters actually differ to prevent unnecessary updates
  // Don't sync during opening or when panel is not open to prevent triggering auto-close
  useEffect(() => {
    // Only sync if panel is open and not currently opening
    if (initialFilters && isOpen && !isOpeningRef.current) {
      const filtersChanged = 
        initialFilters.category !== filters.category ||
        initialFilters.size !== filters.size ||
        initialFilters.inStock !== filters.inStock ||
        initialFilters.featured !== filters.featured ||
        initialFilters.priceRange[0] !== filters.priceRange[0] ||
        initialFilters.priceRange[1] !== filters.priceRange[1] ||
        (showColorFilter && initialFilters.color !== filters.color)
      
      if (filtersChanged) {
        setFilters(initialFilters)
      }
    }
  }, [initialFilters, filters, showColorFilter, isOpen])

  // Keep filtersRef in sync with filters
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Lock body scroll when filter is open on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const isMobile = window.innerWidth < 1024
    
    if (isOpen && isMobile) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow || ''
      document.body.style.overflow = 'hidden'
      
      // Cleanup: Always restore scrolling when filter closes
      return () => {
        // Always restore to empty string to ensure scrolling works
        document.body.style.overflow = originalOverflow || ''
      }
    }
    
    // When filter closes, always ensure scrolling is restored
    if (!isOpen) {
      // Reset overflow to ensure scrolling works
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key to close filter
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onToggle])

  // Debounce price range changes (skip on initial mount)
  useEffect(() => {
    // Skip debounce on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      return
    }

    // Don't process price range changes while panel is opening
    if (isOpeningRef.current) {
      return
    }

    if (priceRangeDebounceTimerRef.current) {
      clearTimeout(priceRangeDebounceTimerRef.current)
    }

    priceRangeDebounceTimerRef.current = setTimeout(() => {
      // Final check: can auto-close, panel is open, and window width is mobile
      if (canAutoClose() && typeof window !== 'undefined' && window.innerWidth < 1024) {
        onFilterChange(filtersRef.current)
        // Auto-close on mobile after price range change (debounced)
        // Final check before closing
        if (onFilterApplied && isOpen && canAutoClose()) {
          onFilterApplied()
        }
      }
    }, 500)

    return () => {
      if (priceRangeDebounceTimerRef.current) {
        clearTimeout(priceRangeDebounceTimerRef.current)
      }
    }
  }, [filters.priceRange, onFilterChange, onFilterApplied, isOpen])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    // CRITICAL: Don't process ANY changes while panel is opening, not open, or just opened
    if (!isOpen || isOpeningRef.current || !canAutoClose()) {
      return
    }

    // Check if the value actually changed to prevent unnecessary updates
    const currentValue = filters[key]
    if (key === 'priceRange') {
      const currentRange = currentValue as [number, number]
      const newRange = value as [number, number]
      if (currentRange[0] === newRange[0] && currentRange[1] === newRange[1]) {
        return // No change, skip update
      }
    } else if (currentValue === value) {
      return // No change, skip update
    }

    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // For price range, don't call onFilterChange immediately (handled by debounce effect)
    // For other filters, call immediately
    if (key !== 'priceRange') {
      onFilterChange(newFilters)
      // Auto-close on mobile after filter selection (except price range which is debounced)
      // Only auto-close if minimum duration has passed
      if (onFilterApplied && canAutoClose() && typeof window !== 'undefined' && window.innerWidth < 1024) {
        // Small delay to ensure filter is applied before closing
        setTimeout(() => {
          // Final check: panel is still open and can auto-close
          if (isOpen && canAutoClose() && typeof window !== 'undefined' && window.innerWidth < 1024) {
            onFilterApplied()
          }
        }, 200)
      }
    }
  }

  const clearFilters = () => {
    // CRITICAL: Don't process if panel is opening, not open, or just opened
    if (isOpeningRef.current || !isOpen || !canAutoClose()) {
      return
    }

    const clearedFilters: FilterState = {
      category: '',
      priceRange: [0, 1000],
      size: '',
      ...(showColorFilter ? { color: '' } : {}),
      inStock: false,
      featured: false
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
    // Auto-close on mobile after clearing
    // Only auto-close if the filter panel is actually open, not during opening, and minimum duration has passed
    if (onFilterApplied && canAutoClose() && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        // Final check: panel is still open, can auto-close, and window width is still mobile
        if (isOpen && canAutoClose() && typeof window !== 'undefined' && window.innerWidth < 1024) {
          onFilterApplied()
        }
      }, 200)
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.priceRange[1] < 1000) count++
    if (filters.size) count++
    if (showColorFilter && filters.color) count++
    if (filters.inStock) count++
    if (filters.featured) count++
    return count
  }

  return (
    <>
      {/* Desktop: Always visible sidebar */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Clear filters button */}
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearFilters}
              className="w-full mb-6 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors"
            >
              Clear All Filters
            </button>
          )}

          {/* Category filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value=""
                  checked={filters.category === ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">All Categories</span>
              </label>
              {categoryList.map((category, index) => (
                <label key={category.id || category.value || `category-${index}`} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={category.value || category.slug || ''}
                    checked={filters.category === (category.value || category.slug || '')}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category.label || category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price range filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.priceRange[0]}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0)
                    handleFilterChange('priceRange', [value, filters.priceRange[1]])
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={filters.priceRange[1]}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0)
                    handleFilterChange('priceRange', [filters.priceRange[0], value])
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* Size filter */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Size</h4>
            <select
              value={filters.size}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Sizes</option>
              {productSizes.map((size: { value: string; label: string }) => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          {/* Availability filters */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Availability</h4>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Slide-in filter panel - Render via Portal to escape stacking contexts */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onToggle}
                className="lg:hidden fixed inset-0 bg-black/50"
                style={{ zIndex: 100000, position: 'fixed' }}
              />

              {/* Filter panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                className="lg:hidden fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
                style={{ zIndex: 100001, position: 'fixed' }}
              >
                  {/* Header with close button */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 shadow-sm" style={{ zIndex: 100002 }}>
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={onToggle}
                  className="p-2.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 flex items-center justify-center"
                  aria-label="Close filters"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4">
                {/* Clear filters button */}
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full mb-6 px-4 py-2.5 text-sm font-medium text-primary-600 border-2 border-primary-600 rounded-md hover:bg-primary-50 active:bg-primary-100 transition-colors"
                  >
                    Clear All Filters ({getActiveFiltersCount()})
                  </button>
                )}

                {/* Category filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer py-1.5">
                      <input
                        type="radio"
                        name="category-mobile"
                        value=""
                        checked={filters.category === ''}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Categories</span>
                    </label>
                    {categoryList.map((category, index) => (
                      <label key={category.id || category.value || `category-mobile-${index}`} className="flex items-center cursor-pointer py-1.5">
                        <input
                          type="radio"
                          name="category-mobile"
                          value={category.value || category.slug || ''}
                          checked={filters.category === (category.value || category.slug || '')}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">{category.label || category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price range filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={filters.priceRange[0]}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0)
                          handleFilterChange('priceRange', [value, filters.priceRange[1]])
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={filters.priceRange[1]}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0)
                          handleFilterChange('priceRange', [filters.priceRange[0], value])
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>

                {/* Size filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Size</h4>
                  <select
                    value={filters.size}
                    onChange={(e) => handleFilterChange('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Sizes</option>
                    {productSizes.map((size: { value: string; label: string }) => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color filter (optional) */}
                {showColorFilter && availableColors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Color</h4>
                    <select
                      value={filters.color || ''}
                      onChange={(e) => handleFilterChange('color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Colors</option>
                      {availableColors.map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Availability filters */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Availability</h4>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer py-1.5">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                    </label>
                    <label className="flex items-center cursor-pointer py-1.5">
                      <input
                        type="checkbox"
                        checked={filters.featured}
                        onChange={(e) => handleFilterChange('featured', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured Only</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  )
}

