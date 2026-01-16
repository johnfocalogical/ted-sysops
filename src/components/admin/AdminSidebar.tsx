import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users2, Users, FileKey,
  ChevronLeft, ChevronRight, X, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigation } from '@/hooks/useNavigation'
import { cn } from '@/lib/utils'

// Admin navigation items
interface AdminNavItem {
  label: string
  route: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  exact?: boolean
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', route: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Organizations', route: '/admin/organizations', icon: Building2 },
  { label: 'Teams', route: '/admin/teams', icon: Users2 },
  { label: 'Users', route: '/admin/users', icon: Users },
]

const ADMIN_NAV_ITEMS_SECONDARY: AdminNavItem[] = [
  { label: 'Role Templates', route: '/admin/role-templates', icon: FileKey },
]

export function AdminSidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, closeMobileMenu } = useNavigation()

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      closeMobileMenu()
    }
  }

  const renderNavItem = (item: AdminNavItem) => {
    const Icon = item.icon

    if (item.disabled) {
      return (
        <li key={item.route}>
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/50 cursor-not-allowed',
              collapsed && 'lg:justify-center lg:px-2'
            )}
            title={collapsed ? `${item.label} (Coming Soon)` : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span className="lg:block flex-1">{item.label}</span>
            )}
            {!collapsed && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
            )}
            {collapsed && (
              <span className="lg:hidden">{item.label}</span>
            )}
          </div>
        </li>
      )
    }

    return (
      <li key={item.route}>
        <NavLink
          to={item.route}
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
          {collapsed && (
            <span className="lg:hidden">{item.label}</span>
          )}
        </NavLink>
      </li>
    )
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300',
        'lg:static lg:translate-x-0',
        collapsed ? 'lg:w-20' : 'lg:w-64',
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-purple-500 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold">Admin</span>
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
          {ADMIN_NAV_ITEMS.map(renderNavItem)}
        </ul>

        {/* Divider */}
        <div className="my-4 mx-3 border-t border-border" />

        {/* Secondary Nav */}
        <ul className="space-y-1 px-3">
          {ADMIN_NAV_ITEMS_SECONDARY.map(renderNavItem)}
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
