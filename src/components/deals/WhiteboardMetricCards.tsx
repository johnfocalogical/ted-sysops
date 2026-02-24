import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, CheckCircle2, PauseCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getDealMetrics, type DealStatusMetric } from '@/lib/dealService'
import { type DealStatus, DEAL_STATUS_LABELS } from '@/types/deal.types'

interface WhiteboardMetricCardsProps {
  teamId: string
  activeStatus: DealStatus | null
  onStatusClick: (status: DealStatus | null) => void
}

const STATUS_CARD_CONFIG: Record<
  DealStatus,
  {
    icon: typeof DollarSign
    borderColor: string
    iconColor: string
    activeBg: string
  }
> = {
  active: {
    icon: TrendingUp,
    borderColor: 'border-l-primary',
    iconColor: 'text-primary',
    activeBg: 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/40',
  },
  for_sale: {
    icon: ShoppingCart,
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-500',
    activeBg: 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400/40',
  },
  pending_sale: {
    icon: DollarSign,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-500',
    activeBg: 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400/40',
  },
  closed: {
    icon: CheckCircle2,
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-500',
    activeBg: 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400/40',
  },
  funded: {
    icon: CheckCircle2,
    borderColor: 'border-l-green-600',
    iconColor: 'text-green-600',
    activeBg: 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/40',
  },
  on_hold: {
    icon: PauseCircle,
    borderColor: 'border-l-orange-500',
    iconColor: 'text-orange-500',
    activeBg: 'bg-orange-50 dark:bg-orange-900/20 ring-2 ring-orange-400/40',
  },
  canceled: {
    icon: XCircle,
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-500',
    activeBg: 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-400/40',
  },
}

// The 6 statuses shown on the Whiteboard metric cards
const DISPLAYED_STATUSES: DealStatus[] = [
  'active',
  'for_sale',
  'pending_sale',
  'closed',
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

export function WhiteboardMetricCards({
  teamId,
  activeStatus,
  onStatusClick,
}: WhiteboardMetricCardsProps) {
  const [metrics, setMetrics] = useState<DealStatusMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const result = await getDealMetrics(teamId)
        if (!cancelled) setMetrics(result)
      } catch (err) {
        console.error('Error loading deal metrics:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [teamId])

  const metricsMap = new Map(metrics.map((m) => [m.status, m]))

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {DISPLAYED_STATUSES.map((status) => {
        const config = STATUS_CARD_CONFIG[status]
        const metric = metricsMap.get(status)
        const count = metric?.count ?? 0
        const profit = metric?.totalEstimatedProfit ?? 0
        const isActive = activeStatus === status
        const Icon = config.icon

        return (
          <Card
            key={status}
            className={cn(
              'border-l-4 cursor-pointer transition-all hover:shadow-md',
              config.borderColor,
              isActive && config.activeBg
            )}
            onClick={() => onStatusClick(isActive ? null : status)}
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
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
