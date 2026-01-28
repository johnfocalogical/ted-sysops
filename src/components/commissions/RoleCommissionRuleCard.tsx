import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { generateCommissionSummary } from '@/lib/commissionRuleService'
import { CALCULATION_TYPE_LABELS } from '@/types/commission.types'
import type { CommissionRule } from '@/types/commission.types'
import type { RoleCommissionRuleWithCreator } from '@/types/roleCommission.types'

interface RoleCommissionRuleCardProps {
  rule: RoleCommissionRuleWithCreator
  isAdmin: boolean
  onEdit?: (rule: RoleCommissionRuleWithCreator) => void
  onDelete?: (rule: RoleCommissionRuleWithCreator) => void
  onToggleActive?: (rule: RoleCommissionRuleWithCreator) => void
}

export function RoleCommissionRuleCard({
  rule,
  isAdmin,
  onEdit,
  onDelete,
  onToggleActive,
}: RoleCommissionRuleCardProps) {
  // Adapt role commission rule to CommissionRule shape for summary generation
  const asCommissionRule = {
    ...rule,
    employee_profile_id: '',
    deal_type_filter: null,
    deal_role_filter: null,
    effective_date: rule.created_at,
    end_date: null,
    role_commission_rule_id: null,
    expires_at: null,
  } as CommissionRule

  const summary = generateCommissionSummary(asCommissionRule)

  return (
    <div
      className={`rounded-lg border p-4 space-y-2 ${
        !rule.is_active ? 'opacity-50' : ''
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{rule.name}</span>
            <Badge
              variant="outline"
              className="text-xs border-teal-400 text-teal-700 dark:text-teal-400"
            >
              {CALCULATION_TYPE_LABELS[rule.calculation_type]}
            </Badge>
            {!rule.is_active && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
            {rule.priority > 0 && (
              <Badge variant="outline" className="text-xs">
                Priority {rule.priority}
              </Badge>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <Switch
              checked={rule.is_active}
              onCheckedChange={() => onToggleActive?.(rule)}
              aria-label={`Toggle ${rule.name}`}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(rule)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(rule)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">{summary}</p>

      {/* Notes */}
      {rule.notes && (
        <p className="text-xs text-muted-foreground italic">{rule.notes}</p>
      )}
    </div>
  )
}
