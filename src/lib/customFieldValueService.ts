import { supabase } from './supabase'
import type {
  CustomFieldValue,
  CustomFieldValueWithDefinition,
  CustomFieldsGroupedByType,
  SaveCustomFieldValuesDTO,
  CustomFieldInputValue,
  CustomFieldFormValue,
} from '@/types/custom-fields.types'
import type { CustomFieldDefinition, CustomFieldType } from '@/types/type-system.types'

// ============================================================================
// Fetch Values
// ============================================================================

/**
 * Get all custom field values for a contact
 */
export async function getCustomFieldValuesForContact(
  contactId: string,
  includeOrphaned: boolean = false
): Promise<CustomFieldValueWithDefinition[]> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from('custom_field_values')
    .select(`
      *,
      definition:custom_field_definitions (*)
    `)
    .eq('contact_id', contactId)

  if (!includeOrphaned) {
    query = query.eq('is_orphaned', false)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    definition: row.definition as CustomFieldDefinition,
  }))
}

/**
 * Get all custom field values for a company
 */
export async function getCustomFieldValuesForCompany(
  companyId: string,
  includeOrphaned: boolean = false
): Promise<CustomFieldValueWithDefinition[]> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from('custom_field_values')
    .select(`
      *,
      definition:custom_field_definitions (*)
    `)
    .eq('company_id', companyId)

  if (!includeOrphaned) {
    query = query.eq('is_orphaned', false)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((row) => ({
    ...row,
    definition: row.definition as CustomFieldDefinition,
  }))
}

/**
 * Get custom field values grouped by type for a contact (for detail view display)
 */
export async function getContactCustomFieldsGroupedByType(
  contactId: string,
  types: { id: string; name: string; color: string; icon: string }[]
): Promise<CustomFieldsGroupedByType[]> {
  const values = await getCustomFieldValuesForContact(contactId, false)

  return types
    .map((type) => ({
      typeId: type.id,
      typeName: type.name,
      typeColor: type.color,
      typeIcon: type.icon,
      fields: values.filter(
        (v) => v.definition.team_contact_type_id === type.id
      ),
    }))
    .filter((group) => group.fields.length > 0)
}

/**
 * Get custom field values grouped by type for a company (for detail view display)
 */
export async function getCompanyCustomFieldsGroupedByType(
  companyId: string,
  types: { id: string; name: string; color: string; icon: string }[]
): Promise<CustomFieldsGroupedByType[]> {
  const values = await getCustomFieldValuesForCompany(companyId, false)

  return types
    .map((type) => ({
      typeId: type.id,
      typeName: type.name,
      typeColor: type.color,
      typeIcon: type.icon,
      fields: values.filter(
        (v) => v.definition.team_company_type_id === type.id
      ),
    }))
    .filter((group) => group.fields.length > 0)
}

// ============================================================================
// Save Values
// ============================================================================

/**
 * Save custom field values for a contact/company
 * Uses upsert to handle both create and update
 */
export async function saveCustomFieldValues(
  dto: SaveCustomFieldValuesDTO
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { contact_id, company_id, values } = dto

  if (!contact_id && !company_id) {
    throw new Error('Either contact_id or company_id must be provided')
  }

  if (values.length === 0) return

  // Build upsert records
  const records = values
    .filter((v) => !isEmpty(v.value))
    .map(({ fieldDefinitionId, value }) => ({
      contact_id: contact_id || null,
      company_id: company_id || null,
      field_definition_id: fieldDefinitionId,
      ...valueToColumns(value),
    }))

  if (records.length === 0) return

  // Upsert records
  const { error } = await supabase.from('custom_field_values').upsert(records, {
    onConflict: contact_id
      ? 'contact_id,field_definition_id'
      : 'company_id,field_definition_id',
    ignoreDuplicates: false,
  })

  if (error) throw error

  // Delete empty values
  const emptyFieldIds = values
    .filter((v) => isEmpty(v.value))
    .map((v) => v.fieldDefinitionId)

  if (emptyFieldIds.length > 0) {
    let deleteQuery = supabase
      .from('custom_field_values')
      .delete()
      .in('field_definition_id', emptyFieldIds)

    if (contact_id) {
      deleteQuery = deleteQuery.eq('contact_id', contact_id)
    } else if (company_id) {
      deleteQuery = deleteQuery.eq('company_id', company_id)
    }

    await deleteQuery
  }
}

