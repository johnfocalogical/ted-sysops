import { NavLink, useParams } from 'react-router-dom'
import { Settings, Users, Layers, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

const ORG_SETTINGS_NAV = [
  { label: 'General', route: 'general', icon: Settings },
  { label: 'Teams', route: 'teams', icon: Layers },
  { label: 'Members', route: 'members', icon: Users },
]

export function OrgSettingsSidebar() {
  const { orgId } = useParams<{ orgId: string }>()
  const basePath = `/org/${orgId}/settings`

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-card border-r border-border">
      {/* Logo Section */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
        <Rocket className="h-6 w-6 text-primary flex-shrink-0" />
        <span className="text-xl font-bold">TED SYSOPS</span>
      </div>

      {/* Settings Label */}
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
          Organization Settings
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {ORG_SETTINGS_NAV.map((item) => {
            const Icon = item.icon
            const fullRoute = `${basePath}/${item.route}`
            return (
              <li key={item.route}>
                <NavLink
                  to={fullRoute}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors',
                      isActive && 'bg-primary/10 text-primary border-r-2 border-primary font-medium'
                    )
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
