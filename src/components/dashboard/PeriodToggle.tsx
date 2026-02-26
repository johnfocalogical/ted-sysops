import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DashboardPeriod } from '@/types/dashboard.types'

interface PeriodToggleProps {
  value: DashboardPeriod
  onChange: (period: DashboardPeriod) => void
  options?: DashboardPeriod[]
}

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  mtd: 'MTD',
  qtd: 'QTD',
  ytd: 'YTD',
}

export function PeriodToggle({
  value,
  onChange,
  options = ['mtd', 'qtd', 'ytd'],
}: PeriodToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border bg-muted p-0.5">
      {options.map((period) => (
        <Button
          key={period}
          variant="ghost"
          size="sm"
          className={cn(
            'rounded-sm px-3 text-xs font-medium uppercase tracking-wider',
            value === period
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(period)}
        >
          {PERIOD_LABELS[period]}
        </Button>
      ))}
    </div>
  )
}
