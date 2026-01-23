// ============================================================================
// Type System Types (Epic 3B)
// Template-based type management for contacts and companies
// ============================================================================

// ============================================================================
// Type Templates (Superadmin Managed)
// ============================================================================

export interface ContactTypeTemplate {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_system: boolean
  auto_install: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ContactTypeTemplateWithUsage extends ContactTypeTemplate {
  usage_count: number  // Number of teams using this template
}

export interface CompanyTypeTemplate {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_system: boolean
  auto_install: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompanyTypeTemplateWithUsage extends CompanyTypeTemplate {
  usage_count: number
}

// ============================================================================
// Team Types (Per-Team, Customizable)
// ============================================================================

export interface TeamContactType {
  id: string
  team_id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_active: boolean
  sort_order: number
  template_id: string | null
  created_at: string
  updated_at: string
}

export interface TeamContactTypeWithUsage extends TeamContactType {
  usage_count: number  // Number of contacts using this type
}

export interface TeamCompanyType {
  id: string
  team_id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_active: boolean
  sort_order: number
  template_id: string | null
  created_at: string
  updated_at: string
}

export interface TeamCompanyTypeWithUsage extends TeamCompanyType {
  usage_count: number  // Number of companies using this type
}

// ============================================================================
// Custom Field Definitions
// ============================================================================

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'dropdown'
  | 'multi_select'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'

export interface CustomFieldDefinition {
  id: string
  team_contact_type_id: string | null
  team_company_type_id: string | null
  name: string
  field_type: CustomFieldType
  description: string | null
  is_required: boolean
  options: string[] | null  // For dropdown/multi_select
  default_value: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateTypeTemplateDTO {
  name: string
  description?: string
  icon: string
  color: string
  auto_install?: boolean
}

export interface UpdateTypeTemplateDTO {
  name?: string
  description?: string | null
  icon?: string
  color?: string
  auto_install?: boolean
  sort_order?: number
}

export interface CreateTeamTypeDTO {
  team_id: string
  name: string
  description?: string
  icon: string
  color: string
}

export interface UpdateTeamTypeDTO {
  name?: string
  description?: string | null
  icon?: string
  color?: string
  is_active?: boolean
  sort_order?: number
}

export interface CreateCustomFieldDTO {
  team_contact_type_id?: string
  team_company_type_id?: string
  name: string
  field_type: CustomFieldType
  description?: string
  is_required?: boolean
  options?: string[]
  default_value?: string
}

export interface UpdateCustomFieldDTO {
  name?: string
  field_type?: CustomFieldType
  description?: string | null
  is_required?: boolean
  options?: string[] | null
  default_value?: string | null
  sort_order?: number
}

// ============================================================================
// Icon & Color Constants
// ============================================================================

export const TYPE_ICONS = [
  // People
  'User',
  'UserCheck',
  'UserPlus',
  'Users',
  // Buildings
  'Building',
  'Building2',
  'Home',
  'Landmark',
  // Finance
  'Wallet',
  'CreditCard',
  'DollarSign',
  'PiggyBank',
  'Banknote',
  // Business
  'Briefcase',
  'FileText',
  'Clipboard',
  'FolderOpen',
  // Communication
  'Phone',
  'Mail',
  'MessageSquare',
  'Send',
  // Tools/Work
  'Wrench',
  'Settings',
  'Tool',
  'HardHat',
  'Hammer',
  // Legal/Authority
  'Scale',
  'Shield',
  'Award',
  'Star',
  // Relationship
  'Heart',
  'Handshake',
  'Target',
  'TrendingUp',
  // Location
  'Map',
  'MapPin',
  'Globe',
  'Navigation',
  // Misc
  'Search',
  'Megaphone',
  'Repeat',
  'Zap',
  'Package',
  'Truck',
] as const

export type TypeIcon = (typeof TYPE_ICONS)[number]

export const TYPE_COLORS = {
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-800 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-800 dark:text-pink-300',
    border: 'border-pink-300 dark:border-pink-700',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-700',
  },
} as const

export type TypeColor = keyof typeof TYPE_COLORS

// Helper to get color classes
export function getTypeColorClasses(color: string): {
  bg: string
  text: string
  border: string
} {
  return (
    TYPE_COLORS[color as TypeColor] || TYPE_COLORS.gray
  )
}

// Field type labels for UI
export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  textarea: 'Long Text',
  number: 'Number',
  currency: 'Currency',
  date: 'Date',
  dropdown: 'Dropdown',
  multi_select: 'Multi-Select',
  checkbox: 'Checkbox',
  url: 'URL',
  email: 'Email',
  phone: 'Phone',
}
