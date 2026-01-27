// ============================================================================
// Employee Profile & Department Types
// ============================================================================

import type { ContactMethod, ContactMethodInput } from './contact.types'
import type { TeamRole } from './role.types'

// Employee status enum matching database
export type EmployeeStatus = 'active' | 'inactive'

// ============================================================================
// Department Types
// ============================================================================

// Department matching team_departments table
export interface Department {
  id: string
  team_id: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Department with usage count (for settings list)
export interface DepartmentWithUsage extends Department {
  usage_count: number
}

// DTO for creating a department
export interface CreateDepartmentDTO {
  team_id: string
  name: string
  description?: string
  sort_order?: number
}

// DTO for updating a department
export interface UpdateDepartmentDTO {
  name?: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

// ============================================================================
// Employee Profile Types
// ============================================================================

// Base employee profile matching employee_profiles table
export interface EmployeeProfile {
  id: string
  team_member_id: string
  team_id: string
  job_title: string | null
  department_id: string | null
  hire_date: string | null
  status: EmployeeStatus
  employee_notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  created_at: string
  updated_at: string
}

// Employee list item for directory table
export interface EmployeeListItem extends EmployeeProfile {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  department: {
    id: string
    name: string
  } | null
  roles: Array<{
    id: string
    name: string
    color: string
  }>
  primary_phone: string | null
  primary_email: string | null
}

// Employee with full details (for detail/edit views)
export interface EmployeeWithDetails extends EmployeeProfile {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  department: Department | null
  roles: TeamRole[]
  contact_methods: ContactMethod[]
  permission_level: 'admin' | 'member' | 'viewer'
}

// DTO for updating an employee profile
export interface UpdateEmployeeProfileDTO {
  job_title?: string | null
  department_id?: string | null
  hire_date?: string | null
  status?: EmployeeStatus
  employee_notes?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relationship?: string | null
  contact_methods?: ContactMethodInput[]
}

// ============================================================================
// Query Parameter Types
// ============================================================================

// Parameters for fetching the employee directory
export interface EmployeeDirectoryParams {
  teamId: string
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string | null
  status?: EmployeeStatus | null
}
