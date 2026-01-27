import { supabase } from './supabase'
import type {
  CommissionRule,
  CommissionRuleWithCreator,
  CommissionCalculationType,
  CommissionConfiguration,
  CreateCommissionRuleDTO,
  UpdateCommissionRuleDTO,
  FlatFeeConfig,
  PercentageGrossConfig,
  PercentageNetConfig,
  TieredConfig,
  RoleBasedConfig,
} from '@/types/commission.types'

// ============================================================================
// Commission Rule Service
// CRUD operations for employee commission rules
// ============================================================================

/**
 * Get all commission rules for an employee profile, ordered by priority then date
 */
export async function getCommissionRulesForEmployee(
  employeeProfileId: string
): Promise<CommissionRuleWithCreator[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('commission_rules')
    .select(`
      *,
      creator:users!commission_rules_created_by_fkey(id, full_name, email)
    `)
    .eq('employee_profile_id', employeeProfileId)
    .order('priority', { ascending: false })
    .order('effective_date', { ascending: false })

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    creator: row.creator || undefined,
  })) as CommissionRuleWithCreator[]
}

/**
 * Get a single commission rule by ID
 */
export async function getCommissionRuleById(
  ruleId: string
): Promise<CommissionRuleWithCreator | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('commission_rules')
    .select(`
      *,
      creator:users!commission_rules_created_by_fkey(id, full_name, email)
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
  } as CommissionRuleWithCreator
}

/**
 * Create a new commission rule
 */
export async function createCommissionRule(
  dto: CreateCommissionRuleDTO,
  userId: string
): Promise<CommissionRule> {
  if (!supabase) throw new Error('Supabase not configured')

  // Validate configuration
  const validation = validateCommissionConfiguration(dto.calculation_type, dto.configuration)
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
  }

  const { data, error } = await supabase
    .from('commission_rules')
    .insert({
      team_id: dto.team_id,
      employee_profile_id: dto.employee_profile_id,
      name: dto.name,
      calculation_type: dto.calculation_type,
      configuration: dto.configuration,
      effective_date: dto.effective_date,
      end_date: dto.end_date || null,
      priority: dto.priority ?? 0,
      notes: dto.notes || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  return data as CommissionRule
}

/**
 * Update an existing commission rule
 */
export async function updateCommissionRule(
  ruleId: string,
  dto: UpdateCommissionRuleDTO
): Promise<CommissionRule> {
  if (!supabase) throw new Error('Supabase not configured')

  // Validate configuration if both type and config provided
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
  if (dto.effective_date !== undefined) updatePayload.effective_date = dto.effective_date
  if (dto.end_date !== undefined) updatePayload.end_date = dto.end_date
  if (dto.is_active !== undefined) updatePayload.is_active = dto.is_active
  if (dto.priority !== undefined) updatePayload.priority = dto.priority
  if (dto.notes !== undefined) updatePayload.notes = dto.notes

  const { data, error } = await supabase
    .from('commission_rules')
    .update(updatePayload)
    .eq('id', ruleId)
    .select()
    .single()

  if (error) throw error

  return data as CommissionRule
}

/**
 * Delete a commission rule
 */
export async function deleteCommissionRule(ruleId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('commission_rules')
    .delete()
    .eq('id', ruleId)

  if (error) throw error
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate commission configuration matches the expected shape for a given type
 */
export function validateCommissionConfiguration(
  type: CommissionCalculationType,
  config: CommissionConfiguration
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (type) {
    case 'flat_fee': {
      const c = config as FlatFeeConfig
      if (typeof c.amount !== 'number' || c.amount <= 0) {
        errors.push('Amount must be greater than 0')
      }
      if (c.minimum_deal_profit !== undefined && c.minimum_deal_profit < 0) {
        errors.push('Minimum deal profit must be 0 or greater')
      }
      break
    }

    case 'percentage_gross':
    case 'percentage_net': {
      const c = config as PercentageGrossConfig | PercentageNetConfig
      if (typeof c.percentage !== 'number' || c.percentage <= 0 || c.percentage > 100) {
        errors.push('Percentage must be between 0 and 100')
      }
      if (c.cap !== undefined && c.cap <= 0) {
        errors.push('Cap must be greater than 0')
      }
      break
    }

    case 'tiered': {
      const c = config as TieredConfig
      if (!['gross', 'net'].includes(c.profit_basis)) {
        errors.push('Profit basis must be "gross" or "net"')
      }
      if (!Array.isArray(c.tiers) || c.tiers.length === 0) {
        errors.push('At least one tier bracket is required')
      } else {
        let prevThreshold = -1
        for (let i = 0; i < c.tiers.length; i++) {
          const tier = c.tiers[i]
          if (typeof tier.threshold !== 'number' || tier.threshold < 0) {
            errors.push(`Tier ${i + 1}: threshold must be 0 or greater`)
          }
          if (tier.threshold <= prevThreshold) {
            errors.push(`Tier ${i + 1}: threshold must be greater than previous tier`)
          }
          if (typeof tier.percentage !== 'number' || tier.percentage <= 0 || tier.percentage > 100) {
            errors.push(`Tier ${i + 1}: percentage must be between 0 and 100`)
          }
          prevThreshold = tier.threshold
        }
      }
      break
    }

    case 'role_based': {
      const c = config as RoleBasedConfig
      if (!c.base_calculation || !['percentage_gross', 'percentage_net'].includes(c.base_calculation.type)) {
        errors.push('Base calculation type must be "percentage_gross" or "percentage_net"')
      }
      if (
        !c.base_calculation ||
        typeof c.base_calculation.percentage !== 'number' ||
        c.base_calculation.percentage <= 0 ||
        c.base_calculation.percentage > 100
      ) {
        errors.push('Base percentage must be between 0 and 100')
      }
      if (!c.role_multipliers || Object.keys(c.role_multipliers).length === 0) {
        errors.push('At least one role multiplier is required')
      } else {
        for (const [role, multiplier] of Object.entries(c.role_multipliers)) {
          if (typeof multiplier !== 'number' || multiplier <= 0) {
            errors.push(`Role "${role}": multiplier must be greater than 0`)
          }
        }
      }
      break
    }

    default:
      errors.push(`Unknown calculation type: ${type}`)
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Generate a human-readable summary for a commission rule
 */
export function generateCommissionSummary(rule: CommissionRule): string {
  const config = rule.configuration

  switch (rule.calculation_type) {
    case 'flat_fee': {
      const c = config as FlatFeeConfig
      let summary = `Flat fee of ${formatCurrency(c.amount)} per deal`
      if (c.minimum_deal_profit) {
        summary += ` (min. deal profit: ${formatCurrency(c.minimum_deal_profit)})`
      }
      return summary
    }

    case 'percentage_gross': {
      const c = config as PercentageGrossConfig
      let summary = `${c.percentage}% of gross profit`
      if (c.cap) {
        summary += ` (capped at ${formatCurrency(c.cap)})`
      }
      return summary
    }

    case 'percentage_net': {
      const c = config as PercentageNetConfig
      let summary = `${c.percentage}% of net profit`
      if (c.cap) {
        summary += ` (capped at ${formatCurrency(c.cap)})`
      }
      return summary
    }

    case 'tiered': {
      const c = config as TieredConfig
      const basisLabel = c.profit_basis === 'gross' ? 'gross' : 'net'
      const tierParts = c.tiers.map((tier, i) => {
        if (i === c.tiers.length - 1 && c.tiers.length > 1) {
          return `${tier.percentage}% above`
        }
        return `${tier.percentage}% up to ${formatCurrency(tier.threshold)}`
      })
      return `Tiered (${basisLabel} profit): ${tierParts.join(' / ')}`
    }

    case 'role_based': {
      const c = config as RoleBasedConfig
      const basisLabel = c.base_calculation.type === 'percentage_gross' ? 'gross' : 'net'
      const multiplierParts = Object.entries(c.role_multipliers)
        .map(([role, mult]) => `${role}: ${mult}×`)
        .join(', ')
      return `Role-based: ${c.base_calculation.percentage}% of ${basisLabel} profit × multiplier (${multiplierParts})`
    }

    default:
      return 'Unknown calculation type'
  }
}
