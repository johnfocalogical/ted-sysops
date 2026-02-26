import { CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardDeadline } from '@/types/dashboard.types'
import { DEAL_STATUS_LABELS } from '@/types/deal.types'

interface DeadlinesListProps {
  deadlines: DashboardDeadline[]
  loading: boolean
  daysAhead: number
  onDaysChange: (days: number) => void
  onDealClick: (dealId: string) => void
}

const DAYS_OPTIONS = [7, 14, 30]

const TITLE_MAP: Record<number, string> = {
  7: 'Deadlines This Week',
  14: 'Deadlines Next 2 Weeks',
  30: 'Deadlines Next 30 Days',
}

const DEADLINE_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  dd_expiration: {
    label: 'DD Expiration',
    className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  },
  closing_date: {
    label: 'Closing Date',
    className: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700',
  },
  extended_closing: {
    label: 'Extended Closing',
    className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysRemainingLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

function daysRemainingColor(days: number): string {
  if (days <= 3) return 'text-red-600 dark:text-red-400'
  if (days <= 7) return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}

export function DeadlinesList({
  deadlines,
  loading,
  daysAhead,
  onDaysChange,
  onDealClick,
}: DeadlinesListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{TITLE_MAP[daysAhead] ?? 'Upcoming Deadlines'}</CardTitle>
            {!loading && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {deadlines.length}
              </Badge>
            )}
          </div>
          <div className="inline-flex items-center rounded-md border bg-muted p-0.5">
            {DAYS_OPTIONS.map((d) => (
              <Button
                key={d}
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-sm px-2 h-7 text-xs',
                  daysAhead === d
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onDaysChange(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : deadlines.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming deadlines — you're clear.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {deadlines.map((dl, idx) => {
              const typeConfig = DEADLINE_TYPE_CONFIG[dl.deadline_type]
              return (
                <div
                  key={`${dl.deal_id}-${dl.deadline_type}-${idx}`}
                  className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  <button
                    onClick={() => onDealClick(dl.deal_id)}
                    className="text-sm font-medium text-primary hover:underline truncate max-w-[200px]"
                  >
                    {dl.address}
                  </button>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] shrink-0', typeConfig?.className)}
                  >
                    {typeConfig?.label ?? dl.deadline_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(dl.deadline_date)}
                  </span>
                  <span className={cn('text-xs font-medium ml-auto shrink-0', daysRemainingColor(dl.days_remaining))}>
                    {daysRemainingLabel(dl.days_remaining)}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {DEAL_STATUS_LABELS[dl.status]}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
