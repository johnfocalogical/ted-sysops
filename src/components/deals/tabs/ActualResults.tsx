import { CheckCircle2 } from 'lucide-react'
import type { DealWithDetails, DealExpense } from '@/types/deal.types'

interface ActualResultsProps {
  deal: DealWithDetails
  expenses: DealExpense[]
  totalCommissions: number
}

interface ResultRowProps {
  label: string
  value: number | null
  variant?: 'default' | 'profit' | 'loss' | 'neutral'
  bold?: boolean
}

function ResultRow({ label, value, variant = 'default', bold = false }: ResultRowProps) {
  const formatted =
    value != null
      ? `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—'

  const prefix = value != null && value < 0 ? '-' : value != null && value > 0 ? '+' : ''

  let colorClass = 'text-foreground'
  if (variant === 'profit' || (variant === 'default' && value != null && value > 0)) {
    colorClass = 'text-green-600 dark:text-green-400'
  } else if (variant === 'loss' || (variant === 'default' && value != null && value < 0)) {
    colorClass = 'text-red-600 dark:text-red-400'
  } else if (variant === 'neutral') {
    colorClass = 'text-muted-foreground'
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className={`text-sm ${bold ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
      <span className={`tabular-nums ${bold ? 'text-xl font-bold' : 'text-sm font-medium'} ${colorClass}`}>
        {value != null ? `${prefix}${formatted}` : formatted}
      </span>
    </div>
  )
}

export function ActualResults({ deal, expenses, totalCommissions }: ActualResultsProps) {
  // Only show for closed/funded deals
  if (deal.status !== 'closed' && deal.status !== 'funded') {
    return null
  }

  const contractPrice = deal.contract_facts?.actual_contract_price ?? deal.contract_price ?? null
  const actualClosePrice = deal.contract_facts?.actual_contract_price ?? null

  // Actual revenue
  const actualRevenue =
    actualClosePrice != null && contractPrice != null
      ? actualClosePrice - contractPrice
      : null

  // Actual JV fee (recalculated with actual price if percentage)
  let actualJvFee: number | null = null
  if (deal.disposition?.is_jv_deal) {
    if (deal.disposition.jv_type === 'fixed' && deal.disposition.jv_fixed_amount != null) {
      actualJvFee = deal.disposition.jv_fixed_amount
    } else if (
      deal.disposition.jv_type === 'percentage' &&
      deal.disposition.jv_percentage != null &&
      actualClosePrice != null
    ) {
      actualJvFee = (actualClosePrice * deal.disposition.jv_percentage) / 100
    }
  }

  // Actual gross profit
  const actualGross =
    actualRevenue != null ? actualRevenue - (actualJvFee ?? 0) : null

  // Actual expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Actual net profit
  const actualNetAfterExpenses =
    actualGross != null ? actualGross - totalExpenses : null

  // Actual net after commissions
  const actualNetAfterCommissions =
    actualNetAfterExpenses != null
      ? actualNetAfterExpenses - totalCommissions
      : null

  // Estimated comparison values
  const projectedPrice = deal.disposition?.updated_projected_sale_price ?? deal.disposition?.original_projected_sale_price ?? null
  const estimatedGross =
    projectedPrice != null && contractPrice != null
      ? projectedPrice - contractPrice - (actualJvFee ?? 0)
      : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h3 className="text-sm font-medium">Actual Results</h3>
      </div>

      <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 space-y-1">
        <ResultRow
          label="Actual Close Price"
          value={actualClosePrice}
          variant="neutral"
        />
        <ResultRow
          label="Actual Revenue"
          value={actualRevenue}
          variant={actualRevenue != null ? (actualRevenue >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
        {actualJvFee != null && (
          <ResultRow label="JV Fee" value={-actualJvFee} variant="neutral" />
        )}
        <ResultRow
          label="Actual Gross Profit"
          value={actualGross}
          variant={actualGross != null ? (actualGross >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
        <div className="border-t my-2" />
        <ResultRow label="Total Expenses" value={-totalExpenses} variant="neutral" />
        <ResultRow
          label="Net After Expenses"
          value={actualNetAfterExpenses}
          variant={actualNetAfterExpenses != null ? (actualNetAfterExpenses >= 0 ? 'profit' : 'loss') : 'neutral'}
        />
        <ResultRow label="Total Commissions" value={-totalCommissions} variant="neutral" />
        <div className="border-t my-2" />
        <ResultRow
          label="Actual Net Profit"
          value={actualNetAfterCommissions}
          variant={actualNetAfterCommissions != null ? (actualNetAfterCommissions >= 0 ? 'profit' : 'loss') : 'neutral'}
          bold
        />

        {/* Estimated vs Actual comparison */}
        {estimatedGross != null && actualGross != null && (
          <>
            <div className="border-t my-2" />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Estimated vs Actual Gross</span>
              <span
                className={`text-xs font-medium tabular-nums ${
                  actualGross >= estimatedGross
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {actualGross >= estimatedGross ? '+' : ''}
                ${(actualGross - estimatedGross).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {' '}({actualGross >= estimatedGross ? 'over' : 'under'} estimate)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
