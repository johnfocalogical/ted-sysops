import { useNavigate, useParams } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DEAL_STATUS_LABELS, DEAL_TYPE_LABELS } from '@/types/deal.types'
import type { DealReference } from '@/types/comms.types'
import type { DealStatus, DealType } from '@/types/deal.types'

const STATUS_COLORS: Record<string, string> = {
  active:
    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700',
  for_sale:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  pending_sale:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
  closed:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
  funded:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
  on_hold:
    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700',
  canceled:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
}

interface DealReferenceCardProps {
  reference: DealReference
}

export function DealReferenceCard({ reference }: DealReferenceCardProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()

  const statusLabel =
    DEAL_STATUS_LABELS[reference.status as DealStatus] ?? reference.status
  const statusColor = STATUS_COLORS[reference.status] ?? STATUS_COLORS.active
  const typeLabel =
    DEAL_TYPE_LABELS[reference.deal_type as DealType] ?? reference.deal_type

  const handleClick = () => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/deals/${reference.deal_id}`)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left max-w-[280px]"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium truncate">{reference.address}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${statusColor} text-[10px] px-1.5 py-0`}>
            {statusLabel}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{typeLabel}</span>
        </div>
        {reference.projected_profit != null && (
          <p className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
            +${reference.projected_profit.toLocaleString()}
          </p>
        )}
      </div>
    </button>
  )
}

interface DealReferenceCardsProps {
  references: DealReference[]
}

export function DealReferenceCards({ references }: DealReferenceCardsProps) {
  if (references.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {references.map((ref) => (
        <DealReferenceCard key={ref.deal_id} reference={ref} />
      ))}
    </div>
  )
}
