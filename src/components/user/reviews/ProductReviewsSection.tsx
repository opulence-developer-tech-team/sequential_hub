'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, User as UserIcon, MessageCircle, LogOut } from 'lucide-react'
import { useHttp } from '@/hooks/useHttp'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { clearUserData } from '@/store/redux/user/user-data-slice'
import { clearWishlist } from '@/store/redux/user/user-wishlist-slice'
import { authActions } from '@/store/redux/auth/auth-slice'

interface ProductReviewsSectionProps {
  productId: string
  productName: string
}

interface Review {
  _id: string
  name: string
  rating: number
  comment: string
  isVerified: boolean
  createdAt: string
}

interface ReviewsResponse {
  reviews: Review[]
  summary: {
    averageRating: number
    totalReviews: number
  }
  page: number
  limit: number
  totalPages: number
}

export default function ProductReviewsSection({
  productId,
  productName,
}: ProductReviewsSectionProps) {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const userData = useAppSelector((state) => state.userData.user)

  // Separate HTTP hooks so fetching reviews doesn't affect submit button state
  const {
    sendHttpRequest: fetchRequest,
    isLoading: isFetchingReviews,
    error: fetchError,
  } = useHttp()
  const {
    sendHttpRequest: submitRequest,
    isLoading: isSubmitting,
    error: submitError,
  } = useHttp()
  const {
    sendHttpRequest: logoutRequest,
    isLoading: isLoggingOut,
  } = useHttp()

  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewsResponse['summary'] | null>(null)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const reviewsTopRef = useState<HTMLDivElement | null>(null)[0]

  const effectiveRating = hoverRating ?? rating

  const fetchReviews = (options?: { scrollAfter?: boolean; pageOverride?: number }) => {
    if (!productId) return
    const targetPage = options?.pageOverride ?? page

    fetchRequest({
      requestConfig: {
        method: 'GET',
        url: `/guest/review?productId=${encodeURIComponent(
          productId
        )}&page=${targetPage}&limit=5`,
      },
      successRes: (res: any) => {
        const data = res?.data?.data as ReviewsResponse | undefined
        if (data) {
          setReviews(
            (data.reviews || []).map((r) => ({
              ...r,
              createdAt:
                typeof r.createdAt === 'string'
                  ? r.createdAt
                  : new Date(r.createdAt).toISOString(),
            }))
          )
          setSummary(data.summary)
          setTotalPages(data.totalPages || 1)
          if (data.page && data.page !== page) {
            setPage(data.page)
          }

          // After a successful paginated fetch, scroll the reviews section into view
          if (options?.scrollAfter) {
            const el = document.getElementById('reviews')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }
        }
      },
    })
  }

  useEffect(() => {
    // Initial load or when product changes – don't scroll
    fetchReviews({ scrollAfter: false, pageOverride: 1 })
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // Prefill and lock identity for signed-in users
  useEffect(() => {
    if (isAuthenticated && userData) {
      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim()
      if (fullName) {
        setName(fullName)
      }
      if (userData.email) {
        setEmail(userData.email)
      }
    }
  }, [isAuthenticated, userData])

  const handleLogoutToReviewAsGuest = () => {
    if (isLoggingOut) return
    logoutRequest({
      requestConfig: {
        method: 'POST',
        url: '/auth/logout',
      },
      successRes: () => {
        dispatch(clearUserData())
        dispatch(clearWishlist())
        dispatch(authActions.setAuthStatus(false))
        // Clear identity fields so user can fill guest info
        setName('')
        setEmail('')
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!comment.trim() || comment.trim().length < 10) {
      setLocalError('Please write at least 10 characters for your review.')
      return
    }

    // Guests must provide name and email
    if (!isAuthenticated && (!name.trim() || !email.trim())) {
      setLocalError('Please enter your name and email to submit a review.')
      return
    }

    // Prevent double submission
    if (isSubmitting) {
      return
    }

    submitRequest({
      requestConfig: {
        method: 'POST',
        url: '/guest/review',
        body: {
          productId,
          rating,
          comment: comment.trim(),
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        },
        contentType: 'application/json',
      },
      successRes: () => {
        setComment('')
        setRating(5)
        setHoverRating(null)
        // Do not clear name/email so guests can review multiple times easily
        fetchReviews()
      },
    })
  }

  return (
    <section id="reviews" className="mt-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Summary & Existing Reviews */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary-600" />
                  Reviews
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  What customers think about{' '}
                  <span className="font-medium text-gray-900">{productName}</span>
                </p>
              </div>
              {summary && (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-semibold text-gray-900">
                      {summary.averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(summary.averageRating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Based on {summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'}
                  </p>
                </div>
              )}
            </div>

            {isFetchingReviews && !reviews.length ? (
              <div className="py-8">
                <LoadingSpinner text="Loading reviews..." />
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-600">
                No reviews yet. Be the first to share your thoughts about this item.
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {reviews.map((review) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
                            <UserIcon className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {review.name || 'Anonymous'}
                                </p>
                                {review.isVerified ? (
                                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 border border-primary-200 flex-shrink-0 whitespace-nowrap">
                                    Verified user
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-primary-50/70 px-2 py-0.5 text-[10px] font-medium text-primary-600 border border-primary-100 flex-shrink-0 whitespace-nowrap">
                                    Guest review
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Pagination controls */}
        {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
              disabled={page <= 1 || isFetchingReviews}
              onClick={() => {
                if (page <= 1) return
                const nextPage = page - 1
                setPage(nextPage)
                fetchReviews({ scrollAfter: true, pageOverride: nextPage })
              }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
              disabled={page >= totalPages || isFetchingReviews}
              onClick={() => {
                if (page >= totalPages) return
                const nextPage = page + 1
                setPage(nextPage)
                fetchReviews({ scrollAfter: true, pageOverride: nextPage })
              }}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Review Form */}
          <div className="w-full lg:w-96">
            <div className="rounded-2xl border border-primary-100 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Share your experience
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Both registered customers and guests can leave a review. Your feedback helps us
                tailor a better fit for everyone.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(starValue)}
                          className="p-0.5"
                          aria-label={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              starValue <= effectiveRating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      )
                    })}
                    <span className="ml-2 text-xs text-gray-500">
                      {effectiveRating} / 5
                    </span>
                  </div>
                </div>

                {/* Name (optional for logged in) */}
                {isAuthenticated ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">You are signed in</p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Your review will be posted under <span className="font-medium text-gray-900">{userData?.email || 'your account'}</span>. 
                          To review as a guest, log out first.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutToReviewAsGuest}
                      disabled={isLoggingOut}
                      className="w-full text-start inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{isLoggingOut ? 'Logging out...' : 'Log out to review as guest'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Tell us about the fit, fabric, and overall experience..."
                  />
                </div>

                {localError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                    {localError}
                  </p>
                )}
                {!localError && (submitError || fetchError) && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                    {submitError || fetchError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting review...</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4" />
                      <span>Submit review</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}








































