'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Users, Search, Filter, Phone, MapPin, Calendar, Eye } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useHttp } from '@/hooks/useHttp'
import { RootState } from '@/store/redux'
import { adminUsersActions } from '@/store/redux/adminSlice/users-slice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import { toast } from 'sonner'

interface FetchUsersResponse {
  users: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

function formatDate(date?: string | Date | null) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'CU'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function getAvatarColor(seed: string) {
  const colors = ['bg-primary-100 text-primary-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700']
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % colors.length
  return colors[idx]
}

export default function AdminCustomersPage() {
  const dispatch = useDispatch()
  const { sendHttpRequest, isLoading, error } = useHttp()

  const adminUsersState = useSelector((state: RootState) => state.admin.users)
  const { users, pagination, hasFetchedUsers } = adminUsersState

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const mountedRef = useRef(false)
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null)

  const buildQueryParams = (page: number) => {
    const params = new URLSearchParams({ page: page.toString(), limit: '10' })
    if (searchTerm.trim()) params.append('searchTerm', searchTerm.trim())
    if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus)
    return params.toString()
  }

  const fetchUsers = useCallback(
    (page: number = 1, showTableLoading: boolean = false) => {
      const validPage = Math.max(1, Math.floor(page))

      if (showTableLoading) {
        setIsTableLoading(true)
      } else if (!hasFetchedUsers) {
        setIsInitialLoading(true)
      }

      const onSuccess = (res: any) => {
        try {
          const responseData: FetchUsersResponse | undefined = res?.data?.data
          if (!responseData) throw new Error('Invalid response')

          dispatch(
            adminUsersActions.setUsers({
              users: responseData.users || [],
              pagination: responseData.pagination,
            })
          )
        } catch (err) {
          console.error('Error processing fetch users response:', err)
          toast.error('Failed to process users response')
          dispatch(
            adminUsersActions.setUsers({
              users: [],
              pagination: {
                page: validPage,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
              },
            })
          )
        } finally {
          setIsTableLoading(false)
          setIsInitialLoading(false)
        }
      }

      const queryString = buildQueryParams(validPage)

      sendHttpRequest({
        successRes: onSuccess,
        requestConfig: {
          url: `/admin/fetch-users?${queryString}`,
          method: 'GET',
        },
      })
    },
    [dispatch, filterStatus, hasFetchedUsers, searchTerm, sendHttpRequest]
  )

  useEffect(() => {
    mountedRef.current = true
    if (!hasFetchedUsers) {
      fetchUsers(1, false)
    }
  }, [fetchUsers, hasFetchedUsers])

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false)
      setIsTableLoading(false)
    }
  }, [isLoading])

  const prevFiltersRef = useRef({ searchTerm, filterStatus })

  useEffect(() => {
    if (!mountedRef.current || !hasFetchedUsers) return

    const filtersChanged =
      prevFiltersRef.current.searchTerm !== searchTerm ||
      prevFiltersRef.current.filterStatus !== filterStatus

    if (filtersChanged) {
      prevFiltersRef.current = { searchTerm, filterStatus }
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        fetchUsers(1, true)
      }
    }
  }, [searchTerm, filterStatus, currentPage, fetchUsers, hasFetchedUsers])

  useEffect(() => {
    if (!mountedRef.current || !hasFetchedUsers) return
    if (currentPage !== pagination.page) {
      const validPage = Math.max(1, Math.min(currentPage, pagination.totalPages || 1))
      if (validPage !== currentPage) {
        setCurrentPage(validPage)
        return
      }
      fetchUsers(validPage, true)
    }
  }, [currentPage, pagination.page, pagination.totalPages, fetchUsers, hasFetchedUsers])

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    setSelectedCustomers(
      selectedCustomers.length === users.length ? [] : users.map((customer) => customer._id)
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const totalCustomers = pagination.total || users.length
  const activeCustomers = users.filter((u) => u.status === 'active').length
  const pendingCustomers = users.filter((u) => u.status === 'pending').length

  if (isInitialLoading) {
    return <LoadingSpinner fullScreen text="Loading customers..." />
  }

  if (error && !hasFetchedUsers) {
    const handleRetry = () => {
      setIsInitialLoading(true)
      fetchUsers(1)
    }

    return (
      <ErrorState
        title="Failed to load customers"
        message={error || "We couldn't load customers. Please try again."}
        onRetry={handleRetry}
        retryLabel="Retry"
        fullScreen
      />
    )
  }

  const displayCustomers = users.map((u) => {
    const locationParts = [u.city, u.state].filter(Boolean)
    const location = locationParts.length ? locationParts.join(', ') : '—'
    const fullName = `${u.firstName} ${u.lastName}`.trim()
    const initials = getInitials(fullName || u.email)
    const avatarColor = getAvatarColor(u.email || u._id)
    return {
      id: u._id,
      name: fullName || u.email,
      email: u.email,
      phone: u.phoneNumber || '—',
      location,
      joinDate: formatDate(u.createdAt),
      status: u.status,
      totalOrders: u.totalOrders ?? 0,
      totalSpent: u.totalSpent ?? 0,
      lastOrder: u.lastOrder ? formatDate(u.lastOrder) : null,
      initials,
      avatarColor,
    }
  })

  const viewUser = useMemo(
    () => (viewCustomerId ? users.find((u) => u._id === viewCustomerId) || null : null),
    [users, viewCustomerId]
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto min-w-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-primary-600" />
              Customer Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your customers and their information</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
              <div className="p-3 bg-primary-50 rounded-full">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-50 rounded-full">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Verification</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">VIP (Spent &gt; 2000)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => (u.totalSpent ?? 0) > 2000).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full lg:max-w-3xl">
            {/* Search */}
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Status */}
            <div className="w-full">
              <label htmlFor="status-filter-select" className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="status-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Count */}
          <div className="flex items-center justify-between sm:justify-end text-sm text-gray-600">
            <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 border border-gray-200">
              <span className="font-semibold text-gray-900">{users.length}</span>
              <span className="text-gray-500">of</span>
              <span className="font-semibold text-gray-900">{pagination.total || users.length}</span>
              <span className="text-gray-500">customers</span>
            </span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-w-full" style={{ maxWidth: '100vw' }}>
          <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left w-8">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label="Select all customers"
                    />
                    <span className="sr-only">Select all customers</span>
                  </label>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Customer
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/5">
                  Contact
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-1/6">
                  Location
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Joined
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        aria-label={`Select customer ${customer.name}`}
                      />
                      <span className="sr-only">Select {customer.name}</span>
                    </label>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center min-w-0">
                      <div
                        className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-sm font-semibold ${customer.avatarColor} shadow-sm flex-shrink-0`}
                        aria-label={`Avatar for ${customer.name}`}
                      >
                        {customer.initials}
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{customer.name}</div>
                        <div className="text-xs text-gray-500">ID: {customer.id}</div>
                        <div className="text-sm text-gray-500 sm:hidden truncate">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm text-gray-900 truncate">{customer.email}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900 flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{customer.location}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(customer.status)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                      <span>{customer.joinDate}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setViewCustomerId(customer.id)}
                      className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary-200 text-primary-700 text-xs font-medium bg-primary-50 hover:bg-primary-100 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {displayCustomers.length === 0 && !isTableLoading && (
                <tr>
                  <td colSpan={9} className="px-3 sm:px-6 py-6 text-center text-sm text-gray-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span>
              {' '}to{' '}
              <span className="font-medium">{(pagination.page - 1) * pagination.limit + users.length}</span>
              {' '}of <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                {currentPage}
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* View Customer Modal */}
      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 lg:px-8"
          aria-modal="true"
          role="dialog"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewCustomerId(null)} />
          <div className="relative z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold ${getAvatarColor(
                    viewUser.email || viewUser._id
                  )} shadow-sm`}
                >
                  {getInitials(`${viewUser.firstName} ${viewUser.lastName}`.trim() || viewUser.email)}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Customer Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{viewUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewCustomerId(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</p>
                  <p className="text-sm text-gray-900">
                    {`${viewUser.firstName} ${viewUser.lastName}`.trim() || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                  <div className="mt-0.5">
                    {getStatusBadge(viewUser.isEmailVerified ? 'active' : 'pending')}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-gray-900">{viewUser.phoneNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</p>
                  <p className="text-sm text-gray-900">{formatDate(viewUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">City</p>
                  <p className="text-sm text-gray-900">{viewUser.city || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">State</p>
                  <p className="text-sm text-gray-900">{viewUser.state || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</p>
                  <p className="text-sm text-gray-900">{viewUser.country || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ZIP Code</p>
                  <p className="text-sm text-gray-900">{viewUser.zipCode || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</p>
                <p className="text-sm text-gray-900 mt-0.5">{viewUser.street || '—'}</p>
              </div>
            </div>
            <div className="px-6 py-3.5 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewCustomerId(null)}
                className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
