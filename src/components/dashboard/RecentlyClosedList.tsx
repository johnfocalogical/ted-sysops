import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DashboardRecentlyClosed } from '@/types/dashboard.types'

interface RecentlyClosedListProps {
  deals: DashboardRecentlyClosed[]
  loading: boolean
  onDealClick: (dealId: string) => void
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RecentlyClosedList({
  deals,
  loading,
  onDealClick,
}: RecentlyClosedListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-green-500" />
          <div>
            <CardTitle className="text-base">Recently Closed</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No deals closed in the last 30 days.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold uppercase text-xs tracking-wider">Deal</TableHead>
                <TableHead className="font-semibold uppercase text-xs tracking-wider">Closed</TableHead>
                <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Sale Price</TableHead>
                <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Net Profit</TableHead>
                <TableHead className="font-semibold uppercase text-xs tracking-wider">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.deal_id} className="hover:bg-muted/50 border-b border-border/50">
                  <TableCell>
                    <button
                      onClick={() => onDealClick(deal.deal_id)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {deal.address}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(deal.closed_date)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-right">
                    {deal.actual_sale_price ? formatCurrency(deal.actual_sale_price) : '—'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-sm font-medium tabular-nums text-right',
                      deal.net_profit > 0
                        ? 'text-green-600 dark:text-green-400'
                        : deal.net_profit < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    )}
                  >
                    {deal.net_profit != null
                      ? `${deal.net_profit >= 0 ? '+' : ''}${formatCurrency(deal.net_profit)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{deal.owner_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
