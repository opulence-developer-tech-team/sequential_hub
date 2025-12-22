import { getShippingSettings } from '@/lib/get-shipping-settings'
import ShippingSettingsInitializer from '@/components/ShippingSettingsInitializer'

export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch shipping settings on the server
  const shippingSettings = await getShippingSettings()

  return (
    <>
      <ShippingSettingsInitializer 
        freeShippingThreshold={shippingSettings.freeShippingThreshold}
        locationFees={shippingSettings.locationFees}
      />
      {children}
    </>
  )
}





















































