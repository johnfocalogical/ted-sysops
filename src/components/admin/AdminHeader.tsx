import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { UserMenu } from '@/components/layouts/UserMenu'
import { useNavigation } from '@/hooks/useNavigation'
import { useAuth } from '@/hooks/useAuth'

// Map routes to page titles
const PAGE_TITLES: Record<string, string> = {
  '': 'Dashboard',
  'dashboard': 'Dashboard',
  'organizations': 'Organizations',
  'teams': 'Teams',
  'users': 'Users',
  'role-templates': 'Role Templates',
}

export function AdminHeader() {
  const { toggleMobileMenu } = useNavigation()
  const { getDefaultTeam } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Derive page title from current route
  const getPageTitle = () => {
    // URL pattern: /admin/{page} or /admin/{page}/{id}
    const segments = location.pathname.split('/')
    const adminIndex = segments.indexOf('admin')
    const page = adminIndex >= 0 ? segments[adminIndex + 1] || '' : ''

    // Check if it's a detail page (has an ID after the page)
    const isDetailPage = segments.length > adminIndex + 2 && segments[adminIndex + 2]

    if (isDetailPage) {
      return `${PAGE_TITLES[page] || 'Details'} Details`
    }

    return PAGE_TITLES[page] || 'Dashboard'
  }

  const handleBackToApp = async () => {
    const defaultTeam = await getDefaultTeam()
    if (defaultTeam) {
      navigate(`/org/${defaultTeam.org_id}/team/${defaultTeam.team_id}/dashboard`)
    } else {
      navigate('/')
    }
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile Menu Toggle + Back to App + Page Title */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Back to App Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToApp}
          className="hidden sm:flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Button>

        {/* Page Title */}
        <div className="hidden sm:block w-px h-6 bg-border" />
        <h1 className="hidden sm:block text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      {/* Right: Actions + User Menu */}
      <div className="flex items-center gap-2">
        {/* Mobile Back to App */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToApp}
          className="sm:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
