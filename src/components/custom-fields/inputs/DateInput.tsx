import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface DateInputProps {
  name: string
  value: Date | null
  onChange: (value: Date | null) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
}

export function DateInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
}: DateInputProps) {
  // Format date for input value (YYYY-MM-DD)
  const formatForInput = (date: Date | null): string => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) {
      onChange(null)
    } else {
      onChange(new Date(val))
    }
  }

  const handleClear = () => {
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          id={name}
          type="date"
          value={formatForInput(value)}
          onChange={handleChange}
          disabled={disabled}
          className={`flex-1 ${error ? 'border-destructive' : ''}`}
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
