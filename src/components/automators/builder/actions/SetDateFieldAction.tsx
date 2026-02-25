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
import type { SetDateFieldParams, DataCollectionField } from '@/types/automator.types'

interface SetDateFieldActionProps {
  params: SetDateFieldParams
  onChange: (params: SetDateFieldParams) => void
  availableFields?: DataCollectionField[]
}

const DATE_FIELD_OPTIONS: { group: string; fields: { table: string; field: string; label: string }[] }[] = [
  {
    group: 'Deal',
    fields: [
      { table: 'deals', field: 'contract_date', label: 'Contract Date' },
      { table: 'deals', field: 'closing_date', label: 'Closing Date' },
    ],
  },
  {
    group: 'Contract Facts',
    fields: [
      { table: 'deal_contract_facts', field: 'contract_date', label: 'Contract Date' },
      { table: 'deal_contract_facts', field: 'due_diligence_date', label: 'Due Diligence Date' },
      { table: 'deal_contract_facts', field: 'due_diligence_end_date', label: 'Due Diligence End Date' },
      { table: 'deal_contract_facts', field: 'original_closing_date', label: 'Original Closing Date' },
      { table: 'deal_contract_facts', field: 'extended_closing_date', label: 'Extended Closing Date' },
      { table: 'deal_contract_facts', field: 'earnest_money_date', label: 'Earnest Money Date' },
    ],
  },
  {
    group: 'Deal Facts',
    fields: [
      { table: 'deal_facts', field: 'title_ordered_date', label: 'Title Ordered Date' },
      { table: 'deal_facts', field: 'title_clear_date', label: 'Title Clear Date' },
    ],
  },
  {
    group: 'Disposition',
    fields: [
      { table: 'deal_disposition', field: 'listing_date', label: 'Listing Date' },
    ],
  },
  {
    group: 'Property Facts',
    fields: [
      { table: 'deal_property_facts', field: 'foreclosure_auction_date', label: 'Foreclosure Auction Date' },
    ],
  },
]

export function SetDateFieldAction({ params, onChange, availableFields }: SetDateFieldActionProps) {
  const selectedKey = `${params.target_table}.${params.target_field}`

  const handleFieldSelect = (key: string) => {
    const [table, field] = key.split('.')
    onChange({ ...params, target_table: table, target_field: field })
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Target Date Field</Label>
        <Select value={selectedKey} onValueChange={handleFieldSelect}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select date field..." />
          </SelectTrigger>
          <SelectContent>
            {DATE_FIELD_OPTIONS.map((group) => (
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
        label="Date Value"
        value={params.value}
        onChange={(value) => onChange({ ...params, value })}
        availableFields={availableFields}
        inputType="date"
      />
    </div>
  )
}
