import { supabase } from './supabase'
import type { TeamRole, CreateTeamRoleDTO, UpdateTeamRoleDTO } from '@/types/role.types'

export interface RoleWithMemberCount extends TeamRole {
  member_count: number
}

/**
 * Get all roles for a team with member counts
 */
export async function getTeamRoles(teamId: string): Promise<RoleWithMemberCount[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get roles
  const { data: roles, error: rolesError } = await supabase
    .from('team_roles')
    .select('*')
    .eq('team_id', teamId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (rolesError) throw rolesError
  if (!roles) return []

  // Get member counts for each role
  const { data: memberCounts, error: countError } = await supabase
    .from('team_members')
    .select('role_id')
    .eq('team_id', teamId)
    .not('role_id', 'is', null)

  if (countError) throw countError

  // Count members per role
  const countMap = new Map<string, number>()
  memberCounts?.forEach((m) => {
    const current = countMap.get(m.role_id) || 0
    countMap.set(m.role_id, current + 1)
  })

  // Combine roles with counts
  return roles.map((role) => ({
    ...role,
    member_count: countMap.get(role.id) || 0,
  }))
}

/**
 * Get a single role by ID
 */
export async function getTeamRole(roleId: string): Promise<TeamRole | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_roles')
    .select('*')
    .eq('id', roleId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new custom role
 */
export async function createRole(dto: CreateTeamRoleDTO): Promise<TeamRole> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_roles')
    .insert({
      team_id: dto.team_id,
      name: dto.name,
      description: dto.description || null,
      permissions: dto.permissions,
      is_default: false,
      template_id: null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing role
 */
export async function updateRole(roleId: string, dto: UpdateTeamRoleDTO): Promise<TeamRole> {
  if (!supabase) throw new Error('Supabase not configured')

  const updates: Record<string, unknown> = {}
  if (dto.name !== undefined) updates.name = dto.name
  if (dto.description !== undefined) updates.description = dto.description
  if (dto.permissions !== undefined) updates.permissions = dto.permissions

  const { data, error } = await supabase
    .from('team_roles')
    .update(updates)
    .eq('id', roleId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a role (only if no members assigned)
 */
export async function deleteRole(roleId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('team_roles')
    .delete()
    .eq('id', roleId)

  if (error) throw error
}

/**
 * Check if a role can be deleted
 */
export async function canDeleteRole(roleId: string): Promise<{ canDelete: boolean; reason?: string }> {
  if (!supabase) throw new Error('Supabase not configured')

  // Check if any members have this role
  const { count, error: countError } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', roleId)

  if (countError) throw countError

  if (count && count > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete role with ${count} member${count > 1 ? 's' : ''} assigned`,
    }
  }

  return { canDelete: true }
}

/**
 * Check if a role name is unique within a team
 */
export async function isRoleNameUnique(teamId: string, name: string, excludeRoleId?: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from('team_roles')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .ilike('name', name)

  if (excludeRoleId) {
    query = query.neq('id', excludeRoleId)
  }

  const { count, error } = await query

  if (error) throw error
  return count === 0
}
