// ============================================================================
// Role Commission Rule Types
// Commission structures attached to roles, inherited by employees via role assignment
// ============================================================================

import type {
  CommissionCalculationType,
  CommissionConfiguration,
  CommissionRule,
} from './commission.types'

// ============================================================================
// Database Row Types
// ============================================================================

// Role-level commission rule (attached to a team_role)
export interface RoleCommissionRule {
  id: string
  team_id: string
  role_id: string
  name: string
  calculation_type: CommissionCalculationType
  configuration: CommissionConfiguration
  is_active: boolean
  priority: number
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// With creator details
export interface RoleCommissionRuleWithCreator extends RoleCommissionRule {
  creator?: {
    id: string
    full_name: string | null
    email: string
  }
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateRoleCommissionRuleDTO {
  team_id: string
  role_id: string
  name: string
  calculation_type: CommissionCalculationType
  configuration: CommissionConfiguration
  priority?: number
  notes?: string | null
}

export interface UpdateRoleCommissionRuleDTO {
  name?: string
  calculation_type?: CommissionCalculationType
  configuration?: CommissionConfiguration
  is_active?: boolean
  priority?: number
  notes?: string | null
}

// ============================================================================
// Effective Commission (resolved view for an employee)
// ============================================================================

// Represents a single resolved commission rule for an employee
export interface EffectiveCommissionRule {
  // Where this rule came from
  source: 'role' | 'override' | 'custom'

  // Role context (for role-inherited and overridden rules)
  roleName?: string
  roleCommissionRule?: RoleCommissionRule

  // Employee override (if source is 'override')
  employeeOverride?: CommissionRule

  // The actual rule to display and use for calculations
  effectiveRule: {
    name: string
    calculation_type: CommissionCalculationType
    configuration: CommissionConfiguration
    is_active: boolean
    priority: number
  }

  // Expiration info (for overrides with time limits)
  expiresAt?: string
  isExpired?: boolean
}
