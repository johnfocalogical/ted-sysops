import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================================================
// Shared Field Components for Deal Form Sections
// ============================================================================

interface BaseFieldProps {
  label: string
  readOnly?: boolean
}

// --- Currency Field ---

interface CurrencyFieldProps extends BaseFieldProps {
  value: number | null | undefined
  onChange: (val: number | null) => void
}

export function CurrencyField({ label, value, onChange, readOnly }: CurrencyFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [localDisplay, setLocalDisplay] = useState('')
  const formatted = value != null ? value.toFixed(2) : ''

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          type="text"
          className="pl-7 tabular-nums"
          value={isFocused ? localDisplay : formatted}
          onFocus={() => {
            setLocalDisplay(formatted)
            setIsFocused(true)
          }}
          onChange={(e) => setLocalDisplay(e.target.value)}
          onBlur={() => {
            setIsFocused(false)
            const cleaned = localDisplay.replace(/[^0-9.-]/g, '')
            const parsed = parseFloat(cleaned)
            if (!isNaN(parsed)) {
              onChange(parsed)
            } else {
              onChange(null)
            }
          }}
          placeholder="0.00"
          readOnly={readOnly}
          disabled={readOnly}
        />
      </div>
    </div>
  )
}

// --- Date Field ---

interface DateFieldProps extends BaseFieldProps {
  value: string | null | undefined
  onChange: (val: string | null) => void
}

export function DateField({ label, value, onChange, readOnly }: DateFieldProps) {
  // Ensure date is in YYYY-MM-DD format for input
  const formatDate = (d: string | null | undefined): string => {
    if (!d) return ''
    return d.substring(0, 10) // Take YYYY-MM-DD portion
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type="date"
        value={formatDate(value)}
        onChange={(e) => onChange(e.target.value || null)}
        readOnly={readOnly}
        disabled={readOnly}
      />
    </div>
  )
}

// --- Text Field ---

interface TextFieldProps extends BaseFieldProps {
  value: string | null | undefined
  onChange: (val: string | null) => void
  placeholder?: string
}

export function TextField({ label, value, onChange, readOnly, placeholder }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
      />
    </div>
  )
}

// --- Textarea Field ---

interface TextareaFieldProps extends BaseFieldProps {
  value: string | null | undefined
  onChange: (val: string | null) => void
  placeholder?: string
  rows?: number
}

export function TextareaField({ label, value, onChange, readOnly, placeholder, rows = 3 }: TextareaFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
        rows={rows}
        className="resize-none"
      />
    </div>
  )
}

// --- Number Field ---

interface NumberFieldProps extends BaseFieldProps {
  value: number | null | undefined
  onChange: (val: number | null) => void
  placeholder?: string
}

export function NumberField({ label, value, onChange, readOnly, placeholder }: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === '' ? null : Number(val))
        }}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={readOnly}
      />
    </div>
  )
}

// --- Percentage Field ---

interface PercentageFieldProps extends BaseFieldProps {
  value: number | null | undefined
  onChange: (val: number | null) => void
}

export function PercentageField({ label, value, onChange, readOnly }: PercentageFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [localDisplay, setLocalDisplay] = useState('')
  const formatted = value != null ? value.toString() : ''

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          className="pr-8 tabular-nums"
          value={isFocused ? localDisplay : formatted}
          onFocus={() => {
            setLocalDisplay(formatted)
            setIsFocused(true)
          }}
          onChange={(e) => setLocalDisplay(e.target.value)}
          onBlur={() => {
            setIsFocused(false)
            const cleaned = localDisplay.replace(/[^0-9.]/g, '')
            const parsed = parseFloat(cleaned)
            if (!isNaN(parsed)) {
              onChange(parsed)
            } else {
              onChange(null)
            }
          }}
          placeholder="0"
          readOnly={readOnly}
          disabled={readOnly}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
      </div>
    </div>
  )
}

// --- Select Field ---

interface SelectFieldProps extends BaseFieldProps {
  value: string | null | undefined
  onChange: (val: string | null) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, value, onChange, options, placeholder, readOnly }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select
        value={value ?? ''}
        onValueChange={(v) => onChange(v || null)}
        disabled={readOnly}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? 'Select...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// --- Switch Field ---

interface SwitchFieldProps extends BaseFieldProps {
  value: boolean | undefined
  onChange: (val: boolean) => void
}

export function SwitchField({ label, value, onChange, readOnly }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Switch
        checked={value ?? false}
        onCheckedChange={onChange}
        disabled={readOnly}
      />
    </div>
  )
}
