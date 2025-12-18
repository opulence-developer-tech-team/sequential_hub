'use client'

import { Search } from 'lucide-react'
import { clothingCategories } from '@/lib/resources'

interface ProductFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  showFeaturedOnly: boolean
  onFeaturedChange: (checked: boolean) => void
  resultsCount: number
}

export default function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showFeaturedOnly,
  onFeaturedChange,
  resultsCount,
}: ProductFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input - Takes most space */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>
          
          {/* Right side filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 text-sm"
              >
                <option value="">All Categories</option>
                {clothingCategories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            
            {/* Featured Filter */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => onFeaturedChange(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">Featured</span>
              </label>
            </div>
            
            {/* Results Count */}
            <div className="text-sm text-gray-500 sm:border-l sm:border-gray-200 sm:pl-4">
              <span className="font-semibold text-gray-900">{resultsCount}</span>
              <span className="ml-1">{resultsCount === 1 ? 'result' : 'results'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}














































