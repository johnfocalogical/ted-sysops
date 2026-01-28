import { supabase } from './supabase'
import type { CommissionRuleWithCreator } from '@/types/commission.types'
import type { RoleCommissionRule, EffectiveCommissionRule } from '@/types/roleCommission.types'

// ============================================================================
// Effective Commission Service
// Resolves the effective commission rules for an employee by merging
// role-inherited rules with employee-level overrides
// ============================================================================

interface RoleWithCommissions {
  id: string
  name: string
  commissionRules: RoleCommissionRule[]
}

/**
 * Get the effective commission rules for an employee.
 *
 * Resolution logic:
 * 1. Fetch all roles assigned to the employee (via team_member_roles)
 * 2. Fetch all role_commission_rules for those roles
 * 3. Fetch all commission_rules for the employee
 * 4. For each role commission rule:
 *    - If employee has an override (matching role_commission_rule_id) that is not expired, use override
 *    - Otherwise use the role rule as-is
 * 5. Any employee rules without role_commission_rule_id are treated as custom rules
 */
export async function getEffectiveCommissions(
  employeeProfileId: string,
  teamMemberId: string
): Promise<EffectiveCommissionRule[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // 1. Fetch employee's roles and their commission rules
  const rolesWithCommissions = await fetchRolesWithCommissions(teamMemberId)

  // 2. Fetch employee-level commission rules (overrides + custom)
  const employeeRules = await fetchEmployeeCommissionRules(employeeProfileId)

  // 3. Build a map of employee overrides keyed by role_commission_rule_id
  const overrideMap = new Map<string, CommissionRuleWithCreator>()
  const customRules: CommissionRuleWithCreator[] = []

  for (const rule of employeeRules) {
    if (rule.role_commission_rule_id) {
      overrideMap.set(rule.role_commission_rule_id, rule)
    } else {
      customRules.push(rule)
    }
  }

  const effectiveRules: EffectiveCommissionRule[] = []
  const now = new Date()

  // 4. Resolve each role commission rule
  for (const role of rolesWithCommissions) {
    for (const roleRule of role.commissionRules) {
      const override = overrideMap.get(roleRule.id)

      if (override) {
        const isExpired = override.expires_at ? new Date(override.expires_at) < now : false

        if (isExpired) {
          // Override expired — fall back to role rule
          effectiveRules.push({
            source: 'role',
            roleName: role.name,
            roleCommissionRule: roleRule,
            effectiveRule: {
              name: roleRule.name,
              calculation_type: roleRule.calculation_type,
              configuration: roleRule.configuration,
              is_active: roleRule.is_active,
              priority: roleRule.priority,
            },
          })
        } else {
          // Active override
          effectiveRules.push({
            source: 'override',
            roleName: role.name,
            roleCommissionRule: roleRule,
            employeeOverride: override,
            effectiveRule: {
              name: override.name,
              calculation_type: override.calculation_type,
              configuration: override.configuration,
              is_active: override.is_active,
              priority: override.priority,
            },
            expiresAt: override.expires_at || undefined,
            isExpired: false,
          })
        }
      } else {
        // No override — use role rule directly
        effectiveRules.push({
          source: 'role',
          roleName: role.name,
          roleCommissionRule: roleRule,
          effectiveRule: {
            name: roleRule.name,
            calculation_type: roleRule.calculation_type,
            configuration: roleRule.configuration,
            is_active: roleRule.is_active,
            priority: roleRule.priority,
          },
        })
      }
    }
  }

  // 5. Add custom employee rules (no role_commission_rule_id)
  for (const rule of customRules) {
    effectiveRules.push({
      source: 'custom',
      employeeOverride: rule,
      effectiveRule: {
        name: rule.name,
        calculation_type: rule.calculation_type,
        configuration: rule.configuration,
        is_active: rule.is_active,
        priority: rule.priority,
      },
    })
  }

  return effectiveRules
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function fetchRolesWithCommissions(
  teamMemberId: string
): Promise<RoleWithCommissions[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get role IDs assigned to this team member
  const { data: memberRoles, error: mrError } = await supabase
    .from('team_member_roles')
    .select('role_id')
    .eq('team_member_id', teamMemberId)

  if (mrError) throw mrError
  if (!memberRoles || memberRoles.length === 0) return []

  const roleIds = memberRoles.map((mr) => mr.role_id)

  // Get roles with their names
  const { data: roles, error: rolesError } = await supabase
    .from('team_roles')
    .select('id, name')
    .in('id', roleIds)

  if (rolesError) throw rolesError
  if (!roles || roles.length === 0) return []

  // Get all commission rules for these roles
  const { data: commRules, error: crError } = await supabase
    .from('role_commission_rules')
    .select('*')
    .in('role_id', roleIds)
    .order('priority', { ascending: false })

  if (crError) throw crError

  // Group commission rules by role
  const rulesByRole = new Map<string, RoleCommissionRule[]>()
  for (const rule of commRules || []) {
    const existing = rulesByRole.get(rule.role_id) || []
    existing.push(rule as RoleCommissionRule)
    rulesByRole.set(rule.role_id, existing)
  }

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    commissionRules: rulesByRole.get(role.id) || [],
  }))
}

async function fetchEmployeeCommissionRules(
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

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    creator: row.creator || undefined,
  })) as CommissionRuleWithCreator[]
}
