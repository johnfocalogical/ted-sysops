import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { generateCommissionSummary } from '@/lib/commissionRuleService'
import { CALCULATION_TYPE_LABELS } from '@/types/commission.types'
import type { CommissionRuleWithCreator } from '@/types/commission.types'

interface CommissionRuleCardProps {
  rule: CommissionRuleWithCreator
  isAdmin: boolean
  onEdit?: (rule: CommissionRuleWithCreator) => void
  onDelete?: (rule: CommissionRuleWithCreator) => void
  onToggleActive?: (rule: CommissionRuleWithCreator) => void
}

export function CommissionRuleCard({
  rule,
  isAdmin,
  onEdit,
  onDelete,
  onToggleActive,
}: CommissionRuleCardProps) {
  const summary = generateCommissionSummary(rule)
  const effectiveFrom = new Date(rule.effective_date).toLocaleDateString()
  const effectiveUntil = rule.end_date
    ? new Date(rule.end_date).toLocaleDateString()
    : null

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

      {/* Date range */}
      <div className="text-xs text-muted-foreground">
        Effective {effectiveFrom}
        {effectiveUntil ? ` — ${effectiveUntil}` : ' — ongoing'}
      </div>

      {/* Notes */}
      {rule.notes && (
        <p className="text-xs text-muted-foreground italic">{rule.notes}</p>
      )}
    </div>
  )
}
