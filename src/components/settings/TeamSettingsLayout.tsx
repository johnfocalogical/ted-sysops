import { Outlet } from 'react-router-dom'
import { TeamSettingsSidebar } from './TeamSettingsSidebar'
import { ImpersonationBanner } from '@/components/shared/ImpersonationBanner'

export function TeamSettingsLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <TeamSettingsSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Impersonation Banner (shown when admin is viewing team) */}
        <ImpersonationBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
