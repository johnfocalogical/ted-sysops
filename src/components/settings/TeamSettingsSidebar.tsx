import { useState } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Home, Settings, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SETTINGS_CATEGORIES } from '@/config/settingsConfig'

export function TeamSettingsSidebar() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const basePath = `/org/${orgId}/team/${teamId}/settings`
  const dashboardPath = `/org/${orgId}/team/${teamId}`

  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    SETTINGS_CATEGORIES.map((c) => c.id) // Start all expanded
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-card border-r border-border">
      {/* Logo Section */}
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
        <Rocket className="h-6 w-6 text-primary flex-shrink-0" />
        <span className="text-xl font-bold">TED SYSOPS</span>
      </div>

      {/* Back to Dashboard */}
      <div className="px-3 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(dashboardPath)}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>
      </div>

      {/* Settings Label */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Settings</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Home */}
        <div className="px-3 mb-2">
          <NavLink
            to={basePath}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors',
                isActive && 'bg-primary/10 text-primary font-medium'
              )
            }
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            <span>Home</span>
          </NavLink>
        </div>

        {/* Categories */}
        <div className="space-y-1">
          {SETTINGS_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.id)

            return (
              <div key={category.id}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{category.label}</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <ul className="px-3 space-y-1">
                    {category.items.map((item) => {
                      const Icon = item.icon
                      const fullRoute = `${basePath}/${item.route}`

                      return (
                        <li key={item.id}>
                          <NavLink
                            to={fullRoute}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors',
                                isActive && 'bg-primary/10 text-primary font-medium'
                              )
                            }
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
