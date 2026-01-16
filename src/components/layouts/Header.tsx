import { useLocation } from 'react-router-dom'
import { Menu, Bell, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { UserMenu } from './UserMenu'
import { useNavigation, NAV_ITEMS } from '@/hooks/useNavigation'
import { useTeamContext } from '@/hooks/useTeamContext'

export function Header() {
  const { toggleMobileMenu } = useNavigation()
  const { context } = useTeamContext()
  const location = useLocation()

  // Derive page title from current route
  const getPageTitle = () => {
    // Extract the page segment from team-scoped URL
    // URL pattern: /org/{orgId}/team/{teamId}/{page}
    const segments = location.pathname.split('/')
    const pageIndex = segments.indexOf('team')
    const page = pageIndex >= 0 ? segments[pageIndex + 2] : segments[1] || 'dashboard'

    const navItem = NAV_ITEMS.find((item) => item.route === page)
    return navItem?.label || 'Dashboard'
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile Menu Toggle + Team Context + Page Title */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Team Context Badge */}
        {context && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="max-w-[120px] truncate">{context.organization.name}</span>
            </div>
            <span>/</span>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="max-w-[120px] truncate font-medium text-foreground">
                {context.team.name}
              </span>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="hidden sm:block w-px h-6 bg-border" />
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>

      {/* Right: Actions + User Menu */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications (placeholder) */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
