import {
  Inbox, LayoutDashboard, Wallet, Users, Kanban, Contact, UserCog,
  Shield, Calendar, BarChart3, Settings
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { SectionKey, RolePermissions } from '@/types/role.types'
import { cn } from '@/lib/utils'

// Section display configuration
const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pay_time', label: 'Pay & Time', icon: Wallet },
  { key: 'team', label: 'Team Dashboard', icon: Users },
  { key: 'whiteboard', label: 'Whiteboard', icon: Kanban },
  { key: 'contacts', label: 'Contact Hub', icon: Contact },
  { key: 'employees', label: 'Employee Sentinel', icon: UserCog },
  { key: 'transactions', label: 'Transaction Guardian', icon: Shield },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
]

type AccessValue = 'none' | 'view' | 'full'

interface PermissionMatrixProps {
  value: Record<SectionKey, AccessValue>
  onChange: (value: Record<SectionKey, AccessValue>) => void
  disabled?: boolean
}

/**
 * Convert internal state to RolePermissions JSONB format
 */
export function toRolePermissions(state: Record<SectionKey, AccessValue>): RolePermissions {
  const perms: RolePermissions = {}
  for (const [key, access] of Object.entries(state)) {
    if (access !== 'none') {
      perms[key as SectionKey] = { access }
    }
  }
  return perms
}

/**
 * Convert RolePermissions JSONB to internal state
 */
export function fromRolePermissions(perms: RolePermissions | undefined): Record<SectionKey, AccessValue> {
  const state: Record<SectionKey, AccessValue> = {
    inbox: 'none',
    dashboard: 'none',
    pay_time: 'none',
    team: 'none',
    whiteboard: 'none',
    contacts: 'none',
    employees: 'none',
    transactions: 'none',
    calendar: 'none',
    reports: 'none',
    settings: 'none',
  }

  if (perms) {
    for (const [key, perm] of Object.entries(perms)) {
      if (perm?.access) {
        state[key as SectionKey] = perm.access
      }
    }
  }

  return state
}

/**
 * Get default state with all sections set to 'none'
 */
export function getDefaultPermissionState(): Record<SectionKey, AccessValue> {
  return fromRolePermissions(undefined)
}

export function PermissionMatrix({ value, onChange, disabled = false }: PermissionMatrixProps) {
  const handleChange = (sectionKey: SectionKey, access: AccessValue) => {
    onChange({
      ...value,
      [sectionKey]: access,
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
        <div>Section</div>
        <div className="text-center">No Access</div>
        <div className="text-center">View</div>
        <div className="text-center">Full</div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          const currentValue = value[section.key] || 'none'

          return (
            <div
              key={section.key}
              className={cn(
                'grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-3 items-center',
                disabled && 'opacity-50'
              )}
            >
              {/* Section label */}
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{section.label}</span>
              </div>

              {/* Radio buttons */}
              <RadioGroup
                value={currentValue}
                onValueChange={(val: string) => handleChange(section.key, val as AccessValue)}
                disabled={disabled}
                className="contents"
              >
                <div className="flex justify-center">
                  <RadioGroupItem
                    value="none"
                    id={`${section.key}-none`}
                    className="border-muted-foreground/50"
                  />
                </div>
                <div className="flex justify-center">
                  <RadioGroupItem
                    value="view"
                    id={`${section.key}-view`}
                    className="border-muted-foreground/50"
                  />
                </div>
                <div className="flex justify-center">
                  <RadioGroupItem
                    value="full"
                    id={`${section.key}-full`}
                    className="border-muted-foreground/50"
                  />
                </div>
              </RadioGroup>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-muted/30 border-t text-xs text-muted-foreground space-y-1">
        <div><strong>No Access:</strong> Section hidden from user</div>
        <div><strong>View:</strong> Can see content but not edit</div>
        <div><strong>Full:</strong> Can view, create, edit, and delete</div>
      </div>
    </div>
  )
}
