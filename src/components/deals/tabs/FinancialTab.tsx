import { useState, useCallback } from 'react'
import { FinancialSummary } from './FinancialSummary'
import { ExpenseList } from './ExpenseList'
import { CommissionBreakdown } from './CommissionBreakdown'
import { ActualResults } from './ActualResults'
import type { DealWithDetails, DealExpense } from '@/types/deal.types'

interface FinancialTabProps {
  deal: DealWithDetails
}

export function FinancialTab({ deal }: FinancialTabProps) {
  const [expenses, setExpenses] = useState<DealExpense[]>([])
  const [totalCommissions, setTotalCommissions] = useState(0)

  const handleExpensesChange = useCallback((newExpenses: DealExpense[]) => {
    setExpenses(newExpenses)
  }, [])

  const handleCommissionsChange = useCallback((total: number) => {
    setTotalCommissions(total)
  }, [])

  // Calculate gross after expenses for commission breakdown
  const contractPrice = deal.contract_facts?.actual_contract_price ?? deal.contract_price ?? null
  const projectedPrice = deal.disposition?.updated_projected_sale_price ?? deal.disposition?.original_projected_sale_price ?? null

  let jvFee: number | null = null
  if (deal.disposition?.is_jv_deal) {
    if (deal.disposition.jv_type === 'fixed' && deal.disposition.jv_fixed_amount != null) {
      jvFee = deal.disposition.jv_fixed_amount
    } else if (deal.disposition.jv_type === 'percentage' && deal.disposition.jv_percentage != null && projectedPrice != null) {
      jvFee = (projectedPrice * deal.disposition.jv_percentage) / 100
    }
  }

  const estimatedGross =
    projectedPrice != null && contractPrice != null
      ? projectedPrice - contractPrice - (jvFee ?? 0)
      : null

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const grossAfterExpenses = estimatedGross != null ? estimatedGross - totalExpenseAmount : null

  return (
    <div className="space-y-8">
      {/* Financial Summary Metrics */}
      <FinancialSummary
        deal={deal}
        expenses={expenses}
        totalCommissions={totalCommissions}
      />

      {/* Separator */}
      <div className="border-t" />

      {/* Expense List with CRUD */}
      <ExpenseList
        dealId={deal.id}
        onExpensesChange={handleExpensesChange}
      />

      {/* Separator */}
      <div className="border-t" />

      {/* Commission Breakdown */}
      <CommissionBreakdown
        dealId={deal.id}
        grossAfterExpenses={grossAfterExpenses}
        onCommissionsChange={handleCommissionsChange}
      />

      {/* Actual Results (only for closed/funded deals) */}
      <ActualResults
        deal={deal}
        expenses={expenses}
        totalCommissions={totalCommissions}
      />
    </div>
  )
}
