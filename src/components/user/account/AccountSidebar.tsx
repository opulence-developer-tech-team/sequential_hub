'use client'

import { User, Mail, Phone, MapPin, CreditCard, Package, Heart, Settings, LogOut } from 'lucide-react'

interface AccountSidebarProps {
  userName: string
  userEmail: string
  activeTab: string
  onTabChange: (tab: string) => void
  onSignOut: () => void
}

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function AccountSidebar({
  userName,
  userEmail,
  activeTab,
  onTabChange,
  onSignOut,
}: AccountSidebarProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-primary-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
          <p className="text-gray-600">{userEmail}</p>
        </div>
      </div>

      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <button 
        onClick={onSignOut}
        className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors mt-6"
      >
        <LogOut className="h-5 w-5 mr-3" />
        Sign Out
      </button>
    </div>
  )
}




















































