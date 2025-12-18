'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductCard from '@/components/ProductCard'
import ProductFilters, { FilterState } from '@/components/ProductFilters'
import { Product } from '@/types'
import { ProductSize } from '@/types/enum'
import { Grid, List, SortAsc, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const { isLoading, sendHttpRequest, error } = useHttp()
  
  // Initialize state from URL params immediately to prevent double fetching
  // Read URL params at component initialization to set correct initial state
  const initialCategory = searchParams.get('category') || ''
  const initialFeatured = searchParams.get('featured') === 'true'
  const initialSearch = searchParams.get('search') || ''
  
  const [products, setProducts] = useState<Product[]>([])
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
  
  // Initialize filters with URL params to prevent false change detection
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    priceRange: [0, 1000],
    size: '',
    inStock: false,
    featured: initialFeatured
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch)
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm])

  // Track previous filter values to detect changes (use debouncedSearchTerm for API calls)
  // Initialize with URL params to prevent false change detection on mount
  const prevFiltersRef = useRef({ 
    searchTerm: initialSearch, 
    category: initialCategory, 
    featured: initialFeatured,
    inStock: false,
    size: '',
    minPrice: 0,
    maxPrice: 1000,
    sortBy: 'name'
  })
  const hasFetchedProducts = useRef(false)
  const fetchProductsRef = useRef<typeof fetchProducts | null>(null)

  // Map API response to Product type
  // Map to match the Product interface structure with productVariant array
  const mapApiProductToProduct = useCallback((apiProduct: any): Product => {
    const variants = Array.isArray(apiProduct.productVariant) ? apiProduct.productVariant : []
    
    // Map variants to IProductVariant format, ensuring _id is included
    // Use null for invalid numeric values to indicate data issues
    const productVariants = variants.map((v: any, index: number) => ({
      _id: v._id?.toString() || `variant-${index}`, // Ensure _id is a string
      // Prefer new multi-image field; fall back to legacy single imageUrl
      imageUrls: Array.isArray(v.imageUrls) && v.imageUrls.length > 0
        ? v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        : (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.trim().length > 0 ? [v.imageUrl] : []),
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
      size: (v.size || '') as ProductSize, // Cast to ProductSize enum
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

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(
    (page: number = 1, showTableLoading: boolean = false, overrideFilters?: { category?: string; featured?: boolean; inStock?: boolean; searchTerm?: string; size?: string; minPrice?: number; maxPrice?: number; sortBy?: string }) => {
      // Validate page number
      const validPage = Math.max(1, Math.floor(page))
      
      // Use isTableLoading for filter/search/pagination changes, isInitialLoading for first load
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

          // Map API products to Product type
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

      // Use override filters if provided, otherwise use state filters
      // Use debouncedSearchTerm for API calls to avoid excessive requests
      const activeCategory = overrideFilters?.category ?? filters.category
      const activeFeatured = overrideFilters?.featured ?? filters.featured
      const activeInStock = overrideFilters?.inStock ?? filters.inStock
      const activeSearchTerm = overrideFilters?.searchTerm ?? debouncedSearchTerm
      const activeSize = overrideFilters?.size ?? filters.size
      const activeMinPrice = overrideFilters?.minPrice ?? filters.priceRange[0]
      const activeMaxPrice = overrideFilters?.maxPrice ?? filters.priceRange[1]
      const activeSortBy = overrideFilters?.sortBy ?? sortBy

      // Build query string with filters
      const queryParams = new URLSearchParams({
        page: validPage.toString(),
        limit: '10',
        sortBy: activeSortBy,
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

      // Only send price filters if they differ from defaults (0 and 1000)
      // This avoids unnecessary filtering when using default values
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

  // Store latest fetchProducts in ref for use in effects
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

  // Initialize and fetch on mount - state is already initialized with URL params
  useEffect(() => {
    setMounted(true)
    
    // State is already initialized with URL params, so no need to set it again
    // Ensure ref matches the initial state to prevent false change detection
    // This must be done BEFORE fetching to prevent the filter change effect from triggering
    prevFiltersRef.current = { 
      searchTerm: initialSearch, 
      category: initialCategory, 
      featured: initialFeatured,
      inStock: false,
      size: '',
      minPrice: 0,
      maxPrice: 1000,
      sortBy: 'name'
    }
    
    // Only fetch on mount if we haven't fetched yet
    if (!hasFetchedProducts.current) {
      // Use the initial values from URL params (already in state)
      // Use fetchProducts directly here since it's the initial mount
      fetchProducts(1, false, {
        category: initialCategory,
        featured: initialFeatured,
        inStock: false,
        searchTerm: initialSearch,
        size: '',
        minPrice: 0,
        maxPrice: 1000,
        sortBy: 'name'
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - fetchProducts will be available via closure

  // Fetch products when page changes
  useEffect(() => {
    if (mounted && hasFetchedProducts.current) {
      const isPageChange = currentPage !== pagination.page
      if (isPageChange) {
        // Validate page is within bounds if we have pagination data
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
  // Use debouncedSearchTerm for API calls
  // Only runs after initial mount and first fetch to prevent double fetching
  useEffect(() => {
    // Skip if not mounted or if initial fetch hasn't completed yet
    if (!mounted || !hasFetchedProducts.current) return

    // Compare current filters with previous filters
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
      // Update ref BEFORE fetching to prevent duplicate triggers
      prevFiltersRef.current = { 
        searchTerm: debouncedSearchTerm, 
        category: filters.category, 
        featured: filters.featured,
        inStock: filters.inStock,
        size: filters.size,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        sortBy
      }

      // Reset to page 1 when filters or sort change
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        // If already on page 1, fetch immediately with table loading state
        // Use ref to avoid dependency on fetchProducts function (prevents unnecessary re-runs)
        const fetchFn = fetchProductsRef.current
        if (fetchFn) {
          fetchFn(1, true)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filters.category, filters.featured, filters.inStock, filters.size, filters.priceRange, sortBy, mounted, currentPage])

  // Products are already sorted by the API, no client-side sorting needed
  const filteredProducts = products

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {filters.featured ? 'Featured Products' : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {filters.featured 
              ? 'Discover our handpicked selection of premium clothing and accessories, carefully curated for the modern individual.'
              : 'Discover our complete collection of premium clothing and accessories'
            }
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop only */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <ProductFilters
              onFilterChange={handleFilterChange}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
              initialFilters={filters}
              onFilterApplied={() => setIsFilterOpen(false)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              {/* Mobile Filter Button + Search */}
              <div className="w-full sm:w-auto flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {(() => {
                    const activeCount = (filters.category ? 1 : 0) + 
                                      (filters.priceRange[1] < 1000 ? 1 : 0) + 
                                      (filters.size ? 1 : 0) + 
                                      (filters.inStock ? 1 : 0) + 
                                      (filters.featured ? 1 : 0)
                    return activeCount > 0 ? (
                      <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                        {activeCount}
                      </span>
                    ) : null
                  })()}
                </button>
                
                {/* Search */}
                <div className="flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
                  {pagination.total} products found
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                  <SortAsc className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 max-w-[140px] sm:max-w-none"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
               
                  </select>
                </div>

                {/* View mode toggle */}
                <div className="flex border border-gray-300 rounded-md flex-shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    aria-label="Grid view"
                  >
                    <Grid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
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
                            key={product._id} 
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
                                // Show first page, last page, current page, and pages around current
                                const showPage =
                                  page === 1 ||
                                  page === pagination.totalPages ||
                                  (page >= currentPage - 1 && page <= currentPage + 1)

                                if (!showPage) {
                                  // Show ellipsis
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
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">Try adjusting your filters to see more results.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Filter Panel */}
        <ProductFilters
          onFilterChange={handleFilterChange}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
          initialFilters={filters}
          onFilterApplied={() => setIsFilterOpen(false)}
        />
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen text="Loading products..." />}>
      <ProductsPageContent />
    </Suspense>
  )
}
