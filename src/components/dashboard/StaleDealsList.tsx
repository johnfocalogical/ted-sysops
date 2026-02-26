import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardStaleDeal } from '@/types/dashboard.types'
import { DEAL_STATUS_LABELS } from '@/types/deal.types'

interface StaleDealsListProps {
  staleDeals: DashboardStaleDeal[]
  loading: boolean
  onDealClick: (dealId: string) => void
}

function staleDaysColor(days: number): string {
  if (days >= 14) return 'text-red-600 dark:text-red-400'
  if (days >= 7) return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}

function staleDaysLabel(days: number): string {
  if (days === 0) return 'No activity'
  return `${days}d inactive`
}

export function StaleDealsList({
  staleDeals,
  loading,
  onDealClick,
}: StaleDealsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Needs Attention</CardTitle>
          {!loading && staleDeals.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
              {staleDeals.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : staleDeals.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">All deals have recent activity.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {staleDeals.map((deal) => (
              <div
                key={deal.deal_id}
                className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
              >
                <button
                  onClick={() => onDealClick(deal.deal_id)}
                  className="text-sm font-medium text-primary hover:underline truncate max-w-[200px]"
                >
                  {deal.address}
                </button>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {DEAL_STATUS_LABELS[deal.status]}
                </Badge>
                <span className={cn('text-xs font-medium ml-auto shrink-0', staleDaysColor(deal.days_since_activity))}>
                  {staleDaysLabel(deal.days_since_activity)}
                </span>
                <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[100px]">
                  {deal.owner_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
