import { BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function EarningsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Earnings History Coming Soon</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        This section will show your deal-by-deal commission earnings, payout history,
        and period totals once deal tracking is available.
      </p>
      <Badge variant="outline" className="text-xs">
        Requires Deal Tracking
      </Badge>
    </div>
  )
}
