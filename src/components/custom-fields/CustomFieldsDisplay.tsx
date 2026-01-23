import * as LucideIcons from 'lucide-react'
import { Check, X, ExternalLink, Mail, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTypeColorClasses, type CustomFieldType } from '@/types/type-system.types'
import type { CustomFieldsGroupedByType, CustomFieldValueWithDefinition } from '@/types/custom-fields.types'
import { extractValue, formatValueForDisplay } from '@/lib/customFieldValueService'

interface CustomFieldsDisplayProps {
  groups: CustomFieldsGroupedByType[]
  className?: string
}

/**
 * Read-only display of custom field values grouped by type
 * Used in detail views/drawers
 */
export function CustomFieldsDisplay({ groups, className }: CustomFieldsDisplayProps) {
  if (groups.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group) => (
        <CustomFieldGroupCard key={group.typeId} group={group} />
      ))}
    </div>
  )
}

interface CustomFieldGroupCardProps {
  group: CustomFieldsGroupedByType
}

function CustomFieldGroupCard({ group }: CustomFieldGroupCardProps) {
  const colorClasses = getTypeColorClasses(group.typeColor)

  // Get the icon component
  const IconComponent = (LucideIcons[group.typeIcon as keyof typeof LucideIcons] ||
    LucideIcons.User) as LucideIcons.LucideIcon

  return (
    <Card>
      <CardHeader className={cn('py-3', colorClasses.bg)}>
        <CardTitle className={cn('text-sm flex items-center gap-2', colorClasses.text)}>
          <IconComponent className="h-4 w-4" />
          {group.typeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 space-y-3">
        {group.fields.map((field) => (
          <CustomFieldValueDisplay key={field.id} field={field} />
        ))}
      </CardContent>
    </Card>
  )
}

interface CustomFieldValueDisplayProps {
  field: CustomFieldValueWithDefinition
}

function CustomFieldValueDisplay({ field }: CustomFieldValueDisplayProps) {
  const value = extractValue(field, field.definition.field_type)
  const displayValue = formatValueForDisplay(value, field.definition.field_type)

  // Check if value is empty
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{field.definition.name}</span>
      <div className="text-sm">
        {isEmpty ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <FieldValueRenderer
            value={value}
            displayValue={displayValue}
            fieldType={field.definition.field_type}
          />
        )}
      </div>
    </div>
  )
}

interface FieldValueRendererProps {
  value: unknown
  displayValue: string
  fieldType: CustomFieldType
}

function FieldValueRenderer({ value, displayValue, fieldType }: FieldValueRendererProps) {
  switch (fieldType) {
    case 'checkbox':
      return value ? (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          Yes
        </span>
      ) : (
        <span className="flex items-center gap-1 text-muted-foreground">
          <X className="h-4 w-4" />
          No
        </span>
      )

    case 'currency':
      return (
        <span className="font-medium text-green-600 dark:text-green-400">
          {displayValue}
        </span>
      )

    case 'url':
      return value ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          {displayValue}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span>{displayValue}</span>
      )

    case 'email':
      return value ? (
        <a
          href={`mailto:${value}`}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Mail className="h-3 w-3" />
          {displayValue}
        </a>
      ) : (
        <span>{displayValue}</span>
      )

    case 'phone':
      return value ? (
        <a
          href={`tel:${String(value).replace(/\D/g, '')}`}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Phone className="h-3 w-3" />
          {displayValue}
        </a>
      ) : (
        <span>{displayValue}</span>
      )

    case 'multi_select':
      return Array.isArray(value) && value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <span>{displayValue}</span>
      )

    case 'textarea':
      return (
        <p className="whitespace-pre-wrap">{displayValue}</p>
      )

    default:
      return <span>{displayValue}</span>
  }
}
