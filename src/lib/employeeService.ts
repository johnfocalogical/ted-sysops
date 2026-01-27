import { supabase } from './supabase'
import type {
  EmployeeListItem,
  EmployeeWithDetails,
  UpdateEmployeeProfileDTO,
  EmployeeDirectoryParams,
} from '@/types/employee.types'
import {
  getContactMethodsForEmployee,
  saveContactMethodsForEmployee,
} from './contactMethodHelpers'
import { getPrimaryPhone, getPrimaryEmail } from './contactMethodHelpers'

// ============================================================================
// Employee Service
// Employee directory, profiles, and management
// ============================================================================

export interface PaginatedEmployees {
  data: EmployeeListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Get employee directory with pagination, search, and filtering
 */
export async function getEmployeeDirectory(
  params: EmployeeDirectoryParams
): Promise<PaginatedEmployees> {
  if (!supabase) throw new Error('Supabase not configured')

  const { teamId, page = 1, pageSize = 25, search, departmentId, status, employeeTypeId } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build base query — join employee_profiles → team_members → users, team_departments, employee_type_assignments
  let query = supabase
    .from('employee_profiles')
    .select(
      `
      *,
      team_member:team_members!employee_profiles_team_member_id_fkey (
        id,
        user_id,
        permission_level,
        user:users!team_members_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        roles:team_member_roles (
          role:team_roles (
            id,
            name,
            color
          )
        )
      ),
      department:team_departments (
        id,
        name,
        icon,
        color
      ),
      employee_type_assignments (
        id,
        type_id,
        type:team_employee_types (
          id,
          name,
          icon,
          color
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('team_id', teamId)

  // Apply department filter
  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  // Apply status filter
  if (status) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: true })
    .range(from, to)

  if (error) throw error

  // Fetch contact methods for each employee
  const profileIds = (data || []).map((ep: { id: string }) => ep.id)
  let methodsByProfile: Record<string, typeof contactMethodsData> = {}

  if (profileIds.length > 0) {
    const { data: contactMethodsData, error: cmError } = await supabase
      .from('contact_methods')
      .select('*')
      .in('employee_profile_id', profileIds)

    if (cmError) throw cmError

    // Group by employee_profile_id
    for (const cm of contactMethodsData || []) {
      const epId = cm.employee_profile_id as string
      if (!methodsByProfile[epId]) methodsByProfile[epId] = []
      methodsByProfile[epId].push(cm)
    }
  }

  // Transform to list items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listItems: EmployeeListItem[] = (data || []).map((ep: any) => {
    const user = ep.team_member?.user || {}
    const roles = (ep.team_member?.roles || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => r.role)
      .filter(Boolean)

    const methods = methodsByProfile[ep.id] || []

    // Extract employee types from assignments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeTypes = (ep.employee_type_assignments || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => a.type)
      .filter(Boolean)

    return {
      id: ep.id,
      team_member_id: ep.team_member_id,
      team_id: ep.team_id,
      job_title: ep.job_title,
      department_id: ep.department_id,
      hire_date: ep.hire_date,
      status: ep.status,
      employee_notes: ep.employee_notes,
      emergency_contact_name: ep.emergency_contact_name,
      emergency_contact_phone: ep.emergency_contact_phone,
      emergency_contact_relationship: ep.emergency_contact_relationship,
      created_at: ep.created_at,
      updated_at: ep.updated_at,
      user: {
        id: user.id || '',
        full_name: user.full_name || null,
        email: user.email || '',
        avatar_url: user.avatar_url || null,
      },
      department: ep.department
        ? { id: ep.department.id, name: ep.department.name, icon: ep.department.icon, color: ep.department.color }
        : null,
      roles,
      employee_types: employeeTypes,
      primary_phone: getPrimaryPhone(methods),
      primary_email: getPrimaryEmail(methods),
    }
  })

  // Apply employee type filter in memory (M:N join can't be filtered in Supabase query easily)
  if (employeeTypeId) {
    listItems = listItems.filter(
      (item) => item.employee_types.some((t) => t.id === employeeTypeId)
    )
  }

  // Apply search filter in memory (on user full_name, email, job_title)
  if (search) {
    const lower = search.toLowerCase()
    listItems = listItems.filter(
      (item) =>
        (item.user.full_name || '').toLowerCase().includes(lower) ||
        item.user.email.toLowerCase().includes(lower) ||
        (item.job_title || '').toLowerCase().includes(lower)
    )
  }

  const total = search ? listItems.length : (count || 0)
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: listItems,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get a single employee profile with full details
 */
export async function getEmployeeProfileById(
  profileId: string
): Promise<EmployeeWithDetails | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('employee_profiles')
    .select(
      `
      *,
      team_member:team_members!employee_profiles_team_member_id_fkey (
        id,
        user_id,
        permission_level,
        user:users!team_members_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        roles:team_member_roles (
          role:team_roles (*)
        )
      ),
      department:team_departments (*),
      employee_type_assignments (
        id,
        type_id,
        type:team_employee_types (
          id,
          name,
          icon,
          color
        )
      )
    `
    )
    .eq('id', profileId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Fetch contact methods
  const contactMethods = await getContactMethodsForEmployee(profileId)

  // Transform
  const user = data.team_member?.user || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roles = (data.team_member?.roles || []).map((r: any) => r.role).filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employeeTypes = ((data as any).employee_type_assignments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => a.type)
    .filter(Boolean)

  return {
    id: data.id,
    team_member_id: data.team_member_id,
    team_id: data.team_id,
    job_title: data.job_title,
    department_id: data.department_id,
    hire_date: data.hire_date,
    status: data.status,
    employee_notes: data.employee_notes,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_phone: data.emergency_contact_phone,
    emergency_contact_relationship: data.emergency_contact_relationship,
    created_at: data.created_at,
    updated_at: data.updated_at,
    user: {
      id: user.id || '',
      full_name: user.full_name || null,
      email: user.email || '',
      avatar_url: user.avatar_url || null,
    },
    department: data.department || null,
    roles,
    employee_types: employeeTypes,
    contact_methods: contactMethods,
    permission_level: data.team_member?.permission_level || 'viewer',
  }
}

/**
 * Get employee profile by team member ID
 */
export async function getEmployeeProfileByTeamMemberId(
  teamMemberId: string
): Promise<EmployeeWithDetails | null> {
  if (!supabase) throw new Error('Supabase not configured')

  // First get the profile ID
  const { data, error } = await supabase
    .from('employee_profiles')
    .select('id')
    .eq('team_member_id', teamMemberId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return getEmployeeProfileById(data.id)
}

/**
 * Update an employee profile
 */
export async function updateEmployeeProfile(
  profileId: string,
  dto: UpdateEmployeeProfileDTO
): Promise<EmployeeWithDetails> {
  if (!supabase) throw new Error('Supabase not configured')

  // Build update object (exclude contact_methods — handled separately)
  const updates: Record<string, unknown> = {}
  if (dto.job_title !== undefined) updates.job_title = dto.job_title
  if (dto.department_id !== undefined) updates.department_id = dto.department_id
  if (dto.hire_date !== undefined) updates.hire_date = dto.hire_date
  if (dto.status !== undefined) updates.status = dto.status
  if (dto.employee_notes !== undefined) updates.employee_notes = dto.employee_notes
  if (dto.emergency_contact_name !== undefined) updates.emergency_contact_name = dto.emergency_contact_name
  if (dto.emergency_contact_phone !== undefined) updates.emergency_contact_phone = dto.emergency_contact_phone
  if (dto.emergency_contact_relationship !== undefined) updates.emergency_contact_relationship = dto.emergency_contact_relationship

  // Update profile fields
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('employee_profiles')
      .update(updates)
      .eq('id', profileId)

    if (error) throw error
  }

  // Update contact methods if provided
  if (dto.contact_methods !== undefined) {
    await saveContactMethodsForEmployee(profileId, dto.contact_methods)
  }

  // Return updated profile
  const updated = await getEmployeeProfileById(profileId)
  if (!updated) throw new Error('Employee profile not found after update')
  return updated
}
