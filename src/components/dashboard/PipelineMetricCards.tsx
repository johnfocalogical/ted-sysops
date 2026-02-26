import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardPipelineItem } from '@/types/dashboard.types'
import { type DealStatus, DEAL_STATUS_LABELS } from '@/types/deal.types'

interface PipelineMetricCardsProps {
  data: DashboardPipelineItem[]
  loading: boolean
  onStatusClick?: (status: DealStatus) => void
  periodLabel?: string
}

const STATUS_CARD_CONFIG: Record<
  DealStatus,
  {
    icon: typeof DollarSign
    borderColor: string
    iconColor: string
  }
> = {
  active: {
    icon: TrendingUp,
    borderColor: 'border-l-primary',
    iconColor: 'text-primary',
  },
  for_sale: {
    icon: ShoppingCart,
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-500',
  },
  pending_sale: {
    icon: DollarSign,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-500',
  },
  closed: {
    icon: CheckCircle2,
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-500',
  },
  funded: {
    icon: CheckCircle2,
    borderColor: 'border-l-green-600',
    iconColor: 'text-green-600',
  },
  on_hold: {
    icon: PauseCircle,
    borderColor: 'border-l-orange-500',
    iconColor: 'text-orange-500',
  },
  canceled: {
    icon: XCircle,
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-500',
  },
}

const DISPLAYED_STATUSES: DealStatus[] = [
  'active',
  'for_sale',
  'pending_sale',
  'closed',
  'funded',
  'on_hold',
  'canceled',
]

function formatCurrency(value: number): string {
  if (value === 0) return '$0'
  const absVal = Math.abs(value)
  const formatted =
    absVal >= 1_000_000
      ? `$${(absVal / 1_000_000).toFixed(1)}M`
      : absVal >= 1_000
        ? `$${(absVal / 1_000).toFixed(0)}K`
        : `$${absVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return value < 0 ? `-${formatted}` : formatted
}

export function PipelineMetricCards({
  data,
  loading,
  onStatusClick,
  periodLabel,
}: PipelineMetricCardsProps) {
  const dataMap = new Map(data.map((d) => [d.status, d]))

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {DISPLAYED_STATUSES.map((status) => (
          <Card key={status} className="border-l-4 border-l-muted">
            <CardContent className="pt-5 pb-4">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
      {DISPLAYED_STATUSES.map((status) => {
        const config = STATUS_CARD_CONFIG[status]
        const item = dataMap.get(status)
        const count = item?.deal_count ?? 0
        const isClosed = status === 'closed' || status === 'funded'
        const profit = isClosed
          ? (item?.total_actual_profit ?? 0)
          : (item?.total_projected_profit ?? 0)
        const Icon = config.icon

        return (
          <Card
            key={status}
            className={cn(
              'border-l-4 transition-all hover:shadow-md',
              config.borderColor,
              onStatusClick && 'cursor-pointer'
            )}
            onClick={() => onStatusClick?.(status)}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {DEAL_STATUS_LABELS[status]}
                </p>
                <Icon className={cn('h-4 w-4 opacity-40', config.iconColor)} />
              </div>
              <p className="text-2xl font-bold tabular-nums">{count}</p>
              <p
                className={cn(
                  'text-sm font-medium tabular-nums',
                  profit > 0 ? 'text-success' : profit < 0 ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {formatCurrency(profit)}
                {periodLabel && (
                  <span className="text-xs text-muted-foreground ml-1">{periodLabel}</span>
                )}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
