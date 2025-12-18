'use client'

export default function SettingsTab() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-gray-700">Email notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-gray-700">SMS notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <span className="text-gray-700">Marketing emails</span>
            </label>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span className="text-gray-700">Make profile public</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <span className="text-gray-700">Allow data sharing</span>
            </label>
          </div>
        </div>
        <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700">
          Save Settings
        </button>
      </div>
    </div>
  )
}

















































