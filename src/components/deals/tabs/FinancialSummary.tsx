import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { DealWithDetails, DealExpense } from '@/types/deal.types'

interface FinancialSummaryProps {
  deal: DealWithDetails
  expenses: DealExpense[]
  totalCommissions: number
}

interface MetricCardProps {
  label: string
  value: number | null
  variant?: 'default' | 'profit' | 'loss' | 'neutral'
}

function MetricCard({ label, value, variant = 'default' }: MetricCardProps) {
  const formatted =
    value != null
      ? `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—'

  const isNegative = value != null && value < 0
  const prefix = isNegative ? '-' : value != null && value > 0 ? '+' : ''

  let colorClass = 'text-foreground'
  let Icon = DollarSign

  if (variant === 'profit' || (variant === 'default' && value != null && value > 0)) {
    colorClass = 'text-green-600 dark:text-green-400'
    Icon = TrendingUp
  } else if (variant === 'loss' || (variant === 'default' && value != null && value < 0)) {
    colorClass = 'text-red-600 dark:text-red-400'
    Icon = TrendingDown
  } else if (variant === 'neutral') {
    colorClass = 'text-muted-foreground'
    Icon = Minus
  }

  return (
    <div className="p-4 border rounded-lg bg-background space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${colorClass}`}>
        {value != null ? `${prefix}${formatted}` : formatted}
      </div>
    </div>
  )
}

export function FinancialSummary({ deal, expenses, totalCommissions }: FinancialSummaryProps) {
  // Source data
  const contractPrice = deal.contract_facts?.actual_contract_price ?? deal.contract_price ?? null
  const originalProjectedPrice = deal.disposition?.original_projected_sale_price ?? null
  const updatedProjectedPrice = deal.disposition?.updated_projected_sale_price ?? null
  const salePrice = updatedProjectedPrice ?? originalProjectedPrice

  // JV fee calculation
  let jvFee: number | null = null
  if (deal.disposition?.is_jv_deal) {
    if (deal.disposition.jv_type === 'fixed' && deal.disposition.jv_fixed_amount != null) {
      jvFee = deal.disposition.jv_fixed_amount
    } else if (deal.disposition.jv_type === 'percentage' && deal.disposition.jv_percentage != null && salePrice != null) {
      jvFee = (salePrice * deal.disposition.jv_percentage) / 100
    }
  }

  // Calculations
  const originalProjectedProfit =
    originalProjectedPrice != null && contractPrice != null
      ? originalProjectedPrice - contractPrice
      : null

  const estimatedGross =
    salePrice != null && contractPrice != null
      ? salePrice - contractPrice - (jvFee ?? 0)
      : null

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const estimatedGrossAfterExpenses =
    estimatedGross != null ? estimatedGross - totalExpenses : null

  const estimatedNetProfit =
    estimatedGrossAfterExpenses != null
      ? estimatedGrossAfterExpenses - totalCommissions
      : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Financial Summary</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          label="Contract Price"
          value={contractPrice != null ? -contractPrice : null}
          variant="neutral"
        />
        <MetricCard
          label="Projected Sale Price"
          value={salePrice}
          variant="neutral"
        />
        <MetricCard
          label="Original Projected Profit"
          value={originalProjectedProfit}
          variant={originalProjectedProfit != null ? (originalProjectedProfit >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
        {jvFee != null && (
          <MetricCard
            label="JV Fee"
            value={-jvFee}
            variant="neutral"
          />
        )}
        <MetricCard
          label="Estimated Gross Profit"
          value={estimatedGross}
          variant={estimatedGross != null ? (estimatedGross >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
        <MetricCard
          label="Total Expenses"
          value={totalExpenses > 0 ? -totalExpenses : null}
          variant="neutral"
        />
        <MetricCard
          label="Gross After Expenses"
          value={estimatedGrossAfterExpenses}
          variant={estimatedGrossAfterExpenses != null ? (estimatedGrossAfterExpenses >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
        <MetricCard
          label="Total Commissions"
          value={totalCommissions > 0 ? -totalCommissions : null}
          variant="neutral"
        />
        <MetricCard
          label="Estimated Net Profit"
          value={estimatedNetProfit}
          variant={estimatedNetProfit != null ? (estimatedNetProfit >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
      </div>
    </div>
  )
}
