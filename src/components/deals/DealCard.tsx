import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DealListItem, DealType } from '@/types/deal.types'
import { DEAL_TYPE_LABELS } from '@/types/deal.types'

interface DealCardProps {
  deal: DealListItem
  orgId: string
  teamId: string
}

const DEAL_TYPE_BADGE_STYLES: Record<DealType, string> = {
  wholesale:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
  listing:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  novation:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700',
  purchase:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
}

function formatCompactCurrency(value: number | null): string {
  if (value === null || value === undefined || value === 0) return '—'
  const absVal = Math.abs(value)
  const formatted =
    absVal >= 1_000_000
      ? `$${(absVal / 1_000_000).toFixed(1)}M`
      : absVal >= 1_000
        ? `$${(absVal / 1_000).toFixed(0)}K`
        : `$${absVal.toLocaleString()}`
  return value < 0 ? `-${formatted}` : formatted
}

export function DealCard({ deal, orgId, teamId }: DealCardProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const sellerName = deal.seller_contact
    ? `${deal.seller_contact.first_name} ${deal.seller_contact.last_name || ''}`.trim()
    : null

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={(e) => {
        // Only navigate if not dragging
        if (!isDragging) {
          e.stopPropagation()
          navigate(`/org/${orgId}/team/${teamId}/deals/${deal.id}`)
        }
      }}
    >
      <CardContent className="p-3">
        <p className="font-medium text-sm leading-tight mb-1.5 truncate">
          {deal.address}
        </p>

        <div className="flex items-center gap-1.5 mb-2">
          <Badge className={cn('text-[10px] px-1.5 py-0', DEAL_TYPE_BADGE_STYLES[deal.deal_type])}>
            {DEAL_TYPE_LABELS[deal.deal_type]}
          </Badge>
        </div>

        {sellerName && (
          <p className="text-xs text-muted-foreground truncate mb-1">
            {sellerName}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {deal.owner?.full_name || deal.owner?.email || ''}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCompactCurrency(deal.contract_price)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
