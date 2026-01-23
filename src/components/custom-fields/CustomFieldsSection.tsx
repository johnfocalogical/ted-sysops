import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTypeColorClasses } from '@/types/type-system.types'
import type { CustomFieldDefinition } from '@/types/type-system.types'
import type { CustomFieldInputValue, CustomFieldValuesMap } from '@/types/custom-fields.types'
import { CustomFieldInput } from './CustomFieldInput'

interface CustomFieldsSectionProps {
  typeId: string
  typeName: string
  typeColor: string
  typeIcon: string
  fields: CustomFieldDefinition[]
  values: CustomFieldValuesMap
  errors?: Record<string, string>
  disabled?: boolean
  onChange: (fieldId: string, value: CustomFieldInputValue) => void
  onAddOption?: (fieldId: string, option: string) => Promise<void>
  defaultExpanded?: boolean
}

/**
 * Collapsible section displaying custom fields for a single type
 */
export function CustomFieldsSection({
  typeName,
  typeColor,
  typeIcon,
  fields,
  values,
  errors = {},
  disabled,
  onChange,
  onAddOption,
  defaultExpanded = true,
}: CustomFieldsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const colorClasses = getTypeColorClasses(typeColor)

  // Get the icon component
  const IconComponent = (LucideIcons[typeIcon as keyof typeof LucideIcons] ||
    LucideIcons.User) as LucideIcons.LucideIcon

  // Count required fields for display
  const requiredCount = fields.filter((f) => f.is_required).length

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'text-left transition-colors',
          colorClasses.bg,
          'hover:opacity-90'
        )}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <IconComponent className={cn('h-4 w-4', colorClasses.text)} />
          <span className={cn('font-medium text-sm', colorClasses.text)}>
            {typeName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {fields.length} field{fields.length !== 1 ? 's' : ''}
          </span>
          {requiredCount > 0 && (
            <span className="text-destructive">
              ({requiredCount} required)
            </span>
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-background">
          {fields.map((field) => (
            <CustomFieldInput
              key={field.id}
              definition={field}
              value={values[field.id] ?? null}
              onChange={(value) => onChange(field.id, value)}
              error={errors[field.id]}
              disabled={disabled}
              onAddOption={
                onAddOption
                  ? (option) => onAddOption(field.id, option)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Container for all custom field sections
// ============================================================================

interface CustomFieldsFormProps {
  sections: Array<{
    typeId: string
    typeName: string
    typeColor: string
    typeIcon: string
    fields: CustomFieldDefinition[]
  }>
  values: CustomFieldValuesMap
  errors?: Record<string, string>
  disabled?: boolean
  onChange: (fieldId: string, value: CustomFieldInputValue) => void
  onAddOption?: (fieldId: string, option: string) => Promise<void>
}

/**
 * Container component that renders all custom field sections
 * grouped by type
 */
export function CustomFieldsForm({
  sections,
  values,
  errors = {},
  disabled,
  onChange,
  onAddOption,
}: CustomFieldsFormProps) {
  if (sections.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <CustomFieldsSection
          key={section.typeId}
          typeId={section.typeId}
          typeName={section.typeName}
          typeColor={section.typeColor}
          typeIcon={section.typeIcon}
          fields={section.fields}
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
          onAddOption={onAddOption}
        />
      ))}
    </div>
  )
}
