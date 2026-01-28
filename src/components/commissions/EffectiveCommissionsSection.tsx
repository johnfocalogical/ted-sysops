import { useState, useEffect } from 'react'
import { DollarSign, Loader2, Plus, Shield, ShieldAlert, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateCommissionSummary } from '@/lib/commissionRuleService'
import { getEffectiveCommissions } from '@/lib/effectiveCommissionService'
import { CALCULATION_TYPE_LABELS } from '@/types/commission.types'
import type { CommissionRule } from '@/types/commission.types'
import type { EffectiveCommissionRule } from '@/types/roleCommission.types'
import { CommissionOverrideFormModal } from './CommissionOverrideFormModal'
import { CommissionRuleFormModal } from './CommissionRuleFormModal'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface EffectiveCommissionsSectionProps {
  employeeProfileId: string
  teamMemberId: string
  teamId: string
  isAdmin: boolean
}

export function EffectiveCommissionsSection({
  employeeProfileId,
  teamMemberId,
  teamId,
  isAdmin,
}: EffectiveCommissionsSectionProps) {
  const { user } = useAuth()
  const [rules, setRules] = useState<EffectiveCommissionRule[]>([])
  const [loading, setLoading] = useState(true)

  // Override modal state
  const [overridingRule, setOverridingRule] = useState<EffectiveCommissionRule | null>(null)

  // Custom rule modal state
  const [showCustomForm, setShowCustomForm] = useState(false)

  const loadRules = async () => {
    setLoading(true)
    try {
      const data = await getEffectiveCommissions(employeeProfileId, teamMemberId)
      setRules(data)
    } catch (err) {
      console.error('Error loading effective commissions:', err)
      toast.error('Failed to load commission rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (employeeProfileId && teamMemberId) {
      loadRules()
    }
  }, [employeeProfileId, teamMemberId])

  // Group rules by source for display
  const roleRules = rules.filter((r) => r.source === 'role' || r.source === 'override')
  const customRules = rules.filter((r) => r.source === 'custom')

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Effective Commission Rules
            </span>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowCustomForm(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Custom Rule
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No commission rules. Assign a role with commission rules or add a custom rule.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Role-inherited rules */}
            {roleRules.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  From Roles
                </div>
                {roleRules.map((rule, index) => (
                  <EffectiveRuleCard
                    key={`role-${index}`}
                    rule={rule}
                    isAdmin={isAdmin}
                    onOverride={() => setOverridingRule(rule)}
                  />
                ))}
              </div>
            )}

            {/* Custom rules */}
            {customRules.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Custom Rules
                </div>
                {customRules.map((rule, index) => (
                  <EffectiveRuleCard
                    key={`custom-${index}`}
                    rule={rule}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Override Modal */}
      {user && overridingRule && overridingRule.roleCommissionRule && (
        <CommissionOverrideFormModal
          open={!!overridingRule}
          onOpenChange={(open) => !open && setOverridingRule(null)}
          employeeProfileId={employeeProfileId}
          teamId={teamId}
          roleCommissionRule={overridingRule.roleCommissionRule}
          roleName={overridingRule.roleName || ''}
          existingOverride={overridingRule.employeeOverride || null}
          userId={user.id}
          onSaved={loadRules}
        />
      )}

      {/* Custom Rule Modal */}
      {user && (
        <CommissionRuleFormModal
          open={showCustomForm}
          onOpenChange={setShowCustomForm}
          employeeProfileId={employeeProfileId}
          teamId={teamId}
          userId={user.id}
          onSaved={() => {
            loadRules()
          }}
        />
      )}
    </>
  )
}

// ============================================================================
// Effective Rule Card
// ============================================================================

interface EffectiveRuleCardProps {
  rule: EffectiveCommissionRule
  isAdmin: boolean
  onOverride?: () => void
}

function EffectiveRuleCard({ rule, isAdmin, onOverride }: EffectiveRuleCardProps) {
  // Build a CommissionRule-compatible object for summary generation
  const summaryRule = {
    name: rule.effectiveRule.name,
    calculation_type: rule.effectiveRule.calculation_type,
    configuration: rule.effectiveRule.configuration,
    is_active: rule.effectiveRule.is_active,
    priority: rule.effectiveRule.priority,
  } as CommissionRule

  const summary = generateCommissionSummary(summaryRule)

  const sourceIcon = rule.source === 'override' ? (
    <ShieldAlert className="h-3.5 w-3.5" />
  ) : rule.source === 'role' ? (
    <Shield className="h-3.5 w-3.5" />
  ) : null

  return (
    <div
      className={`rounded-lg border p-4 space-y-2 ${
        !rule.effectiveRule.is_active ? 'opacity-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{rule.effectiveRule.name}</span>
            <Badge
              variant="outline"
              className="text-xs border-teal-400 text-teal-700 dark:text-teal-400"
            >
              {CALCULATION_TYPE_LABELS[rule.effectiveRule.calculation_type]}
            </Badge>

            {/* Source badge */}
            {rule.source === 'role' && rule.roleName && (
              <Badge variant="outline" className="text-xs gap-1">
                {sourceIcon}
                {rule.roleName}
              </Badge>
            )}
            {rule.source === 'override' && (
              <Badge
                variant="outline"
                className="text-xs gap-1 border-amber-400 text-amber-700 dark:text-amber-400"
              >
                {sourceIcon}
                Override{rule.roleName ? ` (${rule.roleName})` : ''}
              </Badge>
            )}
            {rule.source === 'custom' && (
              <Badge variant="secondary" className="text-xs">
                Custom
              </Badge>
            )}

            {/* Expiration badge */}
            {rule.expiresAt && !rule.isExpired && (
              <Badge
                variant="outline"
                className="text-xs gap-1 border-purple-400 text-purple-700 dark:text-purple-400"
              >
                <Clock className="h-3 w-3" />
                Expires {new Date(rule.expiresAt).toLocaleDateString()}
              </Badge>
            )}

            {!rule.effectiveRule.is_active && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Override action */}
        {isAdmin && rule.source === 'role' && onOverride && (
          <Button size="sm" variant="outline" onClick={onOverride} className="shrink-0">
            Override
          </Button>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">{summary}</p>
    </div>
  )
}
