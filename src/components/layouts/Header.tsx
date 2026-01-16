import { useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { UserMenu } from './UserMenu'
import { TeamSwitcher } from './TeamSwitcher'
import { useNavigation, NAV_ITEMS } from '@/hooks/useNavigation'

export function Header() {
  const { toggleMobileMenu } = useNavigation()
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
      {/* Left: Mobile Menu Toggle + Team Switcher + Page Title */}
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

        {/* Team Switcher Dropdown */}
        <TeamSwitcher />

        {/* Page Title */}
        <div className="hidden sm:block w-px h-6 bg-border" />
        <h1 className="hidden sm:block text-lg font-semibold">{getPageTitle()}</h1>
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
