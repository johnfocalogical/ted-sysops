import { supabase } from './supabase'
import type { EmployeeTypeAssignment } from '@/types/employee.types'

// ============================================================================
// Employee Type Assignment Service
// Manages M:N assignments between employee profiles and team employee types
// ============================================================================

/**
 * Get all type assignments for an employee profile
 */
export async function getEmployeeTypeAssignments(
  employeeProfileId: string
): Promise<EmployeeTypeAssignment[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('employee_type_assignments')
    .select('*')
    .eq('employee_profile_id', employeeProfileId)

  if (error) throw error

  return data || []
}

/**
 * Assign a single type to an employee
 */
export async function assignEmployeeType(
  employeeProfileId: string,
  typeId: string
): Promise<EmployeeTypeAssignment> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('employee_type_assignments')
    .insert({
      employee_profile_id: employeeProfileId,
      type_id: typeId,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Remove a single type from an employee
 */
export async function removeEmployeeType(
  employeeProfileId: string,
  typeId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('employee_type_assignments')
    .delete()
    .eq('employee_profile_id', employeeProfileId)
    .eq('type_id', typeId)

  if (error) throw error
}

/**
 * Set the complete list of types for an employee (sync: add missing, remove extras)
 */
export async function setEmployeeTypes(
  employeeProfileId: string,
  typeIds: string[]
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get current assignments
  const current = await getEmployeeTypeAssignments(employeeProfileId)
  const currentTypeIds = current.map((a) => a.type_id)

  // Determine additions and removals
  const toAdd = typeIds.filter((id) => !currentTypeIds.includes(id))
  const toRemove = currentTypeIds.filter((id) => !typeIds.includes(id))

  // Remove extras
  for (const typeId of toRemove) {
    await removeEmployeeType(employeeProfileId, typeId)
  }

  // Add missing
  for (const typeId of toAdd) {
    await assignEmployeeType(employeeProfileId, typeId)
  }
}
