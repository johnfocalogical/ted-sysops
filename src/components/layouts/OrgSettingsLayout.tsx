import { Outlet } from 'react-router-dom'
import { OrgSettingsSidebar } from './OrgSettingsSidebar'
import { OrgSettingsHeader } from './OrgSettingsHeader'

export function OrgSettingsLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <OrgSettingsSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <OrgSettingsHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
