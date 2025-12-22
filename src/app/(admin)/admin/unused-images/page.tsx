'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHttp } from '@/hooks/useHttp'
import { RootState } from '@/store/redux'
import { adminActions } from '@/store/redux/adminSlice'
import { toast } from 'sonner'
import { Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function UnusedImagesPage() {
  const [mounted, setMounted] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const isFirstMountRef = useRef(true)

  const dispatch = useDispatch()
  const {
    isLoading,
    error,
    sendHttpRequest: fetchImagesReq,
  } = useHttp()

  const {
    isLoading: isDeleting,
    sendHttpRequest: deleteImageReq,
  } = useHttp()

  // Redux state
  const unusedImagesState = useSelector((state: RootState) => state.admin.unusedImages)
  const { hasFetchedImages, images, pagination } = unusedImagesState

  // Fetch unused images
  const fetchUnusedImages = useCallback(
    (page: number = 1, showTableLoading: boolean = false) => {
      const validPage = Math.max(1, Math.floor(page))

      if (showTableLoading || !isFirstMountRef.current) {
        setIsTableLoading(true)
      } else if (isFirstMountRef.current && !hasFetchedImages) {
        setIsInitialLoading(true)
      }

      fetchImagesReq({
        requestConfig: {
          url: `/admin/unused-images?page=${validPage}&limit=20`,
          method: 'GET',
        },
        successRes: (response: any) => {
          try {
            const responseData = response?.data?.data
            const images = Array.isArray(responseData?.images) ? responseData.images : []
            const paginationData = responseData?.pagination

            if (paginationData && typeof paginationData === 'object') {
              dispatch(
                adminActions.setUnusedImages({
                  images,
                  pagination: {
                    page: paginationData.page || validPage,
                    limit: paginationData.limit || 20,
                    total: paginationData.total || 0,
                    totalPages: paginationData.totalPages || 0,
                    hasNextPage: paginationData.hasNextPage || false,
                    hasPrevPage: paginationData.hasPrevPage || false,
                  },
                })
              )
            } else {
              dispatch(
                adminActions.setUnusedImages({
                  images,
                  pagination: {
                    page: validPage,
                    limit: 20,
                    total: images.length,
                    totalPages: Math.ceil(images.length / 20),
                    hasNextPage: false,
                    hasPrevPage: false,
                  },
                })
              )
            }
          } catch (error) {
            console.error('Error processing fetch unused images response:', error)
            dispatch(
              adminActions.setUnusedImages({
                images: [],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 0,
                  totalPages: 0,
                  hasNextPage: false,
                  hasPrevPage: false,
                },
              })
            )
          } finally {
            if (isFirstMountRef.current) {
              isFirstMountRef.current = false
            }
          }
        },
      })
    },
    [dispatch, fetchImagesReq, hasFetchedImages]
  )

  // Reset loading states when request completes
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false)
      setIsTableLoading(false)
    }
  }, [isLoading])

  // Initial fetch on mount
  useEffect(() => {
    setMounted(true)
    if (!hasFetchedImages) {
      fetchUnusedImages(1, false)
    } else {
      setCurrentPage(pagination.page)
    }
  }, [fetchUnusedImages, hasFetchedImages, pagination.page])

  // Fetch images when page changes
  useEffect(() => {
    if (mounted && hasFetchedImages) {
      const isPageChange = currentPage !== pagination.page
      if (isPageChange && pagination.totalPages > 0) {
        const validPage = Math.min(Math.max(1, currentPage), pagination.totalPages)
        if (validPage !== currentPage) {
          setCurrentPage(validPage)
          return
        }
        fetchUnusedImages(currentPage, true)
      }
    }
  }, [currentPage, mounted, hasFetchedImages, fetchUnusedImages, pagination.page, pagination.totalPages])

  // Handle delete
  const handleDelete = useCallback(
    (imageUrl: string) => {
      setDeletingImageUrl(imageUrl)
      setShowDeleteConfirm(null)

      deleteImageReq({
        requestConfig: {
          url: '/admin/delete-unused-image',
          method: 'DELETE',
          body: { imageUrl },
        },
        successRes: () => {
          dispatch(adminActions.removeUnusedImage(imageUrl))
          toast.success('Image deleted successfully from Cloudinary and database')
          setDeletingImageUrl(null)

          // If current page becomes empty and not first page, go to previous page
          if (images.length === 1 && pagination.page > 1) {
            setCurrentPage(pagination.page - 1)
          }
        },
        errorRes: (errorResponse: any) => {
          const errorMessage =
            errorResponse?.data?.description ||
            errorResponse?.message ||
            'Failed to delete image. Please try again.'
          toast.error(errorMessage)
          setDeletingImageUrl(null)
          return false
        },
      })
    },
    [dispatch, deleteImageReq, images.length, pagination.page]
  )

  // Reset deleting state when request completes
  useEffect(() => {
    if (!isDeleting && deletingImageUrl) {
      setDeletingImageUrl(null)
    }
  }, [isDeleting, deletingImageUrl])

  // Show loading state
  if (isInitialLoading || !mounted) {
    return <LoadingSpinner fullScreen text="Loading unused images..." />
  }

  if (error && isInitialLoading) {
    const handleRetry = () => {
      if (hasFetchedImages) return
      setIsInitialLoading(true)
      fetchUnusedImages(1)
    }

    return (
      <ErrorState
        title="Failed to load unused images"
        message={error || "We couldn't load unused images. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Unused Images</h1>
          <p className="text-gray-600 mt-2">
            Manage images that are not currently used in products, orders, or measurement orders.
            These can be safely deleted to free up Cloudinary storage.
          </p>
        </div>

        {/* Stats */}
        {hasFetchedImages && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Unused Images</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        )}

        {/* Images Grid */}
        {isTableLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
            <LoadingSpinner text="Loading images..." />
          </div>
        ) : images.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {images.map((image) => (
                <motion.div
                  key={image._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image Preview */}
                  <div className="relative w-full aspect-square bg-gray-100">
                    <Image
                      src={image.imageUrl}
                      alt={image.fileName || 'Unused image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {deletingImageUrl === image.imageUrl && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <LoadingSpinner text="Deleting..." />
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">File Name</p>
                      <p className="text-sm text-gray-900 truncate" title={image.fileName}>
                        {image.fileName || 'Unknown'}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-gray-600 mb-3">
                      {image.fileSize && (
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">{formatFileSize(image.fileSize)}</span>
                        </div>
                      )}
                      {image.mimeType && (
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium">{image.mimeType}</span>
                        </div>
                      )}
                      {image.createdAt && (
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span className="font-medium">
                            {formatDate(new Date(image.createdAt))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeleteConfirm(image.imageUrl)}
                      disabled={deletingImageUrl === image.imageUrl || isDeleting}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingImageUrl === image.imageUrl ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-4 sm:px-6 py-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span> to{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> of{' '}
                  <span className="font-semibold text-gray-900">{pagination.total}</span> images
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`px-4 py-2 border rounded-lg font-medium text-sm transition-all duration-200 ${
                      pagination.hasPrevPage
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4 inline mr-1" />
                    Previous
                  </button>
                  <div className="px-4 py-2 text-sm text-gray-700">
                    Page <span className="font-semibold">{pagination.page}</span> of{' '}
                    <span className="font-semibold">{pagination.totalPages}</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`px-4 py-2 border rounded-lg font-medium text-sm transition-all duration-200 ${
                      pagination.hasNextPage
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No unused images found</h3>
            <p className="text-gray-600">
              All uploaded images are currently in use or have already been cleaned up.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete this image? This action will:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 mb-4">
                  <li>Permanently delete the image from Cloudinary</li>
                  <li>Remove the image metadata from the database</li>
                  <li>This action cannot be undone</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> The system has verified this image is not in use. However,
                    if the image was recently added to a product or order, please refresh the list first.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDelete(showDeleteConfirm)
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Image'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}




























