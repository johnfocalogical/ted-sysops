import { supabase } from './supabase'
import type {
  TeamContactType,
  TeamContactTypeWithUsage,
  TeamCompanyType,
  TeamCompanyTypeWithUsage,
  CustomFieldDefinition,
  CreateTeamTypeDTO,
  UpdateTeamTypeDTO,
  CreateCustomFieldDTO,
  UpdateCustomFieldDTO,
} from '@/types/type-system.types'

// ============================================================================
// Team Contact Types
// ============================================================================

/**
 * Get all contact types for a team with usage counts
 */
export async function getTeamContactTypes(teamId: string): Promise<TeamContactTypeWithUsage[]> {
  const { data, error } = await supabase
    .from('team_contact_types')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  // Get usage counts for each type
  const typesWithUsage: TeamContactTypeWithUsage[] = []
  for (const type of data || []) {
    const { count } = await supabase
      .from('contact_type_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('type_id', type.id)

    typesWithUsage.push({
      ...type,
      usage_count: count || 0,
    })
  }

  return typesWithUsage
}

/**
 * Get active contact types for a team (for dropdowns)
 */
export async function getActiveTeamContactTypes(teamId: string): Promise<TeamContactType[]> {
  const { data, error } = await supabase
    .from('team_contact_types')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Get a single team contact type by ID
 */
export async function getTeamContactType(id: string): Promise<TeamContactType | null> {
  const { data, error } = await supabase
    .from('team_contact_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

/**
 * Create a new team contact type
 */
export async function createTeamContactType(dto: CreateTeamTypeDTO): Promise<TeamContactType> {
  const { data, error } = await supabase
    .from('team_contact_types')
    .insert({
      team_id: dto.team_id,
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon,
      color: dto.color,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update a team contact type
 */
export async function updateTeamContactType(
  id: string,
  dto: UpdateTeamTypeDTO
): Promise<TeamContactType> {
  const { data, error } = await supabase
    .from('team_contact_types')
    .update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a team contact type (only if unused)
 */
export async function deleteTeamContactType(id: string): Promise<void> {
  // Check if it can be deleted
  const canDelete = await canDeleteTeamContactType(id)
  if (!canDelete.canDelete) {
    throw new Error(canDelete.reason || 'Cannot delete this type')
  }

  const { error } = await supabase
    .from('team_contact_types')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Check if a team contact type can be deleted
 */
export async function canDeleteTeamContactType(
  id: string
): Promise<{ canDelete: boolean; reason?: string }> {
  const { count } = await supabase
    .from('contact_type_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('type_id', id)

  if (count && count > 0) {
    return {
      canDelete: false,
      reason: `This type is assigned to ${count} contact${count === 1 ? '' : 's'}. Deactivate it instead.`,
    }
  }

  return { canDelete: true }
}

/**
 * Check if a team contact type name is unique within the team
 */
export async function isTeamContactTypeNameUnique(
  teamId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('team_contact_types')
    .select('id')
    .eq('team_id', teamId)
    .eq('name', name)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error

  return !data || data.length === 0
}

// ============================================================================
// Team Company Types
// ============================================================================

/**
 * Get all company types for a team with usage counts
 */
export async function getTeamCompanyTypes(teamId: string): Promise<TeamCompanyTypeWithUsage[]> {
  const { data, error } = await supabase
    .from('team_company_types')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  // Get usage counts for each type
  const typesWithUsage: TeamCompanyTypeWithUsage[] = []
  for (const type of data || []) {
    const { count } = await supabase
      .from('company_type_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('type_id', type.id)

    typesWithUsage.push({
      ...type,
      usage_count: count || 0,
    })
  }

  return typesWithUsage
}

/**
 * Get active company types for a team (for dropdowns)
 */
export async function getActiveTeamCompanyTypes(teamId: string): Promise<TeamCompanyType[]> {
  const { data, error } = await supabase
    .from('team_company_types')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Get a single team company type by ID
 */
export async function getTeamCompanyType(id: string): Promise<TeamCompanyType | null> {
  const { data, error } = await supabase
    .from('team_company_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

/**
 * Create a new team company type
 */
export async function createTeamCompanyType(dto: CreateTeamTypeDTO): Promise<TeamCompanyType> {
  const { data, error } = await supabase
    .from('team_company_types')
    .insert({
      team_id: dto.team_id,
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon,
      color: dto.color,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update a team company type
 */
export async function updateTeamCompanyType(
  id: string,
  dto: UpdateTeamTypeDTO
): Promise<TeamCompanyType> {
  const { data, error } = await supabase
    .from('team_company_types')
    .update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a team company type (only if unused)
 */
export async function deleteTeamCompanyType(id: string): Promise<void> {
  // Check if it can be deleted
  const canDelete = await canDeleteTeamCompanyType(id)
  if (!canDelete.canDelete) {
    throw new Error(canDelete.reason || 'Cannot delete this type')
  }

  const { error } = await supabase
    .from('team_company_types')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Check if a team company type can be deleted
 */
export async function canDeleteTeamCompanyType(
  id: string
): Promise<{ canDelete: boolean; reason?: string }> {
  const { count } = await supabase
    .from('company_type_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('type_id', id)

  if (count && count > 0) {
    return {
      canDelete: false,
      reason: `This type is assigned to ${count} compan${count === 1 ? 'y' : 'ies'}. Deactivate it instead.`,
    }
  }

  return { canDelete: true }
}

/**
 * Check if a team company type name is unique within the team
 */
export async function isTeamCompanyTypeNameUnique(
  teamId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('team_company_types')
    .select('id')
    .eq('team_id', teamId)
    .eq('name', name)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error

  return !data || data.length === 0
}

// ============================================================================
// Custom Field Definitions
// ============================================================================

/**
 * Get custom fields for a contact type
 */
export async function getCustomFieldsForContactType(
  typeId: string
): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('team_contact_type_id', typeId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Get custom fields for a company type
 */
export async function getCustomFieldsForCompanyType(
  typeId: string
): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('team_company_type_id', typeId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return data || []
}

/**
 * Create a custom field definition
 */
export async function createCustomField(dto: CreateCustomFieldDTO): Promise<CustomFieldDefinition> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert({
      team_contact_type_id: dto.team_contact_type_id || null,
      team_company_type_id: dto.team_company_type_id || null,
      name: dto.name,
      field_type: dto.field_type,
      description: dto.description || null,
      is_required: dto.is_required ?? false,
      options: dto.options || null,
      default_value: dto.default_value || null,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update a custom field definition
 */
export async function updateCustomField(
  id: string,
  dto: UpdateCustomFieldDTO
): Promise<CustomFieldDefinition> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.field_type !== undefined && { field_type: dto.field_type }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.is_required !== undefined && { is_required: dto.is_required }),
      ...(dto.options !== undefined && { options: dto.options }),
      ...(dto.default_value !== undefined && { default_value: dto.default_value }),
      ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a custom field definition
 */
export async function deleteCustomField(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_field_definitions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Reorder custom fields for a type
 */
export async function reorderCustomFields(
  fieldIds: string[]
): Promise<void> {
  // Update sort_order for each field
  for (let i = 0; i < fieldIds.length; i++) {
    const { error } = await supabase
      .from('custom_field_definitions')
      .update({ sort_order: i })
      .eq('id', fieldIds[i])

    if (error) throw error
  }
}
