// ============================================================================
// Commission Rule Types
// Flexible commission structures per employee profile
// ============================================================================

// Calculation type enum matching database
export type CommissionCalculationType =
  | 'flat_fee'
  | 'percentage_gross'
  | 'percentage_net'
  | 'tiered'
  | 'role_based'

// Human-readable labels for each type
export const CALCULATION_TYPE_LABELS: Record<CommissionCalculationType, string> = {
  flat_fee: 'Flat Fee',
  percentage_gross: '% of Gross Profit',
  percentage_net: '% of Net Profit',
  tiered: 'Tiered',
  role_based: 'Role-Based',
}

// ============================================================================
// Configuration Variants (JSONB shapes)
// ============================================================================

export interface FlatFeeConfig {
  amount: number
  minimum_deal_profit?: number
}

export interface PercentageGrossConfig {
  percentage: number
  cap?: number
}

export interface PercentageNetConfig {
  percentage: number
  cap?: number
}

export interface TierBracket {
  threshold: number
  percentage: number
}

export interface TieredConfig {
  profit_basis: 'gross' | 'net'
  tiers: TierBracket[]
}

export interface RoleBasedConfig {
  base_calculation: {
    type: 'percentage_gross' | 'percentage_net'
    percentage: number
  }
  role_multipliers: Record<string, number>
}

// Union of all configuration types
export type CommissionConfiguration =
  | FlatFeeConfig
  | PercentageGrossConfig
  | PercentageNetConfig
  | TieredConfig
  | RoleBasedConfig

// ============================================================================
// Database Row Types
// ============================================================================

// Base commission rule matching commission_rules table
export interface CommissionRule {
  id: string
  team_id: string
  employee_profile_id: string
  name: string
  calculation_type: CommissionCalculationType
  configuration: CommissionConfiguration
  deal_type_filter: string[] | null
  deal_role_filter: string[] | null
  effective_date: string
  end_date: string | null
  is_active: boolean
  priority: number
  notes: string | null
  role_commission_rule_id: string | null
  expires_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// Commission rule with creator user details
export interface CommissionRuleWithCreator extends CommissionRule {
  creator?: {
    id: string
    full_name: string | null
    email: string
  }
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateCommissionRuleDTO {
  team_id: string
  employee_profile_id: string
  name: string
  calculation_type: CommissionCalculationType
  configuration: CommissionConfiguration
  effective_date: string
  end_date?: string | null
  priority?: number
  notes?: string | null
  role_commission_rule_id?: string
  expires_at?: string | null
}

export interface UpdateCommissionRuleDTO {
  name?: string
  calculation_type?: CommissionCalculationType
  configuration?: CommissionConfiguration
  effective_date?: string
  end_date?: string | null
  is_active?: boolean
  priority?: number
  notes?: string | null
  expires_at?: string | null
}
