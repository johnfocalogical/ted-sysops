import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Shield,
  UserCircle,
  Building2,
} from 'lucide-react'

export interface SettingsItem {
  id: string
  label: string
  icon: LucideIcon
  description: string
  route: string
}

export interface SettingsCategory {
  id: string
  label: string
  items: SettingsItem[]
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      {
        id: 'team-members',
        label: 'Team Members',
        icon: Users,
        description: 'Manage team members, invitations, and join links',
        route: 'team-members',
      },
      {
        id: 'roles',
        label: 'Roles',
        icon: Shield,
        description: 'Create roles and define permissions',
        route: 'roles',
      },
    ],
  },
  {
    id: 'contact-hub',
    label: 'Contact Hub',
    items: [
      {
        id: 'contact-types',
        label: 'Contact Types',
        icon: UserCircle,
        description: 'Manage contact type categories and custom fields',
        route: 'contact-types',
      },
      {
        id: 'company-types',
        label: 'Company Types',
        icon: Building2,
        description: 'Manage company type categories and custom fields',
        route: 'company-types',
      },
    ],
  },
]

// Flatten all items for search functionality
export const ALL_SETTINGS_ITEMS = SETTINGS_CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({ ...item, categoryId: cat.id, categoryLabel: cat.label }))
)
