import { useState, useEffect, useCallback, useRef } from 'react'
import type { CustomFieldDefinition } from '@/types/type-system.types'
import type {
  CustomFieldInputValue,
  CustomFieldValuesMap,
} from '@/types/custom-fields.types'
import {
  getCustomFieldsForContactType,
  getCustomFieldsForCompanyType,
  updateCustomField,
} from '@/lib/teamTypeService'
import {
  getCustomFieldValuesForContact,
  getCustomFieldValuesForCompany,
  saveCustomFieldValues,
  extractValue,
  valuesToFormValues,
} from '@/lib/customFieldValueService'

export type EntityType = 'contact' | 'company'

interface UseCustomFieldsOptions {
  entityType: EntityType
  entityId?: string // Undefined for create, set for edit
  typeIds: string[] // Current type IDs assigned to the entity
  types?: { id: string; name: string; color: string; icon: string }[] // Type metadata for grouping
}

interface CustomFieldsSection {
  typeId: string
  typeName: string
  typeColor: string
  typeIcon: string
  fields: CustomFieldDefinition[]
}

interface UseCustomFieldsResult {
  // State
  definitions: CustomFieldDefinition[]
  values: CustomFieldValuesMap
  loading: boolean
  saving: boolean
  errors: Record<string, string>

  // Sections grouped by type (for rendering)
  sections: CustomFieldsSection[]

  // Actions
  setValue: (fieldId: string, value: CustomFieldInputValue) => void
  setValues: (values: CustomFieldValuesMap) => void
  saveValues: (entityId: string) => Promise<void>
  addOptionToField: (fieldId: string, option: string) => Promise<void>
  validate: () => boolean
  reset: () => void
}

/**
 * Hook for managing custom field values in forms
 * Handles loading definitions, managing values, validation, and saving
 */
export function useCustomFields({
  entityType,
  entityId,
  typeIds,
  types = [],
}: UseCustomFieldsOptions): UseCustomFieldsResult {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([])
  const [values, setValues] = useState<CustomFieldValuesMap>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Track which type IDs we've loaded to avoid refetching
  const loadedTypeIdsRef = useRef<string[]>([])
  const loadedEntityIdRef = useRef<string | undefined>(undefined)

  // Load field definitions when typeIds change
  useEffect(() => {
    const loadDefinitions = async () => {
      if (typeIds.length === 0) {
        setDefinitions([])
        return
      }

      // Check if we already loaded these types
      const sortedTypeIds = [...typeIds].sort()
      const sortedLoadedIds = [...loadedTypeIdsRef.current].sort()
      if (JSON.stringify(sortedTypeIds) === JSON.stringify(sortedLoadedIds)) {
        return
      }

      setLoading(true)
      try {
        const fetchFn =
          entityType === 'contact'
            ? getCustomFieldsForContactType
            : getCustomFieldsForCompanyType

        // Fetch definitions for all types in parallel
        const results = await Promise.all(typeIds.map((id) => fetchFn(id)))

        // Flatten and dedupe by field ID
        const allDefs = results.flat()
        const uniqueDefs = Array.from(
          new Map(allDefs.map((d) => [d.id, d])).values()
        )

        setDefinitions(uniqueDefs)
        loadedTypeIdsRef.current = typeIds
      } catch (err) {
        console.error('Error loading custom field definitions:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDefinitions()
  }, [typeIds, entityType])

  // Load existing values when editing
  useEffect(() => {
    const loadValues = async () => {
      if (!entityId || loadedEntityIdRef.current === entityId) {
        return
      }

      setLoading(true)
      try {
        const fetchFn =
          entityType === 'contact'
            ? getCustomFieldValuesForContact
            : getCustomFieldValuesForCompany

        const fieldValues = await fetchFn(entityId)

        // Convert to values map
        const map: CustomFieldValuesMap = {}
        for (const fv of fieldValues) {
          map[fv.field_definition_id] = extractValue(fv, fv.definition.field_type)
        }

        setValues(map)
        loadedEntityIdRef.current = entityId
      } catch (err) {
        console.error('Error loading custom field values:', err)
      } finally {
        setLoading(false)
      }
    }

    loadValues()
  }, [entityId, entityType])

  // Group definitions by type for rendering
  const sections: CustomFieldsSection[] = types
    .filter((t) => typeIds.includes(t.id))
    .map((type) => ({
      typeId: type.id,
      typeName: type.name,
      typeColor: type.color,
      typeIcon: type.icon,
      fields: definitions.filter((d) =>
        entityType === 'contact'
          ? d.team_contact_type_id === type.id
          : d.team_company_type_id === type.id
      ),
    }))
    .filter((section) => section.fields.length > 0)

  // Set a single value
  const setValue = useCallback((fieldId: string, value: CustomFieldInputValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }, [])

  // Set multiple values at once
  const setValuesCallback = useCallback((newValues: CustomFieldValuesMap) => {
    setValues(newValues)
    setErrors({})
  }, [])

  // Validate required fields
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    for (const def of definitions) {
      if (def.is_required) {
        const value = values[def.id]
        const isEmpty =
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)

        if (isEmpty) {
          newErrors[def.id] = `${def.name} is required`
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [definitions, values])

  // Save values to the database
  const saveValuesCallback = useCallback(
    async (targetEntityId: string) => {
      if (!targetEntityId) return

      setSaving(true)
      try {
        const formValues = valuesToFormValues(values)

        await saveCustomFieldValues({
          contact_id: entityType === 'contact' ? targetEntityId : undefined,
          company_id: entityType === 'company' ? targetEntityId : undefined,
          values: formValues,
        })
      } catch (err) {
        console.error('Error saving custom field values:', err)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [entityType, values]
  )

  // Add a new option to a dropdown/multi_select field
  const addOptionToField = useCallback(
    async (fieldId: string, option: string) => {
      const def = definitions.find((d) => d.id === fieldId)
      if (!def) return

      const currentOptions = def.options || []
      if (currentOptions.includes(option)) return

      const newOptions = [...currentOptions, option]

      await updateCustomField(fieldId, { options: newOptions })

      // Update local state
      setDefinitions((prev) =>
        prev.map((d) =>
          d.id === fieldId ? { ...d, options: newOptions } : d
        )
      )
    },
    [definitions]
  )

  // Reset the hook state
  const reset = useCallback(() => {
    setValues({})
    setErrors({})
    loadedTypeIdsRef.current = []
    loadedEntityIdRef.current = undefined
  }, [])

  return {
    definitions,
    values,
    loading,
    saving,
    errors,
    sections,
    setValue,
    setValues: setValuesCallback,
    saveValues: saveValuesCallback,
    addOptionToField,
    validate,
    reset,
  }
}
