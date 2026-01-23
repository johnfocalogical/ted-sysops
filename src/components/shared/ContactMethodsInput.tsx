import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { ContactMethodInput, ContactMethodType } from '@/types/contact.types'

interface ContactMethodsInputProps {
  value: ContactMethodInput[]
  onChange: (value: ContactMethodInput[]) => void
  disabled?: boolean
}

const METHOD_TYPES: { value: ContactMethodType; label: string }[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'fax', label: 'Fax' },
  { value: 'other', label: 'Other' },
]

const DEFAULT_LABELS: Record<ContactMethodType, string[]> = {
  phone: ['Mobile', 'Work', 'Home', 'Main'],
  email: ['Personal', 'Work', 'Main'],
  fax: ['Main', 'Office'],
  other: ['Website', 'Social'],
}

export function ContactMethodsInput({
  value,
  onChange,
  disabled = false,
}: ContactMethodsInputProps) {
  const addMethod = () => {
    onChange([
      ...value,
      {
        method_type: 'phone',
        label: 'Mobile',
        value: '',
        is_primary: value.length === 0,
      },
    ])
  }

  const removeMethod = (index: number) => {
    const newMethods = value.filter((_, i) => i !== index)
    // If we removed the primary, make the first one primary
    if (newMethods.length > 0 && !newMethods.some((m) => m.is_primary)) {
      newMethods[0].is_primary = true
    }
    onChange(newMethods)
  }

  const updateMethod = (index: number, updates: Partial<ContactMethodInput>) => {
    const newMethods = value.map((m, i) => {
      if (i !== index) return m
      return { ...m, ...updates }
    })

    // Handle primary toggle - only one primary per type
    if (updates.is_primary === true) {
      const method = newMethods[index]
      newMethods.forEach((m, i) => {
        if (i !== index && m.method_type === method.method_type) {
          m.is_primary = false
        }
      })
    }

    onChange(newMethods)
  }

  return (
    <div className="space-y-2">
      {value.map((method, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* Type Select */}
          <Select
            value={method.method_type}
            onValueChange={(v) =>
              updateMethod(index, {
                method_type: v as ContactMethodType,
                label: DEFAULT_LABELS[v as ContactMethodType][0],
              })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHOD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Label Select */}
          <Select
            value={method.label}
            onValueChange={(v) => updateMethod(index, { label: v })}
            disabled={disabled}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_LABELS[method.method_type].map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Value Input */}
          <Input
            value={method.value}
            onChange={(e) => updateMethod(index, { value: e.target.value })}
            placeholder={
              method.method_type === 'email'
                ? 'email@example.com'
                : method.method_type === 'phone'
                ? '(555) 123-4567'
                : 'Value'
            }
            className="flex-1"
            disabled={disabled}
          />

          {/* Primary Checkbox */}
          <div className="flex items-center gap-1">
            <Checkbox
              id={`primary-${index}`}
              checked={method.is_primary}
              onCheckedChange={(checked) =>
                updateMethod(index, { is_primary: checked === true })
              }
              disabled={disabled}
            />
            <label
              htmlFor={`primary-${index}`}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Primary
            </label>
          </div>

          {/* Delete Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeMethod(index)}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMethod}
        disabled={disabled}
        className="mt-2"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Contact Method
      </Button>
    </div>
  )
}
