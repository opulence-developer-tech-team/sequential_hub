'use client'

import { motion } from 'framer-motion'
import { Package, Ruler, MapPin, Calendar, User, Phone, Mail } from 'lucide-react'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { TrackedOrder } from './types'
import { getStatusColor, getStatusIcon, formatStatus } from './utils'
import StatusTracker from './StatusTracker'
import {
  MEASUREMENT_FIELDS,
  MEASUREMENT_LABELS,
  type MeasurementField,
} from '@/components/admin/products/VariantMeasurementsEditor'

interface OrderDetailsProps {
  trackedOrder: TrackedOrder
}

export default function OrderDetails({ trackedOrder }: OrderDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Order Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {trackedOrder.orderType === 'regular' ? (
              <Package className="h-6 w-6" />
            ) : (
              <Ruler className="h-6 w-6" />
            )}
            <div>
              <h2 className="text-xl font-semibold">
                {trackedOrder.orderType === 'regular' ? 'Product Order' : 'Measurement Order'}
              </h2>
              <p className="text-primary-100 text-sm font-mono">{trackedOrder.order.orderNumber}</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-lg border border-white/20 flex items-center gap-2 bg-white/10 backdrop-blur-sm">
            {getStatusIcon(
              trackedOrder.orderType === 'regular'
                ? trackedOrder.order.orderStatus
                : trackedOrder.order.status
            )}
            <span className="font-medium text-white">
              {formatStatus(
                trackedOrder.orderType === 'regular'
                  ? trackedOrder.order.orderStatus
                  : trackedOrder.order.status
              )}
            </span>
          </div>
        </div>
        {trackedOrder.order.createdAt && (
          <div className="flex items-center gap-2 text-primary-100 text-sm">
            <Calendar className="h-4 w-4" />
            <span>
              Ordered on {new Date(trackedOrder.order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Status Tracker */}
        <StatusTracker
          status={
            trackedOrder.orderType === 'regular'
              ? trackedOrder.order.orderStatus
              : trackedOrder.order.status
          }
          orderType={trackedOrder.orderType}
        />

        {/* Regular Order Details */}
        {trackedOrder.orderType === 'regular' && (
          <>
            {/* Payment Status */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Payment Status
              </h3>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(trackedOrder.order.paymentStatus)}`}>
                {getStatusIcon(trackedOrder.order.paymentStatus)}
                <span className="font-medium">{formatStatus(trackedOrder.order.paymentStatus)}</span>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Order Items
              </h3>
              <div className="space-y-4">
                {trackedOrder.order.items.map((item, index) => {
                  const hasMeasurements =
                    item.measurements &&
                    MEASUREMENT_FIELDS.some(
                      (field) =>
                        typeof item.measurements?.[field as MeasurementField] === 'number' &&
                        !Number.isNaN(item.measurements?.[field as MeasurementField])
                    )

                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          <Image
                            src={Array.isArray(item.variantImageUrls) && item.variantImageUrls.length > 0
                              ? item.variantImageUrls[0]
                              : (((item as any).variantImageUrl as string | undefined) || '/file.svg')} // Backward compatibility
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 64px, 80px"
                          />
                        </div>
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base mb-1.5 break-words">{item.productName}</p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <span>Size: <span className="font-medium">{item.variantSize}</span></span>
                            {item.variantColor && (
                              <span className="inline-flex items-center gap-1">
                                <span>Color:</span>
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-200"
                                  style={{ backgroundColor: item.variantColor }}
                                  aria-label={`Color: ${item.variantColor}`}
                                  title={item.variantColor}
                                />
                              </span>
                            )}
                            <span className="hidden sm:inline">|</span>
                            <span>Qty: <span className="font-medium">{item.quantity}</span></span>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base self-start sm:self-auto">{formatPrice(item.itemTotal)}</p>
                      </div>

                      {hasMeasurements && (
                        <div className="mt-1 rounded-xl bg-white border border-primary-100 px-3 py-2.5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center border border-primary-200">
                                <Ruler className="h-3.5 w-3.5 text-primary-600" />
                              </div>
                              <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                                Tailor Measurements <span className="text-[11px]">(inches)</span>
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {MEASUREMENT_FIELDS.map((field) => {
                              const value = item.measurements?.[field as MeasurementField]
                              if (typeof value !== 'number' || Number.isNaN(value)) return null
                              return (
                                <div
                                  key={field}
                                  className="bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-200"
                                >
                                  <p className="text-[11px] text-gray-600">
                                    {MEASUREMENT_LABELS[field]}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {value}
                                    <span className="ml-1 text-[10px] text-gray-500">in</span>
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(trackedOrder.order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">
                  {trackedOrder.order.shipping === 0 ? 'Free' : formatPrice(trackedOrder.order.shipping)}
                </span>
              </div>
              {trackedOrder.order.shippingLocation && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Location</span>
                  <span className="font-medium text-gray-900">{trackedOrder.order.shippingLocation}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">{formatPrice(trackedOrder.order.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatPrice(trackedOrder.order.total)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">
                  {trackedOrder.order.shippingAddress.firstName} {trackedOrder.order.shippingAddress.lastName}
                </p>
                <p className="text-gray-600">{trackedOrder.order.shippingAddress.address}</p>
                <p className="text-gray-600">
                  {trackedOrder.order.shippingAddress.city}, {trackedOrder.order.shippingAddress.state} {trackedOrder.order.shippingAddress.zipCode}
                </p>
                <p className="text-gray-600">{trackedOrder.order.shippingAddress.country}</p>
              </div>
            </div>
          </>
        )}

        {/* Measurement Order Details */}
        {trackedOrder.orderType === 'measurement' && (
          <>
            {/* Expired notice for measurement orders that were superseded */}
            {((trackedOrder.order as any).isReplaced || (trackedOrder.order as any).replacedByOrderId) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This measurement order has expired because the price was updated and a new receipt was issued. Please use the most recent order details you received by email.
              </div>
            )}
            {/* Payment Status */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Payment Status
              </h3>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(trackedOrder.order.paymentStatus)}`}>
                {getStatusIcon(trackedOrder.order.paymentStatus)}
                <span className="font-medium">{formatStatus(trackedOrder.order.paymentStatus)}</span>
                {trackedOrder.order.paidAt && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Paid on {new Date(trackedOrder.order.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})
                  </span>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{trackedOrder.order.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{trackedOrder.order.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{trackedOrder.order.phone}</span>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="text-gray-900">
                    <p>{trackedOrder.order.address}</p>
                    <p>
                      {trackedOrder.order.city}, {trackedOrder.order.state} {trackedOrder.order.zipCode}
                    </p>
                    <p>{trackedOrder.order.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Measurement Templates */}
            {trackedOrder.order.templates && trackedOrder.order.templates.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Measurement Templates ({trackedOrder.order.templates.length})
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  {trackedOrder.order.templates.map((template, templateIndex) => (
                    <div key={templateIndex} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{template.templateTitle}</p>
                        <span className="text-xs sm:text-sm text-gray-600 bg-white px-2.5 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                          Qty: {template.quantity}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        {template.measurements.map((measurement, index) => (
                          <div key={index} className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide truncate">{measurement.fieldName}</p>
                            <p className="text-base sm:text-lg font-semibold text-gray-900">{measurement.value} cm</p>
                          </div>
                        ))}
                      </div>
                      {/* Sample Images for this template */}
                      {template.sampleImageUrls && template.sampleImageUrls.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-300">
                          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-2">Sample Images</p>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {template.sampleImageUrls.map((imageUrl, imgIndex) => (
                              <div key={imgIndex} className="relative w-full h-24 sm:h-32 rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={imageUrl}
                                  alt={`Sample ${imgIndex + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50vw, 50vw"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price if set */}
            {trackedOrder.order.price && trackedOrder.order.price > 0 && (
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Price</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatPrice(trackedOrder.order.price)}
                  </span>
                </div>
                {trackedOrder.order.shippingLocation && (
                  <div className="flex justify-between text-sm pt-2 border-t border-primary-200">
                    <span className="text-gray-600">Shipping Location</span>
                    <span className="font-medium text-gray-900">{trackedOrder.order.shippingLocation}</span>
                  </div>
                )}
                {trackedOrder.order.deliveryFee !== undefined && trackedOrder.order.deliveryFee !== null && (
                  <div className="flex justify-between text-sm pt-2 border-t border-primary-200">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium text-gray-900">{formatPrice(trackedOrder.order.deliveryFee)}</span>
                  </div>
                )}
                {trackedOrder.order.tax !== undefined && trackedOrder.order.tax !== null && (
                  <div className="flex justify-between text-sm pt-2 border-t border-primary-200">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{formatPrice(trackedOrder.order.tax)}</span>
                  </div>
                )}
                {(trackedOrder.order.deliveryFee !== undefined && trackedOrder.order.deliveryFee !== null) || 
                 (trackedOrder.order.tax !== undefined && trackedOrder.order.tax !== null) ? (
                  <div className="flex justify-between items-center pt-2 border-t-2 border-primary-300 mt-2">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(
                        trackedOrder.order.price + 
                        (trackedOrder.order.deliveryFee || 0) + 
                        (trackedOrder.order.tax || 0)
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Additional Information */}
            {(trackedOrder.order.notes || trackedOrder.order.preferredStyle) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Additional Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {trackedOrder.order.notes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{trackedOrder.order.notes}</p>
                    </div>
                  )}
                  {trackedOrder.order.preferredStyle && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preferred Style</p>
                      <p className="text-gray-900">{trackedOrder.order.preferredStyle}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}













































