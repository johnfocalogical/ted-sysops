import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { CurrencyField, DateField, TextField } from './DealFormFields'
import type { DealContractFacts } from '@/types/deal.types'

interface ContractFactsSectionProps {
  data: Partial<DealContractFacts>
  onChange: (updates: Partial<DealContractFacts>) => void
  defaultExpanded?: boolean
  readOnly?: boolean
}

export function ContractFactsSection({
  data,
  onChange,
  defaultExpanded = true,
  readOnly,
}: ContractFactsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Original fields become read-only after being initially set
  const originalPriceLocked = data.original_contract_price != null
  const originalDDLocked = data.due_diligence_date != null

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors bg-muted/30 hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Contract Facts</span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          {/* Primary contract fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyField
              label="Contract Price"
              value={data.actual_contract_price}
              onChange={(v) => onChange({ actual_contract_price: v })}
              readOnly={readOnly}
            />
            <DateField
              label="Contract Date"
              value={data.contract_date}
              onChange={(v) => onChange({ contract_date: v })}
              readOnly={readOnly}
            />
          </div>

          {/* Due diligence dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              label="DD Start Date"
              value={data.due_diligence_date}
              onChange={(v) => onChange({ due_diligence_date: v })}
              readOnly={readOnly || originalDDLocked}
            />
            <DateField
              label="DD Expiration"
              value={data.due_diligence_end_date}
              onChange={(v) => onChange({ due_diligence_end_date: v })}
              readOnly={readOnly}
            />
          </div>

          {/* Closing dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              label="Closing Date"
              value={data.original_closing_date}
              onChange={(v) => onChange({ original_closing_date: v })}
              readOnly={readOnly}
            />
            <DateField
              label="Extended Closing"
              value={data.extended_closing_date}
              onChange={(v) => onChange({ extended_closing_date: v })}
              readOnly={readOnly}
            />
          </div>

          {/* Original contract price (frozen after set) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyField
              label="Original Contract Price"
              value={data.original_contract_price}
              onChange={(v) => onChange({ original_contract_price: v })}
              readOnly={readOnly || originalPriceLocked}
            />
          </div>

          {/* Earnest money */}
          <div className="border-t pt-4 mt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Earnest Money
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <CurrencyField
                label="Deposit Amount"
                value={data.earnest_money_amount}
                onChange={(v) => onChange({ earnest_money_amount: v })}
                readOnly={readOnly}
              />
              <TextField
                label="Held By"
                value={data.earnest_money_held_by}
                onChange={(v) => onChange({ earnest_money_held_by: v })}
                readOnly={readOnly}
                placeholder="Title company, attorney..."
              />
              <DateField
                label="Deposit Date"
                value={data.earnest_money_date}
                onChange={(v) => onChange({ earnest_money_date: v })}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
