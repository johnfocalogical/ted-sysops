import type { CustomFieldDefinition, CustomFieldType } from '@/types/type-system.types'
import type { CustomFieldInputValue } from '@/types/custom-fields.types'
import {
  TextInput,
  TextareaInput,
  NumberInput,
  CurrencyInput,
  DateInput,
  CheckboxInput,
  DropdownInput,
  MultiSelectInput,
  EmailInput,
  PhoneInput,
  UrlInput,
} from './inputs'

interface CustomFieldInputProps {
  definition: CustomFieldDefinition
  value: CustomFieldInputValue
  onChange: (value: CustomFieldInputValue) => void
  error?: string
  disabled?: boolean
  onAddOption?: (option: string) => Promise<void>
}

/**
 * Dynamic renderer that switches on field_type to render the appropriate input component
 */
export function CustomFieldInput({
  definition,
  value,
  onChange,
  error,
  disabled,
  onAddOption,
}: CustomFieldInputProps) {
  const { name, field_type, description, is_required, options, default_value } = definition

  // Helper to get string value with fallback
  const getStringValue = (): string => {
    if (value === null || value === undefined) return default_value || ''
    return String(value)
  }

  // Helper to get number value
  const getNumberValue = (): number | null => {
    if (value === null || value === undefined) {
      return default_value ? parseFloat(default_value) : null
    }
    if (typeof value === 'number') return value
    const parsed = parseFloat(String(value))
    return isNaN(parsed) ? null : parsed
  }

  // Helper to get date value
  const getDateValue = (): Date | null => {
    if (value === null || value === undefined) {
      return default_value ? new Date(default_value) : null
    }
    if (value instanceof Date) return value
    if (typeof value === 'string' && value) return new Date(value)
    return null
  }

  // Helper to get boolean value
  const getBooleanValue = (): boolean => {
    if (typeof value === 'boolean') return value
    if (default_value === 'true') return true
    return false
  }

  // Helper to get array value
  const getArrayValue = (): string[] => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return [value]
      }
    }
    if (default_value) {
      try {
        const parsed = JSON.parse(default_value)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return []
      }
    }
    return []
  }

  // Helper to get selected dropdown value
  const getDropdownValue = (): string => {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && value.length > 0) return value[0]
    return default_value || ''
  }

  // Render appropriate input based on field type
  const renderInput = (fieldType: CustomFieldType) => {
    switch (fieldType) {
      case 'text':
        return (
          <TextInput
            name={name}
            value={getStringValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'textarea':
        return (
          <TextareaInput
            name={name}
            value={getStringValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'number':
        return (
          <NumberInput
            name={name}
            value={getNumberValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'currency':
        return (
          <CurrencyInput
            name={name}
            value={getNumberValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'date':
        return (
          <DateInput
            name={name}
            value={getDateValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'checkbox':
        return (
          <CheckboxInput
            name={name}
            value={getBooleanValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'dropdown':
        return (
          <DropdownInput
            name={name}
            value={getDropdownValue()}
            onChange={(v) => onChange(v)}
            options={options}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
            onAddOption={onAddOption}
          />
        )

      case 'multi_select':
        return (
          <MultiSelectInput
            name={name}
            value={getArrayValue()}
            onChange={(v) => onChange(v)}
            options={options}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
            onAddOption={onAddOption}
          />
        )

      case 'email':
        return (
          <EmailInput
            name={name}
            value={getStringValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'phone':
        return (
          <PhoneInput
            name={name}
            value={getStringValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      case 'url':
        return (
          <UrlInput
            name={name}
            value={getStringValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )

      default: {
        // Handle any unknown field types with a text input
        const _exhaustiveCheck: never = fieldType
        console.warn(`Unknown field type: ${_exhaustiveCheck}`)
        return (
          <TextInput
            name={name}
            value={getStringValue()}
            onChange={(v) => onChange(v)}
            description={description}
            isRequired={is_required}
            error={error}
            disabled={disabled}
          />
        )
      }
    }
  }

  return renderInput(field_type)
}
