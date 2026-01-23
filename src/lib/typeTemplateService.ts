import { supabase } from './supabase'
import type {
  ContactTypeTemplate,
  ContactTypeTemplateWithUsage,
  CompanyTypeTemplate,
  CompanyTypeTemplateWithUsage,
  CreateTypeTemplateDTO,
  UpdateTypeTemplateDTO,
} from '@/types/type-system.types'

// ============================================================================
// Contact Type Templates (Superadmin)
// ============================================================================

/**
 * Get all contact type templates with usage counts
 */
export async function getContactTypeTemplates(): Promise<ContactTypeTemplateWithUsage[]> {
  const { data, error } = await supabase
    .from('contact_type_templates')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  // Get usage counts for each template
  const templatesWithUsage: ContactTypeTemplateWithUsage[] = []
  for (const template of data || []) {
    const { count } = await supabase
      .from('team_contact_types')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', template.id)

    templatesWithUsage.push({
      ...template,
      usage_count: count || 0,
    })
  }

  return templatesWithUsage
}

/**
 * Get a single contact type template by ID
 */
export async function getContactTypeTemplate(id: string): Promise<ContactTypeTemplate | null> {
  const { data, error } = await supabase
    .from('contact_type_templates')
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
 * Create a new contact type template
 */
export async function createContactTypeTemplate(
  dto: CreateTypeTemplateDTO
): Promise<ContactTypeTemplate> {
  const { data, error } = await supabase
    .from('contact_type_templates')
    .insert({
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon,
      color: dto.color,
      auto_install: dto.auto_install ?? true,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update a contact type template
 */
export async function updateContactTypeTemplate(
  id: string,
  dto: UpdateTypeTemplateDTO
): Promise<ContactTypeTemplate> {
  // First check if it's a system template
  const existing = await getContactTypeTemplate(id)
  if (existing?.is_system) {
    throw new Error('Cannot modify system templates')
  }

  const { data, error } = await supabase
    .from('contact_type_templates')
    .update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.auto_install !== undefined && { auto_install: dto.auto_install }),
      ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a contact type template
 */
export async function deleteContactTypeTemplate(id: string): Promise<void> {
  // First check if it's a system template
  const existing = await getContactTypeTemplate(id)
  if (existing?.is_system) {
    throw new Error('Cannot delete system templates')
  }

  const { error } = await supabase
    .from('contact_type_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Check if a contact type template name is unique
 */
export async function isContactTypeTemplateNameUnique(
  name: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('contact_type_templates')
    .select('id')
    .eq('name', name)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error

  return !data || data.length === 0
}

// ============================================================================
// Company Type Templates (Superadmin)
// ============================================================================

/**
 * Get all company type templates with usage counts
 */
export async function getCompanyTypeTemplates(): Promise<CompanyTypeTemplateWithUsage[]> {
  const { data, error } = await supabase
    .from('company_type_templates')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  // Get usage counts for each template
  const templatesWithUsage: CompanyTypeTemplateWithUsage[] = []
  for (const template of data || []) {
    const { count } = await supabase
      .from('team_company_types')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', template.id)

    templatesWithUsage.push({
      ...template,
      usage_count: count || 0,
    })
  }

  return templatesWithUsage
}

/**
 * Get a single company type template by ID
 */
export async function getCompanyTypeTemplate(id: string): Promise<CompanyTypeTemplate | null> {
  const { data, error } = await supabase
    .from('company_type_templates')
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
 * Create a new company type template
 */
export async function createCompanyTypeTemplate(
  dto: CreateTypeTemplateDTO
): Promise<CompanyTypeTemplate> {
  const { data, error } = await supabase
    .from('company_type_templates')
    .insert({
      name: dto.name,
      description: dto.description || null,
      icon: dto.icon,
      color: dto.color,
      auto_install: dto.auto_install ?? true,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update a company type template
 */
export async function updateCompanyTypeTemplate(
  id: string,
  dto: UpdateTypeTemplateDTO
): Promise<CompanyTypeTemplate> {
  // First check if it's a system template
  const existing = await getCompanyTypeTemplate(id)
  if (existing?.is_system) {
    throw new Error('Cannot modify system templates')
  }

  const { data, error } = await supabase
    .from('company_type_templates')
    .update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.auto_install !== undefined && { auto_install: dto.auto_install }),
      ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Delete a company type template
 */
export async function deleteCompanyTypeTemplate(id: string): Promise<void> {
  // First check if it's a system template
  const existing = await getCompanyTypeTemplate(id)
  if (existing?.is_system) {
    throw new Error('Cannot delete system templates')
  }

  const { error } = await supabase
    .from('company_type_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Check if a company type template name is unique
 */
export async function isCompanyTypeTemplateNameUnique(
  name: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('company_type_templates')
    .select('id')
    .eq('name', name)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error

  return !data || data.length === 0
}
