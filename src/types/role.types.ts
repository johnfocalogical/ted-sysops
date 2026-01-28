// Access level for a section
export type AccessLevel = 'full' | 'view'

// Permission for a single section
export interface SectionPermission {
  access: AccessLevel
}

// Section keys that can have permissions
export type SectionKey =
  | 'inbox'
  | 'dashboard'
  | 'pay_time'
  | 'team'
  | 'whiteboard'
  | 'contacts'
  | 'employees'
  | 'transactions'
  | 'calendar'
  | 'reports'
  | 'settings'

// Full permissions object (section key -> permission)
export type RolePermissions = Partial<Record<SectionKey, SectionPermission>>

// Team role (per-team role)
export interface TeamRole {
  id: string
  team_id: string
  name: string
  description: string | null
  permissions: RolePermissions
  is_default: boolean
  template_id: string | null
  department_id: string | null
  department?: { id: string; name: string }
  created_at: string
  updated_at: string
}

// Role template (system-wide template)
export interface RoleTemplate {
  id: string
  name: string
  description: string | null
  permissions: RolePermissions
  is_system: boolean
  auto_install: boolean
  created_at: string
  updated_at: string
}

// DTO for creating a team role
export interface CreateTeamRoleDTO {
  team_id: string
  name: string
  description?: string
  permissions: RolePermissions
  department_id?: string
}

// DTO for updating a team role
export interface UpdateTeamRoleDTO {
  name?: string
  description?: string
  permissions?: RolePermissions
  department_id?: string | null
}