/**
 * Delete a specific custom field value
 */
export async function deleteCustomFieldValue(valueId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('custom_field_values')
    .delete()
    .eq('id', valueId)

  if (error) throw error
}

/**
 * Clear all custom field values for a contact/company
 */
export async function clearCustomFieldValues(
  entityType: 'contact' | 'company',
  entityId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const column = entityType === 'contact' ? 'contact_id' : 'company_id'

  const { error } = await supabase
    .from('custom_field_values')
    .delete()
    .eq(column, entityId)

  if (error) throw error
}

// ============================================================================
// Value Conversion Utilities
// ============================================================================

/**
 * Check if a value is empty
 */
function isEmpty(value: CustomFieldInputValue): boolean {
  if (value === null || value === undefined) return true
  if (value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/**
 * Convert a typed value to database column values
 */
function valueToColumns(
  value: CustomFieldInputValue
): Partial<CustomFieldValue> {
  // Reset all value columns
  const columns: Partial<CustomFieldValue> = {
    value_text: null,
    value_number: null,
    value_date: null,
    value_boolean: null,
    value_json: null,
  }

  if (value === null || value === undefined) {
    return columns
  }

  if (typeof value === 'string') {
    columns.value_text = value
  } else if (typeof value === 'number') {
    columns.value_number = value
  } else if (typeof value === 'boolean') {
    columns.value_boolean = value
  } else if (value instanceof Date) {
    columns.value_date = value.toISOString().split('T')[0]
  } else if (Array.isArray(value)) {
    columns.value_json = value
  }

  return columns
}

/**
 * Extract the actual value from database columns based on field type
 */
export function extractValue(
  row: CustomFieldValue | CustomFieldValueWithDefinition,
  fieldType: CustomFieldType
): CustomFieldInputValue {
  switch (fieldType) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
    case 'url':
      return row.value_text || ''
    case 'number':
    case 'currency':
      return row.value_number ?? 0
    case 'date':
      return row.value_date ? new Date(row.value_date) : null
    case 'checkbox':
      return row.value_boolean ?? false
    case 'dropdown':
      return (row.value_json as string) || ''
    case 'multi_select':
      return (row.value_json as string[]) || []
    default:
      return row.value_text || ''
  }
}

/**
 * Format a value for display based on field type
 */
export function formatValueForDisplay(
  value: CustomFieldInputValue,
  fieldType: CustomFieldType
): string {
  if (value === null || value === undefined || value === '') return ''

  switch (fieldType) {
    case 'currency':
      return typeof value === 'number'
        ? `$${value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : ''
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : ''
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      return ''
    case 'checkbox':
      return value ? 'Yes' : 'No'
    case 'multi_select':
      return Array.isArray(value) ? value.join(', ') : ''
    case 'url':
    case 'email':
    case 'phone':
    case 'text':
    case 'textarea':
    case 'dropdown':
    default:
      return String(value)
  }
}

/**
 * Convert values map to form values array
 */
export function valuesToFormValues(
  valuesMap: Record<string, CustomFieldInputValue>
): CustomFieldFormValue[] {
  return Object.entries(valuesMap).map(([fieldDefinitionId, value]) => ({
    fieldDefinitionId,
    value,
  }))
}

/**
 * Convert form values array to values map
 */
export function formValuesToMap(
  formValues: CustomFieldFormValue[]
): Record<string, CustomFieldInputValue> {
  const map: Record<string, CustomFieldInputValue> = {}
  for (const { fieldDefinitionId, value } of formValues) {
    map[fieldDefinitionId] = value
  }
  return map
}
