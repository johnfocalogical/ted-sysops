import { useNavigate, useParams } from 'react-router-dom'
import { Building2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { DEAL_STATUS_LABELS } from '@/types/deal.types'
import type { DealStatus } from '@/types/deal.types'
import type { DealSnapshot } from '@/types/comms.types'

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

function formatSnapshotTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface DealSnapshotCardProps {
  snapshot: DealSnapshot
}

export function DealSnapshotCard({ snapshot }: DealSnapshotCardProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()

  const statusLabel =
    DEAL_STATUS_LABELS[snapshot.status as DealStatus] ?? snapshot.status
  const statusColor = STATUS_COLORS[snapshot.status] ?? STATUS_COLORS.active

  const handleClick = () => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/deals/${snapshot.deal_id}`)
    }
  }

  const financialEntries = Object.entries(snapshot.financial_summary)
  const progressPercent = Math.round(snapshot.checklist_progress * 100)

  return (
    <button
      onClick={handleClick}
      className="block w-full max-w-[360px] rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors text-left mt-2"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-3 py-2.5 border-b border-border">
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{snapshot.address}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={`${statusColor} text-[10px] px-1.5 py-0`}>
              {statusLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Financial summary */}
      {financialEntries.length > 0 && (
        <div className="px-3 py-2 space-y-1 border-b border-border">
          {financialEntries.map(([label, amount]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  amount >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {amount >= 0 ? '+' : '-'}${Math.abs(amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Checklist progress + assigned employees */}
      <div className="px-3 py-2 flex items-center justify-between gap-3">
        {/* Checklist progress */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
            {progressPercent}%
          </span>
        </div>

        {/* Assigned employees */}
        {snapshot.assigned_employees.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {snapshot.assigned_employees.slice(0, 3).map((name, i) => (
              <Avatar key={i} className="h-5 w-5 border border-background">
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {snapshot.assigned_employees.length > 3 && (
              <span className="text-[9px] text-muted-foreground ml-1.5">
                +{snapshot.assigned_employees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Snapshot timestamp */}
      <div className="px-3 py-1.5 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Snapshot from {formatSnapshotTime(snapshot.captured_at)}
        </p>
      </div>
    </button>
  )
}
