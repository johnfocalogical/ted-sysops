// ============================================================================
// Custom Field Values Types (Epic 3C)
// Storage and rendering of custom field values for contacts/companies
// ============================================================================

import type { CustomFieldDefinition, CustomFieldType } from './type-system.types'

// ============================================================================
// Custom Field Values (Database Records)
// ============================================================================

/**
 * Raw custom field value as stored in database
 */
export interface CustomFieldValue {
  id: string
  contact_id: string | null
  company_id: string | null
  field_definition_id: string
  // Typed value columns
  value_text: string | null
  value_number: number | null
  value_date: string | null
  value_boolean: boolean | null
  value_json: unknown | null
  // Orphan tracking
  is_orphaned: boolean
  orphaned_at: string | null
  orphaned_type_name: string | null
  created_at: string
  updated_at: string
}

/**
 * Custom field value with its field definition (for rendering)
 */
export interface CustomFieldValueWithDefinition extends CustomFieldValue {
  definition: CustomFieldDefinition
}

/**
 * Custom fields grouped by type (for UI display)
 */
export interface CustomFieldsGroupedByType {
  typeId: string
  typeName: string
  typeColor: string
  typeIcon: string
  fields: CustomFieldValueWithDefinition[]
}

// ============================================================================
// Form Input/Output Types
// ============================================================================

/**
 * Generic value that can be any field type
 * - string: text, textarea, email, phone, url, dropdown
 * - number: number, currency
 * - Date | null: date
 * - boolean: checkbox
 * - string[]: multi_select
 */
export type CustomFieldInputValue =
  | string
  | number
  | Date
  | null
  | boolean
  | string[]

/**
 * Form data structure for a single field
 */
export interface CustomFieldFormValue {
  fieldDefinitionId: string
  value: CustomFieldInputValue
}

/**
 * Map of field definition ID to value (for form state)
 */
export type CustomFieldValuesMap = Record<string, CustomFieldInputValue>

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO for saving a single custom field value
 */
export interface SaveCustomFieldValueDTO {
  contact_id?: string
  company_id?: string
  field_definition_id: string
  value: CustomFieldInputValue
}

/**
 * DTO for saving multiple custom field values at once
 */
export interface SaveCustomFieldValuesDTO {
  contact_id?: string
  company_id?: string
  values: CustomFieldFormValue[]
}

// ============================================================================
// Type-Specific Helpers
// ============================================================================

/**
 * Maps field types to their corresponding value column
 */
export const FIELD_TYPE_VALUE_COLUMN: Record<CustomFieldType, keyof CustomFieldValue> = {
  text: 'value_text',
  textarea: 'value_text',
  email: 'value_text',
  phone: 'value_text',
  url: 'value_text',
  number: 'value_number',
  currency: 'value_number',
  date: 'value_date',
  checkbox: 'value_boolean',
  dropdown: 'value_json',
  multi_select: 'value_json',
}

/**
 * Field types that use text input
 */
export const TEXT_FIELD_TYPES: CustomFieldType[] = [
  'text',
  'textarea',
  'email',
  'phone',
  'url',
]

/**
 * Field types that use numeric input
 */
export const NUMERIC_FIELD_TYPES: CustomFieldType[] = [
  'number',
  'currency',
]

/**
 * Field types that have options (dropdown/multi-select)
 */
export const OPTION_FIELD_TYPES: CustomFieldType[] = [
  'dropdown',
  'multi_select',
]

/**
 * Field types that render as clickable links
 */
export const LINK_FIELD_TYPES: CustomFieldType[] = [
  'email',
  'phone',
  'url',
]
