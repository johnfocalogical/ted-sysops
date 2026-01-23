import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { UserMenu } from './UserMenu'
import { useOrgContext } from '@/hooks/useOrgContext'
import { useTeamContext } from '@/hooks/useTeamContext'

// Org settings pages mapping
const ORG_SETTINGS_PAGES: Record<string, string> = {
  general: 'General Settings',
  teams: 'Teams',
  members: 'Members',
}

export function OrgSettingsHeader() {
  const location = useLocation()
  const { organization } = useOrgContext()
  const { context } = useTeamContext()

  // Get current page title
  const getPageTitle = () => {
    const segments = location.pathname.split('/')
    const settingsIndex = segments.indexOf('settings')
    const page = settingsIndex >= 0 ? segments[settingsIndex + 1] : 'general'
    return ORG_SETTINGS_PAGES[page] || 'Settings'
  }

  // Build return URL to team dashboard
  const getReturnUrl = () => {
    if (context) {
      return `/org/${context.organization.id}/team/${context.team.id}/dashboard`
    }
    return '/'
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left: Back Button + Org Name + Page Title */}
      <div className="flex items-center gap-4">
        {/* Back to Team Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to={getReturnUrl()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Team</span>
          </Link>
        </Button>

        {/* Org Name */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-px h-6 bg-border" />
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">{organization?.name}</span>
        </div>

        {/* Page Title */}
        <div className="hidden md:block w-px h-6 bg-border" />
        <h1 className="hidden md:block text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      {/* Right: Actions + User Menu */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
