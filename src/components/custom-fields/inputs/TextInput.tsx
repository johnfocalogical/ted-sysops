import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
}

export function TextInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
  placeholder,
}: TextInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || `Enter ${name.toLowerCase()}`}
        className={error ? 'border-destructive' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
