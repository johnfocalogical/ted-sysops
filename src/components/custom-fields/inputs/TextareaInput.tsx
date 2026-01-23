import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface TextareaInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
  rows?: number
}

export function TextareaInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
  placeholder,
  rows = 3,
}: TextareaInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || `Enter ${name.toLowerCase()}`}
        rows={rows}
        className={error ? 'border-destructive' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
