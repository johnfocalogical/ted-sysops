import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
}

export function PhoneInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
  placeholder,
}: PhoneInputProps) {
  // Format phone number as user types (basic US format)
  const formatPhone = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '')

    // Format based on length
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else {
      // For longer numbers (international), just show digits with the first part formatted
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)} ${digits.slice(10)}`
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    onChange(formatted)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="tel"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder || '(555) 123-4567'}
        className={error ? 'border-destructive' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
