'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { clothingCategories } from '@/lib/resources'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { ProductSize } from '@/types/enum'
import { 
  Search, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc,
  X,
  TrendingUp,
  Clock,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import SewingMachineLoader from '@/components/ui/SewingMachineLoader'
import ProductFilters, { FilterState as ProductFilterState } from '@/components/ProductFilters'

// Use ProductFilterState which already includes optional color
type SearchFilters = ProductFilterState

interface SortOption {
  value: string
  label: string
  icon: React.ReactNode
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isLoading, sendHttpRequest, error } = useHttp()
  
  const query = searchParams.get('q') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  
  const [searchTerm, setSearchTerm] = useState(query)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(query)
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    priceRange: [0, 1000],
    size: '',
    color: '', // Color filter for search page
    inStock: false,
    featured: false
  } as SearchFilters)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const sortOptions: SortOption[] = [
    { value: 'name', label: 'Name A-Z', icon: <SortAsc className="h-4 w-4" /> },
    { value: 'price-low', label: 'Price Low to High', icon: <SortAsc className="h-4 w-4" /> },
    { value: 'price-high', label: 'Price High to Low', icon: <SortDesc className="h-4 w-4" /> },
  ]

  // Popular search suggestions
  const popularSearches = [
    'Designer Suits', 'Casual Shirts', 'Formal Wear', 'Summer Collection',
    'Winter Jackets', 'Business Attire', 'Evening Dresses', 'Custom Tailoring'
  ]

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({ 
    searchTerm: query, 
    category: '', 
    featured: false,
    inStock: false,
    size: '',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'name',
    color: ''
  })
  const hasFetchedProducts = useRef(false)
  const fetchProductsRef = useRef<typeof fetchProducts | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm])

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Sync searchTerm with URL query parameter (only when URL changes, not when searchTerm changes)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    // Only update if URL query is different from current searchTerm
    // This prevents the loop where typing resets the input
    if (urlQuery !== searchTerm) {
      setSearchTerm(urlQuery)
      setDebouncedSearchTerm(urlQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // Only depend on searchParams, not searchTerm

  // Handle click outside to close suggestions - removed to prevent input blocking
  // Suggestions will close via blur handler instead


  // Save search to history
  const saveToHistory = useCallback((term: string) => {
    if (term.trim() && !searchHistory.includes(term.trim())) {
      const newHistory = [term.trim(), ...searchHistory].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    }
  }, [searchHistory])

  // Map API response to Product type
  const mapApiProductToProduct = useCallback((apiProduct: any): Product => {
    const variants = Array.isArray(apiProduct.productVariant) ? apiProduct.productVariant : []
    
    const productVariants = variants.map((v: any, index: number) => ({
      _id: v._id?.toString() || `variant-${index}`,
      imageUrl: v.imageUrl || '',
      color: v.color || '',
      quantity:
        typeof v.quantity === "number" && !isNaN(v.quantity) && v.quantity >= 0
          ? v.quantity
          : null,
      price:
        typeof v.price === "number" && !isNaN(v.price) && v.price >= 0
          ? v.price
          : null,
      discountPrice:
        typeof v.discountPrice === "number" &&
        !isNaN(v.discountPrice) &&
        v.discountPrice >= 0
          ? v.discountPrice
          : null,
      size: (v.size || '') as ProductSize,
      inStock: typeof v.inStock === 'boolean' ? v.inStock : false,
    }))
    
    return {
      _id: apiProduct._id?.toString() || apiProduct.slug || '',
      adminId: apiProduct.adminId?.toString() || '',
      name: apiProduct.name || '',
      description: apiProduct.description || '',
      slug: apiProduct.slug || '',
      category: apiProduct.category || '',
      material: apiProduct.material || '',
      productVariant: productVariants,
      isFeatured: typeof apiProduct.isFeatured === 'boolean' ? apiProduct.isFeatured : false,
      createdAt: apiProduct.createdAt ? (typeof apiProduct.createdAt === 'string' ? new Date(apiProduct.createdAt) : apiProduct.createdAt) : undefined,
      updatedAt: apiProduct.updatedAt ? (typeof apiProduct.updatedAt === 'string' ? new Date(apiProduct.updatedAt) : apiProduct.updatedAt) : undefined,
    } as Product
  }, [])

  // Helper function to get all colors from product variants
  const getColors = (product: Product): string[] => {
    if (!product.productVariant || product.productVariant.length === 0) return []
    return [...new Set(product.productVariant.map(v => v.color).filter(c => c))]
  }

  // Get all available colors from products for filter dropdown
  const availableColors = Array.from(
    new Set(
      products.flatMap(product => getColors(product))
    )
  ).sort()

  // Apply client-side color filter (API doesn't support color filtering)
  useEffect(() => {
    if (filters.color && filters.color.trim()) {
      const filtered = products.filter(product => getColors(product).includes(filters.color!))
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [products, filters.color])

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(
    (page: number = 1, showTableLoading: boolean = false, overrideFilters?: { category?: string; featured?: boolean; inStock?: boolean; searchTerm?: string; size?: string; minPrice?: number; maxPrice?: number; sortBy?: string }) => {
      const validPage = Math.max(1, Math.floor(page))
      
      if (showTableLoading) {
        setIsTableLoading(true)
      } else if (!hasFetchedProducts.current) {
        setIsInitialLoading(true)
      }

      const onFetchProductsSuccess = (res: any) => {
        try {
          const responseData = res?.data?.data
          const apiProducts = Array.isArray(responseData?.products) ? responseData.products : []
          const paginationData = responseData?.pagination

          const mappedProducts = apiProducts
            .filter((p: any) => p && p.slug && p.name)
            .map(mapApiProductToProduct)

          setProducts(mappedProducts)

          if (paginationData && typeof paginationData === 'object') {
            setPagination({
              page: paginationData.page || validPage,
              limit: paginationData.limit || 10,
              total: paginationData.total || 0,
              totalPages: paginationData.totalPages || 0,
              hasNextPage: paginationData.hasNextPage || false,
              hasPrevPage: paginationData.hasPrevPage || false,
            })
          }

          hasFetchedProducts.current = true
        } catch (error) {
          console.error('Error processing fetch products response:', error)
          setProducts([])
        } finally {
          setIsInitialLoading(false)
          setIsTableLoading(false)
        }
      }

      const activeCategory = overrideFilters?.category ?? filters.category
      const activeFeatured = overrideFilters?.featured ?? filters.featured
      const activeInStock = overrideFilters?.inStock ?? filters.inStock
      const activeSearchTerm = overrideFilters?.searchTerm ?? debouncedSearchTerm
      const activeSize = overrideFilters?.size ?? filters.size
      const activeMinPrice = overrideFilters?.minPrice ?? filters.priceRange[0]
      const activeMaxPrice = overrideFilters?.maxPrice ?? filters.priceRange[1]
      const activeSortBy = overrideFilters?.sortBy ?? sortBy

      // Map sortBy to API format
      let apiSortBy = 'name'
      if (activeSortBy === 'price-low') {
        apiSortBy = 'price-low'
      } else if (activeSortBy === 'price-high') {
        apiSortBy = 'price-high'
      } else {
        apiSortBy = 'name'
      }

      const queryParams = new URLSearchParams({
        page: validPage.toString(),
        limit: '10',
        sortBy: apiSortBy,
      })

      if (activeSearchTerm && activeSearchTerm.trim()) {
        queryParams.append('searchTerm', activeSearchTerm.trim())
      }

      if (activeCategory && activeCategory.trim()) {
        queryParams.append('category', activeCategory)
      }

      if (activeFeatured) {
        queryParams.append('featured', 'true')
      }

      if (activeInStock) {
        queryParams.append('inStock', 'true')
      }

      if (activeSize && activeSize.trim()) {
        queryParams.append('size', activeSize)
      }

      if (activeMinPrice > 0) {
        queryParams.append('minPrice', activeMinPrice.toString())
      }

      if (activeMaxPrice > 0 && activeMaxPrice !== 1000) {
        queryParams.append('maxPrice', activeMaxPrice.toString())
      }

      sendHttpRequest({
        successRes: onFetchProductsSuccess,
        requestConfig: {
          url: `/guest?${queryParams.toString()}`,
          method: 'GET',
        },
      })
    },
    [sendHttpRequest, debouncedSearchTerm, filters.category, filters.featured, filters.inStock, filters.size, filters.priceRange, sortBy, mapApiProductToProduct]
  )

  // Store latest fetchProducts in ref
  useEffect(() => {
    fetchProductsRef.current = fetchProducts
  }, [fetchProducts])

  // Reset loading states when request completes
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false)
      setIsTableLoading(false)
    }
  }, [isLoading])

  // Initialize and fetch on mount
  useEffect(() => {
    setMounted(true)
    
    prevFiltersRef.current = { 
      searchTerm: query, 
      category: '', 
      featured: false,
      inStock: false,
      size: '',
      minPrice: 0,
      maxPrice: 1000,
      sortBy: 'name',
      color: ''
    }
    
    if (!hasFetchedProducts.current) {
      fetchProducts(1, false, {
        category: '',
        featured: false,
        inStock: false,
        searchTerm: query,
        size: '',
        minPrice: 0,
        maxPrice: 1000,
        sortBy: 'name'
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch products when page changes
  useEffect(() => {
    if (mounted && hasFetchedProducts.current) {
      const isPageChange = currentPage !== pagination.page
      if (isPageChange) {
        if (pagination.totalPages > 0) {
          const validPage = Math.min(Math.max(1, currentPage), pagination.totalPages)
          if (validPage !== currentPage) {
            setCurrentPage(validPage)
            return
          }
        }
        fetchProducts(currentPage, true)
      }
    }
  }, [currentPage, mounted, fetchProducts, pagination.page, pagination.totalPages])

  // Fetch products when filters or sort change (reset to page 1)
  useEffect(() => {
    if (!mounted || !hasFetchedProducts.current) return

    const filtersChanged =
      prevFiltersRef.current.searchTerm !== debouncedSearchTerm ||
      prevFiltersRef.current.category !== filters.category ||
      prevFiltersRef.current.featured !== filters.featured ||
      prevFiltersRef.current.inStock !== filters.inStock ||
      prevFiltersRef.current.size !== filters.size ||
      prevFiltersRef.current.minPrice !== filters.priceRange[0] ||
      prevFiltersRef.current.maxPrice !== filters.priceRange[1] ||
      prevFiltersRef.current.sortBy !== sortBy

    if (filtersChanged) {
      prevFiltersRef.current = { 
        searchTerm: debouncedSearchTerm, 
        category: filters.category, 
        featured: filters.featured,
        inStock: filters.inStock,
        size: filters.size,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        sortBy,
        color: filters.color || ''
      }

      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        const fetchFn = fetchProductsRef.current
        if (fetchFn) {
          fetchFn(1, true)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filters.category, filters.featured, filters.inStock, filters.size, filters.priceRange, sortBy, mounted, currentPage])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      saveToHistory(term)
      const params = new URLSearchParams(searchParams.toString())
      params.set('q', term.trim())
      router.push(`/search?${params.toString()}`)
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('q')
      router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`)
    }
    setShowSuggestions(false)
  }

  const handleFilterChange = (newFilters: ProductFilterState) => {
    // ProductFilterState already includes optional color, so we can use it directly
    setFilters(newFilters as SearchFilters)
  }


  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: [0, 1000],
      size: '',
      color: '', // Color is optional in ProductFilterState but we include it for search
      inStock: false,
      featured: false
    } as SearchFilters)
  }

  // Auto-close filter on mobile after filter change (but not on price range which is debounced)
  // We'll handle auto-close in handleFilterChange for immediate filters
  // Price range auto-close is handled separately due to debouncing

  const clearSearch = () => {
    setSearchTerm('')
    setShowSuggestions(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.priceRange[1] < 1000) count++
    if (filters.size) count++
    if (filters.color) count++
    if (filters.inStock) count++
    if (filters.featured) count++
    return count
  }


  // Only show page loading for initial fetch
  if (isInitialLoading || !mounted) {
    return <LoadingSpinner fullScreen text="Loading products..." />
  }

  if (error && isInitialLoading) {
    const handleRetry = () => {
      setIsInitialLoading(true)
      fetchProducts(1, false)
    }

    return (
      <ErrorState
        title="Failed to load products"
        message={error || "We couldn't load the products. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-watermark relative">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b" style={{ position: 'relative', zIndex: 99999, isolation: 'isolate' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ position: 'relative', zIndex: 10000 }}>
          <div className="max-w-2xl mx-auto relative" style={{ position: 'relative', zIndex: 10001 }}>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Search Products
            </h1>
            
            {/* Search Input */}
            <div className="relative" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  setSearchTerm(newValue)
                  setShowSuggestions(true)
                }}
                onFocus={(e) => {
                  e.stopPropagation()
                  setShowSuggestions(true)
                }}
                onBlur={(e) => {
                  e.stopPropagation()
                  // Don't close if clicking inside the suggestions dropdown
                  const relatedTarget = e.relatedTarget as HTMLElement | null
                  if (searchRef.current && relatedTarget) {
                    // Check if the related target is within our search container
                    if (searchRef.current.contains(relatedTarget)) {
                      return
                    }
                  }
                  // Use a timeout to allow click events to fire on suggestion items
                  setTimeout(() => {
                    setShowSuggestions(false)
                  }, 250)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch(searchTerm)
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                    setSearchTerm('')
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation()
                }}
                placeholder="Search for products, categories, or styles..."
                autoComplete="off"
                className="relative block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg text-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center z-20"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-[10000] w-full top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                  >
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                  <div className="p-4 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Searches</h3>
                    <div className="space-y-1">
                      {searchHistory.slice(0, 3).map((term, index) => (
                        <button
                          key={`recent-${index}-${term}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSearch(term)
                          }}
                          className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Popular Searches</h3>
                  <div className="space-y-1">
                    {popularSearches.slice(0, 5).map((term, index) => (
                      <button
                        key={`popular-${index}-${term}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSearch(term)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                        }}
                        className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ position: 'relative', zIndex: 1, isolation: 'isolate' }}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - ProductFilters handles desktop/mobile internally */}
          <div className="lg:w-64 flex-shrink-0">
            <ProductFilters
              onFilterChange={handleFilterChange}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
              initialFilters={filters}
              onFilterApplied={() => setIsFilterOpen(false)}
              categoryOptions={clothingCategories}
              showColorFilter={true}
              availableColors={availableColors}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="mb-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  {searchTerm ? `Results for "${searchTerm}"` : 'All Products'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-shrink-0"
                  aria-label="Open filters"
                >
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden xs:inline">Filters</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="ml-1 sm:ml-1.5 px-1 sm:px-1.5 py-0.5 bg-primary-600 text-white text-[10px] sm:text-xs font-semibold rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 hidden sm:block flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 max-w-[140px] sm:max-w-none"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md flex-shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label="Grid view"
                  >
                    <Grid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    aria-label="List view"
                  >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading state for table */}
            {isTableLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12">
                <LoadingSpinner text="Loading products..." />
              </div>
            ) : (
              <>
                {/* Products Grid/List */}
                {filteredProducts.length > 0 ? (
                  <>
                    <motion.div 
                      className={`grid gap-6 mb-8 ${
                        viewMode === 'grid' 
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr' 
                          : 'grid-cols-1'
                      }`}
                      layout
                      initial={false}
                    >
                      <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product, index) => (
                          <ProductCard
                            key={product._id || `product-${index}`}
                            product={product}
                            viewMode={viewMode}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
                        {/* Mobile pagination */}
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>

                        {/* Desktop pagination */}
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing{' '}
                              <span className="font-medium">
                                {pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1}
                              </span>{' '}
                              to{' '}
                              <span className="font-medium">
                                {Math.min(currentPage * pagination.limit, pagination.total)}
                              </span>{' '}
                              of <span className="font-medium">{pagination.total}</span> results
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!pagination.hasPrevPage}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                              </button>

                              {/* Page numbers */}
                              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                                const showPage =
                                  page === 1 ||
                                  page === pagination.totalPages ||
                                  (page >= currentPage - 1 && page <= currentPage + 1)

                                if (!showPage) {
                                  if (page === currentPage - 2 || page === currentPage + 2) {
                                    return (
                                      <span
                                        key={page}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                      >
                                        ...
                                      </span>
                                    )
                                  }
                                  return null
                                }

                                return (
                                  <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      page === currentPage
                                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                )
                              })}

                              <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!pagination.hasNextPage}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search terms or filters
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SewingMachineLoader size="lg" text="Searching products, please wait..." />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
