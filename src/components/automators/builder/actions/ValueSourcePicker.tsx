import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ValueSource, DataCollectionField } from '@/types/automator.types'

interface ValueSourcePickerProps {
  value: ValueSource | undefined
  onChange: (value: ValueSource) => void
  /** Available fields from a data collection node (empty for decision nodes) */
  availableFields?: DataCollectionField[]
  label?: string
  /** Type hint for the static input: 'text' | 'number' | 'date' */
  inputType?: 'text' | 'number' | 'date'
}

export function ValueSourcePicker({
  value,
  onChange,
  availableFields = [],
  label,
  inputType = 'text',
}: ValueSourcePickerProps) {
  const sourceType = value?.source ?? 'static'

  const handleSourceChange = (newSource: string) => {
    if (newSource === 'static') {
      onChange({ source: 'static', value: '' })
    } else if (newSource === 'today') {
      onChange({ source: 'today' })
    } else if (newSource === 'field') {
      onChange({ source: 'field', field_id: availableFields[0]?.field_id ?? '' })
    }
  }

  const handleStaticValueChange = (val: string | number) => {
    onChange({ source: 'static', value: val })
  }

  const handleFieldChange = (fieldId: string) => {
    onChange({ source: 'field', field_id: fieldId })
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="flex gap-2">
        <Select value={sourceType} onValueChange={handleSourceChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">Static Value</SelectItem>
            <SelectItem value="today">Today's Date</SelectItem>
            {availableFields.length > 0 && (
              <SelectItem value="field">From Input</SelectItem>
            )}
          </SelectContent>
        </Select>

        {sourceType === 'static' && (
          <Input
            className="h-8 text-xs flex-1"
            type={inputType}
            value={value && 'value' in value ? String(value.value) : ''}
            onChange={(e) =>
              handleStaticValueChange(
                inputType === 'number' ? Number(e.target.value) : e.target.value
              )
            }
            placeholder="Enter value..."
          />
        )}

        {sourceType === 'today' && (
          <div className="flex-1 flex items-center text-xs text-muted-foreground px-2">
            Current date at execution time
          </div>
        )}

        {sourceType === 'field' && availableFields.length > 0 && (
          <Select
            value={value && 'field_id' in value ? value.field_id : ''}
            onValueChange={handleFieldChange}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((field) => (
                <SelectItem key={field.field_id} value={field.field_id}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
