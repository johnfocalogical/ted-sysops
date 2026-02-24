import { useState } from 'react'
import { ChevronDown, ChevronRight, Home } from 'lucide-react'
import {
  CurrencyField,
  DateField,
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  SwitchField,
} from './DealFormFields'
import type { DealPropertyFacts } from '@/types/deal.types'

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi Family' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'mobile_home', label: 'Mobile Home' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'other', label: 'Other' },
]

interface PropertyFactsSectionProps {
  data: Partial<DealPropertyFacts>
  onChange: (updates: Partial<DealPropertyFacts>) => void
  defaultExpanded?: boolean
  readOnly?: boolean
}

export function PropertyFactsSection({
  data,
  onChange,
  defaultExpanded = true,
  readOnly,
}: PropertyFactsSectionProps) {
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
          <Home className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Property Facts</span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          {/* Property basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Property Type"
              value={data.property_type}
              onChange={(v) => onChange({ property_type: v })}
              options={PROPERTY_TYPES}
              placeholder="Select type..."
              readOnly={readOnly}
            />
            <TextField
              label="Property Condition"
              value={data.property_condition}
              onChange={(v) => onChange({ property_condition: v })}
              placeholder="Good, Fair, Poor..."
              readOnly={readOnly}
            />
          </div>

          {/* Property details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <NumberField
              label="Bedrooms"
              value={data.bedrooms}
              onChange={(v) => onChange({ bedrooms: v })}
              readOnly={readOnly}
            />
            <NumberField
              label="Bathrooms"
              value={data.bathrooms}
              onChange={(v) => onChange({ bathrooms: v })}
              readOnly={readOnly}
            />
            <NumberField
              label="Sqft"
              value={data.sqft}
              onChange={(v) => onChange({ sqft: v })}
              readOnly={readOnly}
            />
            <NumberField
              label="Year Built"
              value={data.year_built}
              onChange={(v) => onChange({ year_built: v })}
              placeholder="1990"
              readOnly={readOnly}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Lot Size"
              value={data.lot_size}
              onChange={(v) => onChange({ lot_size: v })}
              placeholder="0.25 acres"
              readOnly={readOnly}
            />
            <TextField
              label="Parcel / Tax ID"
              value={data.parcel_number}
              onChange={(v) => onChange({ parcel_number: v })}
              readOnly={readOnly}
            />
          </div>

          <TextareaField
            label="Legal Description"
            value={data.legal_description}
            onChange={(v) => onChange({ legal_description: v })}
            readOnly={readOnly}
            rows={2}
          />

          {/* Valuation */}
          <div className="border-t pt-4 mt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Valuation
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <CurrencyField
                label="ARV (After Repair Value)"
                value={data.arv}
                onChange={(v) => onChange({ arv: v })}
                readOnly={readOnly}
              />
              <CurrencyField
                label="Estimated Repair Cost"
                value={data.estimated_repair_cost}
                onChange={(v) => onChange({ estimated_repair_cost: v })}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Mortgage / Liens */}
          <div className="border-t pt-4 mt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mortgage & Liens
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <TextField
                label="Mortgage Lender"
                value={data.mortgage_lender}
                onChange={(v) => onChange({ mortgage_lender: v })}
                readOnly={readOnly}
              />
              <CurrencyField
                label="Mortgage Balance"
                value={data.mortgage_balance}
                onChange={(v) => onChange({ mortgage_balance: v })}
                readOnly={readOnly}
              />
              <CurrencyField
                label="Monthly Payment"
                value={data.mortgage_monthly_payment}
                onChange={(v) => onChange({ mortgage_monthly_payment: v })}
                readOnly={readOnly}
              />
              <CurrencyField
                label="Liens Amount"
                value={data.liens_amount}
                onChange={(v) => onChange({ liens_amount: v })}
                readOnly={readOnly}
              />
            </div>
            <div className="mt-3">
              <TextField
                label="Liens Description"
                value={data.liens_description}
                onChange={(v) => onChange({ liens_description: v })}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Foreclosure */}
          <div className="border-t pt-4 mt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Foreclosure
            </span>
            <div className="mt-3 space-y-3">
              <SwitchField
                label="In Foreclosure"
                value={data.is_foreclosure}
                onChange={(v) => onChange({ is_foreclosure: v })}
                readOnly={readOnly}
              />
              {data.is_foreclosure && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Foreclosure Status"
                    value={data.foreclosure_status}
                    onChange={(v) => onChange({ foreclosure_status: v })}
                    placeholder="Pre-foreclosure, Notice of Default..."
                    readOnly={readOnly}
                  />
                  <DateField
                    label="Auction Date"
                    value={data.foreclosure_auction_date}
                    onChange={(v) => onChange({ foreclosure_auction_date: v })}
                    readOnly={readOnly}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
