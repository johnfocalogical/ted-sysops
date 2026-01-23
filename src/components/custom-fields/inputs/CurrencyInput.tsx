import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CurrencyInputProps {
  name: string
  value: number
  onChange: (value: number) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
}

export function CurrencyInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? value.toFixed(2) : ''
  )

  // Sync display value when prop changes
  useEffect(() => {
    if (value !== parseFloat(displayValue.replace(/[^0-9.-]/g, ''))) {
      setDisplayValue(value ? value.toFixed(2) : '')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing freely
    setDisplayValue(e.target.value)
  }

  const handleBlur = () => {
    // Parse and format on blur
    const cleaned = displayValue.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    if (!isNaN(parsed)) {
      onChange(parsed)
      setDisplayValue(parsed.toFixed(2))
    } else {
      onChange(0)
      setDisplayValue('')
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Input
          id={name}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`pl-7 ${error ? 'border-destructive' : ''}`}
          placeholder="0.00"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
