import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Pencil, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const originalDDLocked = data.due_diligence_date != null
  const [editOriginalPrice, setEditOriginalPrice] = useState('')

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

          {/* Original contract price (always locked, editable via warning modal) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Original Contract Price</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="text"
                    className="pl-7 tabular-nums"
                    value={data.original_contract_price != null ? data.original_contract_price.toFixed(2) : ''}
                    readOnly
                    disabled
                    placeholder="0.00"
                  />
                </div>
                {!readOnly && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        title="Edit original contract price"
                        onClick={() => setEditOriginalPrice(
                          data.original_contract_price != null ? data.original_contract_price.toString() : ''
                        )}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Edit Original Contract Price
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This value is used for KPI tracking and should only be changed if it was originally entered incorrectly. Changing this will affect historical performance metrics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label>New Original Contract Price</Label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="text"
                            className="pl-7 tabular-nums"
                            value={editOriginalPrice}
                            onChange={(e) => setEditOriginalPrice(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-amber-600 hover:bg-amber-700"
                          onClick={() => {
                            const cleaned = editOriginalPrice.replace(/[^0-9.-]/g, '')
                            const parsed = parseFloat(cleaned)
                            if (!isNaN(parsed)) {
                              onChange({ original_contract_price: parsed })
                            }
                          }}
                        >
                          Update Price
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
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
