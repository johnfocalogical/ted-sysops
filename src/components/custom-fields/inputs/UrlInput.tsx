import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UrlInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
}

// Basic URL validation
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function UrlInput({
  name,
  value,
  onChange,
  description,
  isRequired,
  error,
  disabled,
  placeholder,
}: UrlInputProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleBlur = () => {
    if (value && !isValidUrl(value)) {
      // Try adding https:// prefix
      if (isValidUrl(`https://${value}`)) {
        onChange(`https://${value}`)
        setLocalError(null)
      } else {
        setLocalError('Invalid URL format')
      }
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
        type="url"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setLocalError(null)
        }}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder || 'https://example.com'}
        className={displayError ? 'border-destructive' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {displayError && <p className="text-xs text-destructive">{displayError}</p>}
    </div>
  )
}
