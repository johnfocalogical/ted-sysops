import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface CheckboxInputProps {
  name: string
  value: boolean
  onChange: (value: boolean) => void
  description?: string | null
  isRequired?: boolean
  error?: string
  disabled?: boolean
}

export function CheckboxInput({
  name,
  value,
  onChange,
  description,
  error,
  disabled,
}: CheckboxInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
        />
        <Label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {name}
        </Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground ml-6">{description}</p>
      )}
      {error && <p className="text-xs text-destructive ml-6">{error}</p>}
    </div>
  )
}
