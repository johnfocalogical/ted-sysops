import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberInputProps {
  name: string
  value: number
  onChange: (value: number) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
}

export function NumberInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
  placeholder,
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '' || val === '-') {
      onChange(0)
    } else {
      const parsed = parseFloat(val)
      if (!isNaN(parsed)) {
        onChange(parsed)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="number"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder || '0'}
        className={error ? 'border-destructive' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
