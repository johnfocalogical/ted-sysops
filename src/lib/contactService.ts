import { supabase } from './supabase'
import type {
  Contact,
  ContactType,
  ContactWithDetails,
  ContactListItem,
  CreateContactDTO,
  UpdateContactDTO,
} from '@/types/contact.types'
import {
  saveContactMethodsForContact,
  getPrimaryPhone,
  getPrimaryEmail,
} from './contactMethodHelpers'

// ============================================================================
// Types
// ============================================================================

export interface ContactsParams {
  teamId: string
  page: number
  pageSize: number
  search?: string
  typeIds?: string[]
}

export interface PaginatedContacts {
  data: ContactListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// Contact Types (Lookup)
// ============================================================================

/**
 * Get all contact types for a team (active only)
 */
export async function getContactTypes(teamId: string): Promise<ContactType[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_contact_types')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  // Map to ContactType interface (adding icon field)
  return (data || []).map((type) => ({
    id: type.id,
    name: type.name,
    description: type.description,
    color: type.color,
    icon: type.icon,
    sort_order: type.sort_order,
    is_active: type.is_active,
    created_at: type.created_at,
  }))
}

// ============================================================================
// Contact CRUD
// ============================================================================

/**
 * Get contacts with pagination, search, and filtering
 */
export async function getContacts(params: ContactsParams): Promise<PaginatedContacts> {
  if (!supabase) throw new Error('Supabase not configured')

  const { teamId, page, pageSize, search, typeIds } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build base query
  let query = supabase
    .from('contacts')
    .select(
      `
      *,
      type_assignments:contact_type_assignments (
        type:team_contact_types (*)
      ),
      contact_methods (*),
      company_links:contact_companies (
        company:companies (
          id,
          name
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('team_id', teamId)

  // Apply search filter
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    )
  }

  // Apply type filter (if typeIds provided)
  if (typeIds && typeIds.length > 0) {
    // Need to filter by type assignments - this requires a more complex query
    // For now, we'll filter in memory after fetching
  }

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Transform data to list items
  let listItems: ContactListItem[] = (data || []).map((contact) => {
    const types = (contact.type_assignments || [])
      .map((ta: { type: ContactType }) => ta.type)
      .filter(Boolean)

    const methods = contact.contact_methods || []
    const companyNames = (contact.company_links || [])
      .map((cl: { company: { name: string } }) => cl.company?.name)
      .filter(Boolean)

    return {
      id: contact.id,
      team_id: contact.team_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      notes: contact.notes,
      created_by: contact.created_by,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      types,
      primary_phone: getPrimaryPhone(methods),
      primary_email: getPrimaryEmail(methods),
      company_names: companyNames,
    }
  })

  // Apply type filter in memory if needed
  if (typeIds && typeIds.length > 0) {
    listItems = listItems.filter((item) =>
      item.types.some((t) => typeIds.includes(t.id))
    )
  }

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: listItems,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get a single contact with full details
 */
export async function getContactById(contactId: string): Promise<ContactWithDetails | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('contacts')
    .select(
      `
      *,
      type_assignments:contact_type_assignments (
        type:team_contact_types (*)
      ),
      contact_methods (*),
      company_links:contact_companies (
        id,
        contact_id,
        company_id,
        role_title,
        is_primary,
        created_at,
        updated_at,
        company:companies (
          id,
          name,
          city,
          state,
          type_assignments:company_type_assignments (
            type:team_company_types (
              id,
              name,
              icon,
              color
            )
          )
        ),
        work_methods:contact_methods (*)
      ),
      created_by_user:users!contacts_created_by_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq('id', contactId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Transform to ContactWithDetails
  const types = (data.type_assignments || [])
    .map((ta: { type: ContactType }) => ta.type)
    .filter(Boolean)

  const companies = (data.company_links || []).map((cl: {
    id: string
    contact_id: string
    company_id: string
    role_title: string | null
    is_primary: boolean
    created_at: string
    updated_at: string
    company: {
      id: string
      name: string
      city: string | null
      state: string | null
      type_assignments?: Array<{ type: { id: string; name: string; icon: string; color: string } }>
    }
    work_methods: typeof data.contact_methods
  }) => ({
    id: cl.id,
    contact_id: cl.contact_id,
    company_id: cl.company_id,
    role_title: cl.role_title,
    is_primary: cl.is_primary,
    created_at: cl.created_at,
    updated_at: cl.updated_at,
    company: {
      id: cl.company.id,
      name: cl.company.name,
      city: cl.company.city,
      state: cl.company.state,
      types: (cl.company.type_assignments || [])
        .map((ta) => ta.type)
        .filter(Boolean),
    },
    contact_methods: cl.work_methods || [],
  }))

  return {
    id: data.id,
    team_id: data.team_id,
    first_name: data.first_name,
    last_name: data.last_name,
    notes: data.notes,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    types,
    contact_methods: data.contact_methods || [],
    companies,
    created_by_user: data.created_by_user || null,
  }
}

/**
 * Create a new contact
 */
export async function createContact(dto: CreateContactDTO, userId: string): Promise<Contact> {
  if (!supabase) throw new Error('Supabase not configured')

  // Create the contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      team_id: dto.team_id,
      first_name: dto.first_name,
      last_name: dto.last_name || null,
      notes: dto.notes || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // Assign types if provided
  if (dto.type_ids && dto.type_ids.length > 0) {
    const { error: typeError } = await supabase
      .from('contact_type_assignments')
      .insert(
        dto.type_ids.map((typeId) => ({
          contact_id: contact.id,
          type_id: typeId,
        }))
      )

    if (typeError) throw typeError
  }

  // Save contact methods if provided
  if (dto.contact_methods && dto.contact_methods.length > 0) {
    await saveContactMethodsForContact(contact.id, dto.contact_methods)
  }

  return contact
}

/**
 * Update an existing contact
 */
export async function updateContact(
  contactId: string,
  dto: UpdateContactDTO
): Promise<Contact> {
  if (!supabase) throw new Error('Supabase not configured')

  // Update basic fields
  const updates: Record<string, unknown> = {}
  if (dto.first_name !== undefined) updates.first_name = dto.first_name
  if (dto.last_name !== undefined) updates.last_name = dto.last_name
  if (dto.notes !== undefined) updates.notes = dto.notes

  const { data: contact, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single()

  if (error) throw error

  // Update type assignments if provided
  if (dto.type_ids !== undefined) {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('contact_type_assignments')
      .delete()
      .eq('contact_id', contactId)

    if (deleteError) throw deleteError

    // Insert new assignments
    if (dto.type_ids.length > 0) {
      const { error: insertError } = await supabase
        .from('contact_type_assignments')
        .insert(
          dto.type_ids.map((typeId) => ({
            contact_id: contactId,
            type_id: typeId,
          }))
        )

      if (insertError) throw insertError
    }
  }

  return contact
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)

  if (error) throw error
}

/**
 * Check if a contact can be deleted (returns info about dependencies)
 */
export async function getContactDeletionInfo(contactId: string): Promise<{
  companyLinkCount: number
  isPocForCompanies: string[]
}> {
  if (!supabase) throw new Error('Supabase not configured')

  // Count company links
  const { count: linkCount } = await supabase
    .from('contact_companies')
    .select('id', { count: 'exact', head: true })
    .eq('contact_id', contactId)

  // Get companies where this contact is POC
  const { data: pocCompanies } = await supabase
    .from('companies')
    .select('name')
    .eq('poc_contact_id', contactId)

  return {
    companyLinkCount: linkCount || 0,
    isPocForCompanies: (pocCompanies || []).map((c: { name: string }) => c.name),
  }
}

/**
 * Search contacts by name (for autocomplete/select)
 */
export async function searchContacts(
  teamId: string,
  search: string,
  limit: number = 10
): Promise<Pick<Contact, 'id' | 'first_name' | 'last_name'>[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('team_id', teamId)
    .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    .order('first_name', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}
