import { DollarSign, TrendingUp, Receipt, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface FinancialSummaryCardsProps {
  pipelineValue?: number
  closedRevenue?: number
  closedRevenueMtd?: number
  closedRevenueQtd?: number
  estimatedCommissions?: number
  totalExpenses?: number
  netProfit?: number
  loading: boolean
  showRevenuePeriodToggle?: boolean
  revenuePeriod?: 'mtd' | 'qtd'
  onRevenuePeriodChange?: (period: 'mtd' | 'qtd') => void
}

function formatCurrency(value: number): string {
  if (value === 0) return '$0'
  const absVal = Math.abs(value)
  const formatted = absVal.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return value < 0 ? `-${formatted.replace('-', '')}` : formatted
}

interface MetricCardProps {
  label: string
  value: number
  icon: typeof DollarSign
  colorClass: string
  loading: boolean
  extra?: React.ReactNode
}

function MetricCard({ label, value, icon: Icon, colorClass, loading, extra }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="border-l-4 border-l-muted">
        <CardContent className="pt-6 pb-4">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-9 w-32 mb-2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground opacity-40" />
        </div>
        <p className={cn('text-2xl font-bold tabular-nums', colorClass)}>
          {formatCurrency(value)}
        </p>
        {extra}
      </CardContent>
    </Card>
  )
}

export function FinancialSummaryCards({
  pipelineValue,
  closedRevenue,
  closedRevenueMtd,
  closedRevenueQtd,
  estimatedCommissions,
  totalExpenses,
  netProfit,
  loading,
  showRevenuePeriodToggle,
  revenuePeriod = 'mtd',
  onRevenuePeriodChange,
}: FinancialSummaryCardsProps) {
  // Determine which revenue to show
  const revenueValue =
    closedRevenue ??
    (revenuePeriod === 'qtd' ? closedRevenueQtd : closedRevenueMtd) ??
    0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label={netProfit !== undefined ? 'Total Pipeline Value' : 'Pipeline Value'}
        value={pipelineValue ?? 0}
        icon={TrendingUp}
        colorClass="text-primary"
        loading={loading}
      />

      <MetricCard
        label="Closed Revenue"
        value={revenueValue}
        icon={DollarSign}
        colorClass="text-green-600 dark:text-green-400"
        loading={loading}
        extra={
          showRevenuePeriodToggle && onRevenuePeriodChange ? (
            <div className="mt-2 flex gap-1">
              {(['mtd', 'qtd'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onRevenuePeriodChange(p)}
                  className={cn(
                    'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded',
                    revenuePeriod === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {estimatedCommissions !== undefined ? (
        <MetricCard
          label="My Commissions"
          value={estimatedCommissions}
          icon={Wallet}
          colorClass="text-primary"
          loading={loading}
        />
      ) : null}

      <MetricCard
        label="Total Expenses"
        value={totalExpenses ?? 0}
        icon={Receipt}
        colorClass="text-red-600 dark:text-red-400"
        loading={loading}
      />

      {netProfit !== undefined ? (
        <MetricCard
          label="Net Profit"
          value={netProfit}
          icon={DollarSign}
          colorClass={netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          loading={loading}
        />
      ) : null}
    </div>
  )
}
