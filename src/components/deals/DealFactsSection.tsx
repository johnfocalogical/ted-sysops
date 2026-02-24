import { useState } from 'react'
import { ChevronDown, ChevronRight, Bookmark } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { TextField, SelectField } from './DealFormFields'
import { TitleStatusStepper } from './TitleStatusStepper'
import { PURCHASE_TYPE_LABELS } from '@/types/deal.types'
import type { DealFacts, PurchaseType, TitleStatus } from '@/types/deal.types'

const PURCHASE_TYPE_OPTIONS = (
  Object.entries(PURCHASE_TYPE_LABELS) as [PurchaseType, string][]
).map(([value, label]) => ({ value, label }))

interface DealFactsSectionProps {
  data: Partial<DealFacts>
  onChange: (updates: Partial<DealFacts>) => void
  defaultExpanded?: boolean
  readOnly?: boolean
}

export function DealFactsSection({
  data,
  onChange,
  defaultExpanded = true,
  readOnly,
}: DealFactsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

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
          <Bookmark className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Deal Facts</span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          {/* Lead source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Lead Source"
              value={data.lead_source}
              onChange={(v) => onChange({ lead_source: v })}
              placeholder="Direct mail, MLS, referral..."
              readOnly={readOnly}
            />
            <TextField
              label="Lead Source Detail"
              value={data.lead_source_detail}
              onChange={(v) => onChange({ lead_source_detail: v })}
              placeholder="Campaign name, agent name..."
              readOnly={readOnly}
            />
          </div>

          {/* Title Status Stepper */}
          <div className="border-t pt-4 mt-2">
            <TitleStatusStepper
              value={data.title_status ?? 'not_ordered'}
              onChange={(v: TitleStatus) => onChange({ title_status: v })}
              readOnly={readOnly}
            />
          </div>

          {/* Title details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Title Company"
              value={data.title_company_id}
              onChange={(v) => onChange({ title_company_id: v })}
              placeholder="Search title company..."
              readOnly={readOnly}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Ordered</Label>
                <div className="text-sm text-muted-foreground pt-1">
                  {data.title_ordered_date
                    ? new Date(data.title_ordered_date).toLocaleDateString()
                    : '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Cleared</Label>
                <div className="text-sm text-muted-foreground pt-1">
                  {data.title_clear_date
                    ? new Date(data.title_clear_date).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* POA & Purchase Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">POA Obtained</Label>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  checked={data.poa_required ?? false}
                  onCheckedChange={(checked) =>
                    onChange({ poa_required: checked === true })
                  }
                  disabled={readOnly}
                />
                <span className="text-sm">
                  {data.poa_required ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <SelectField
              label="Purchase Type"
              value={data.purchase_type}
              onChange={(v) => onChange({ purchase_type: v as PurchaseType | null })}
              options={PURCHASE_TYPE_OPTIONS}
              placeholder="Select purchase type..."
              readOnly={readOnly}
            />
          </div>

          {/* Reason for selling */}
          <TextField
            label="Reason for Selling"
            value={data.reason_for_selling}
            onChange={(v) => onChange({ reason_for_selling: v })}
            placeholder="Divorce, relocation, financial hardship..."
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}
