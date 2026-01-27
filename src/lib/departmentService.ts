import { supabase } from './supabase'
import type {
  Department,
  DepartmentWithUsage,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
} from '@/types/employee.types'

// ============================================================================
// Department Service
// Manage configurable departments per team
// ============================================================================

/**
 * Get all departments for a team with usage counts
 */
export async function getTeamDepartments(teamId: string): Promise<DepartmentWithUsage[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_departments')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  // Get usage counts for each department
  const departmentsWithUsage: DepartmentWithUsage[] = []
  for (const dept of data || []) {
    const { count } = await supabase
      .from('employee_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', dept.id)

    departmentsWithUsage.push({
      ...dept,
      usage_count: count || 0,
    })
  }

  return departmentsWithUsage
}

/**
 * Get active departments for a team (for dropdowns)
 */
export async function getActiveDepartments(teamId: string): Promise<Department[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_departments')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Create a new department
 */
export async function createDepartment(dto: CreateDepartmentDTO): Promise<Department> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_departments')
    .insert({
      team_id: dto.team_id,
      name: dto.name,
      description: dto.description || null,
      sort_order: dto.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update a department
 */
export async function updateDepartment(
  id: string,
  dto: UpdateDepartmentDTO
): Promise<Department> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_departments')
    .update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a department (only if unused)
 */
export async function deleteDepartment(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const canDelete = await canDeleteDepartment(id)
  if (!canDelete.canDelete) {
    throw new Error(canDelete.reason || 'Cannot delete this department')
  }

  const { error } = await supabase
    .from('team_departments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Check if a department can be deleted
 */
export async function canDeleteDepartment(
  id: string
): Promise<{ canDelete: boolean; reason?: string }> {
  if (!supabase) throw new Error('Supabase not configured')

  const { count } = await supabase
    .from('employee_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', id)

  if (count && count > 0) {
    return {
      canDelete: false,
      reason: `This department is assigned to ${count} employee${count === 1 ? '' : 's'}. Deactivate it instead.`,
    }
  }

  return { canDelete: true }
}

/**
 * Check if a department name is unique within the team
 */
export async function isDepartmentNameUnique(
  teamId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from('team_departments')
    .select('id')
    .eq('team_id', teamId)
    .eq('name', name)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error

  return !data || data.length === 0
}
