import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ValueSourcePicker } from './ValueSourcePicker'
import type { SetDealFieldParams, DataCollectionField } from '@/types/automator.types'

interface SetDealFieldActionProps {
  params: SetDealFieldParams
  onChange: (params: SetDealFieldParams) => void
  availableFields?: DataCollectionField[]
}

const FIELD_OPTIONS: { group: string; fields: { table: string; field: string; label: string }[] }[] = [
  {
    group: 'Deal',
    fields: [
      { table: 'deals', field: 'address', label: 'Address' },
      { table: 'deals', field: 'city', label: 'City' },
      { table: 'deals', field: 'state', label: 'State' },
      { table: 'deals', field: 'zip', label: 'ZIP' },
      { table: 'deals', field: 'notes', label: 'Notes' },
      { table: 'deals', field: 'contract_price', label: 'Contract Price' },
    ],
  },
  {
    group: 'Contract Facts',
    fields: [
      { table: 'deal_contract_facts', field: 'original_contract_price', label: 'Original Contract Price' },
      { table: 'deal_contract_facts', field: 'actual_contract_price', label: 'Actual Contract Price' },
      { table: 'deal_contract_facts', field: 'earnest_money_amount', label: 'Earnest Money Amount' },
      { table: 'deal_contract_facts', field: 'earnest_money_held_by', label: 'Earnest Money Held By' },
    ],
  },
  {
    group: 'Property Facts',
    fields: [
      { table: 'deal_property_facts', field: 'property_type', label: 'Property Type' },
      { table: 'deal_property_facts', field: 'bedrooms', label: 'Bedrooms' },
      { table: 'deal_property_facts', field: 'bathrooms', label: 'Bathrooms' },
      { table: 'deal_property_facts', field: 'sqft', label: 'Square Feet' },
      { table: 'deal_property_facts', field: 'arv', label: 'ARV' },
      { table: 'deal_property_facts', field: 'estimated_repair_cost', label: 'Estimated Repair Cost' },
      { table: 'deal_property_facts', field: 'mortgage_balance', label: 'Mortgage Balance' },
    ],
  },
  {
    group: 'Deal Facts',
    fields: [
      { table: 'deal_facts', field: 'lead_source', label: 'Lead Source' },
      { table: 'deal_facts', field: 'reason_for_selling', label: 'Reason for Selling' },
      { table: 'deal_facts', field: 'poa_status', label: 'POA Status' },
    ],
  },
  {
    group: 'Disposition',
    fields: [
      { table: 'deal_disposition', field: 'original_projected_sale_price', label: 'Original Projected Sale Price' },
      { table: 'deal_disposition', field: 'updated_projected_sale_price', label: 'Updated Projected Sale Price' },
      { table: 'deal_disposition', field: 'actual_sale_price', label: 'Actual Sale Price' },
      { table: 'deal_disposition', field: 'listing_price', label: 'Listing Price' },
      { table: 'deal_disposition', field: 'assignment_fee', label: 'Assignment Fee' },
    ],
  },
]

export function SetDealFieldAction({ params, onChange, availableFields }: SetDealFieldActionProps) {
  const selectedKey = `${params.target_table}.${params.target_field}`

  const handleFieldSelect = (key: string) => {
    const [table, field] = key.split('.')
    onChange({ ...params, target_table: table, target_field: field })
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Target Field</Label>
        <Select value={selectedKey} onValueChange={handleFieldSelect}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select field..." />
          </SelectTrigger>
          <SelectContent>
            {FIELD_OPTIONS.map((group) => (
              <SelectGroup key={group.group}>
                <SelectLabel className="text-[10px]">{group.group}</SelectLabel>
                {group.fields.map((f) => (
                  <SelectItem key={`${f.table}.${f.field}`} value={`${f.table}.${f.field}`}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ValueSourcePicker
        label="Value"
        value={params.value}
        onChange={(value) => onChange({ ...params, value })}
        availableFields={availableFields}
      />
    </div>
  )
}
