import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Users, Kanban, Contact, UserCog,
  Shield, Calendar, BarChart3, Settings, ChevronLeft, ChevronRight,
  X, Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigation, NAV_ITEMS } from '@/hooks/useNavigation'
import { useTeamContext } from '@/hooks/useTeamContext'
import { cn } from '@/lib/utils'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Wallet,
  Users,
  Kanban,
  Contact,
  UserCog,
  Shield,
  Calendar,
  BarChart3,
  Settings,
}

export function Sidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, closeMobileMenu } = useNavigation()
  const { context, canAccess } = useTeamContext()

  // Build the base path for team-scoped URLs
  const basePath = context
    ? `/org/${context.organization.id}/team/${context.team.id}`
    : ''

  // Filter nav items based on user's section permissions
  const accessibleItems = NAV_ITEMS.filter(item => canAccess(item.section))

  const handleNavClick = () => {
    // Close mobile menu when nav item clicked
    if (window.innerWidth < 1024) {
      closeMobileMenu()
    }
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300',
        // Desktop: always visible, width based on collapsed state
        'lg:static lg:translate-x-0',
        collapsed ? 'lg:w-20' : 'lg:w-64',
        // Mobile: off-screen by default, slide in when open
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold">TED SYSOPS</span>
          )}
        </div>

        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={closeMobileMenu}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {accessibleItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard
            const fullRoute = `${basePath}/${item.route}`
            return (
              <li key={item.route}>
                <NavLink
                  to={fullRoute}
                  end={item.exact}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors',
                      isActive && 'bg-primary/10 text-primary border-r-2 border-primary font-medium',
                      collapsed && 'lg:justify-center lg:px-2'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="lg:block">{item.label}</span>
                  )}
                  {/* Always show label on mobile even if collapsed on desktop */}
                  {collapsed && (
                    <span className="lg:hidden">{item.label}</span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle (Desktop only) */}
      <div className="hidden lg:block p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center text-muted-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
