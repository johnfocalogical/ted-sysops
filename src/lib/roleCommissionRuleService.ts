import { supabase } from './supabase'
import { validateCommissionConfiguration } from './commissionRuleService'
import type {
  RoleCommissionRule,
  RoleCommissionRuleWithCreator,
  CreateRoleCommissionRuleDTO,
  UpdateRoleCommissionRuleDTO,
} from '@/types/roleCommission.types'

// ============================================================================
// Role Commission Rule Service
// CRUD operations for commission rules attached to roles
// ============================================================================

/**
 * Get all commission rules for a role, ordered by priority then creation date
 */
export async function getRoleCommissionRules(
  roleId: string
): Promise<RoleCommissionRuleWithCreator[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('role_commission_rules')
    .select(`
      *,
      creator:users!role_commission_rules_created_by_fkey(id, full_name, email)
    `)
    .eq('role_id', roleId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    creator: row.creator || undefined,
  })) as RoleCommissionRuleWithCreator[]
}

/**
 * Get a single role commission rule by ID
 */
export async function getRoleCommissionRuleById(
  ruleId: string
): Promise<RoleCommissionRuleWithCreator | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('role_commission_rules')
    .select(`
      *,
      creator:users!role_commission_rules_created_by_fkey(id, full_name, email)
    `)
    .eq('id', ruleId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    ...data,
    creator: data.creator || undefined,
  } as RoleCommissionRuleWithCreator
}

/**
 * Create a new commission rule for a role
 */
export async function createRoleCommissionRule(
  dto: CreateRoleCommissionRuleDTO,
  userId: string
): Promise<RoleCommissionRule> {
  if (!supabase) throw new Error('Supabase not configured')

  const validation = validateCommissionConfiguration(dto.calculation_type, dto.configuration)
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
  }

  const { data, error } = await supabase
    .from('role_commission_rules')
    .insert({
      team_id: dto.team_id,
      role_id: dto.role_id,
      name: dto.name,
      calculation_type: dto.calculation_type,
      configuration: dto.configuration,
      priority: dto.priority ?? 0,
      notes: dto.notes || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  return data as RoleCommissionRule
}

/**
 * Update an existing role commission rule
 */
export async function updateRoleCommissionRule(
  ruleId: string,
  dto: UpdateRoleCommissionRuleDTO
): Promise<RoleCommissionRule> {
  if (!supabase) throw new Error('Supabase not configured')

  if (dto.calculation_type && dto.configuration) {
    const validation = validateCommissionConfiguration(dto.calculation_type, dto.configuration)
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }
  }

  const updatePayload: Record<string, unknown> = {}
  if (dto.name !== undefined) updatePayload.name = dto.name
  if (dto.calculation_type !== undefined) updatePayload.calculation_type = dto.calculation_type
  if (dto.configuration !== undefined) updatePayload.configuration = dto.configuration
  if (dto.is_active !== undefined) updatePayload.is_active = dto.is_active
  if (dto.priority !== undefined) updatePayload.priority = dto.priority
  if (dto.notes !== undefined) updatePayload.notes = dto.notes

  const { data, error } = await supabase
    .from('role_commission_rules')
    .update(updatePayload)
    .eq('id', ruleId)
    .select()
    .single()

  if (error) throw error

  return data as RoleCommissionRule
}

/**
 * Delete a role commission rule
 */
export async function deleteRoleCommissionRule(ruleId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('role_commission_rules')
    .delete()
    .eq('id', ruleId)

  if (error) throw error
}
