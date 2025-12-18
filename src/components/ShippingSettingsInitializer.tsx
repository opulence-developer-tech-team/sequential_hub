'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { shippingSettingsActions } from '@/store/redux/guest/shipping-settings-slice'

interface ShippingSettingsInitializerProps {
  freeShippingThreshold: number
  locationFees: Array<{ location: string; fee: number }>
}

export default function ShippingSettingsInitializer({
  freeShippingThreshold,
  locationFees,
}: ShippingSettingsInitializerProps) {
  const dispatch = useAppDispatch()
  const hasFetched = useAppSelector((state) => state.shippingSettings.hasFetched)

  useEffect(() => {
    // Only set if not already fetched (prevents overwriting on re-renders)
    if (!hasFetched) {
      dispatch(
        shippingSettingsActions.setShippingSettings({
          freeShippingThreshold,
          locationFees,
        })
      )
    }
  }, [dispatch, freeShippingThreshold, locationFees, hasFetched])

  return null
}






















