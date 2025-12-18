import { ReactNode } from 'react'
import { getShippingSettings } from '@/lib/get-shipping-settings'
import ShippingSettingsInitializer from '@/components/ShippingSettingsInitializer'
import UserLayoutClient from './UserLayoutClient'

interface UserLayoutProps {
  children: ReactNode
}

export default async function UserLayout({ children }: UserLayoutProps) {
  // Fetch shipping settings on the server for user routes
  const shippingSettings = await getShippingSettings()

  return (
    <>
      <ShippingSettingsInitializer 
        freeShippingThreshold={shippingSettings.freeShippingThreshold}
        locationFees={shippingSettings.locationFees}
      />
      <UserLayoutClient>
        {children}
      </UserLayoutClient>
    </>
  )
}



























