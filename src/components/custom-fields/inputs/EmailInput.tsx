import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
}

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmailInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
  placeholder,
}: EmailInputProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleBlur = () => {
    if (value && !EMAIL_REGEX.test(value)) {
      setLocalError('Invalid email format')
    } else {
      setLocalError(null)
    }
  }

  const displayError = error || localError

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="email"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setLocalError(null)
        }}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder || 'email@example.com'}
        className={displayError ? 'border-destructive' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {displayError && <p className="text-xs text-destructive">{displayError}</p>}
    </div>
  )
}
