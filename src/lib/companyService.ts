import { supabase } from './supabase'
import type {
  Company,
  CompanyType,
  CompanyWithDetails,
  CompanyListItem,
  CreateCompanyDTO,
  UpdateCompanyDTO,
  ContactCompany,
  LinkContactToCompanyDTO,
  UpdateContactCompanyDTO,
} from '@/types/company.types'
import type { ContactMethod } from '@/types/contact.types'
import {
  saveContactMethodsForCompany,
  saveContactMethodsForRelationship,
  getPrimaryPhone,
  getPrimaryEmail,
} from './contactMethodHelpers'

// ============================================================================
// Types
// ============================================================================

export interface CompaniesParams {
  teamId: string
  page: number
  pageSize: number
  search?: string
  typeIds?: string[]
}

export interface PaginatedCompanies {
  data: CompanyListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// Company Types (Lookup)
// ============================================================================

/**
 * Get all company types for a team (active only)
 */
export async function getCompanyTypes(teamId: string): Promise<CompanyType[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_company_types')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  // Map to CompanyType interface (adding icon field)
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
// Company CRUD
// ============================================================================

/**
 * Get companies with pagination, search, and filtering
 */
export async function getCompanies(params: CompaniesParams): Promise<PaginatedCompanies> {
  if (!supabase) throw new Error('Supabase not configured')

  const { teamId, page, pageSize, search, typeIds } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build base query
  let query = supabase
    .from('companies')
    .select(
      `
      *,
      type_assignments:company_type_assignments (
        type:team_company_types (*)
      ),
      contact_methods (*),
      poc_contact:contacts!companies_poc_contact_id_fkey (
        id,
        first_name,
        last_name
      )
    `,
      { count: 'exact' }
    )
    .eq('team_id', teamId)

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`)
  }

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Transform data to list items
  let listItems: CompanyListItem[] = (data || []).map((company) => {
    const types = (company.type_assignments || [])
      .map((ta: { type: CompanyType }) => ta.type)
      .filter(Boolean)

    const methods = company.contact_methods || []
    const poc = company.poc_contact

    return {
      id: company.id,
      team_id: company.team_id,
      name: company.name,
      address: company.address,
      city: company.city,
      state: company.state,
      zip: company.zip,
      website: company.website,
      notes: company.notes,
      poc_contact_id: company.poc_contact_id,
      created_by: company.created_by,
      created_at: company.created_at,
      updated_at: company.updated_at,
      types,
      primary_phone: getPrimaryPhone(methods),
      primary_email: getPrimaryEmail(methods),
      poc_name: poc
        ? `${poc.first_name}${poc.last_name ? ' ' + poc.last_name : ''}`
        : null,
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
 * Get a single company with full details
 */
export async function getCompanyById(companyId: string): Promise<CompanyWithDetails | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('companies')
    .select(
      `
      *,
      type_assignments:company_type_assignments (
        type:team_company_types (*)
      ),
      contact_methods (*),
      contact_links:contact_companies (
        id,
        contact_id,
        company_id,
        role_title,
        is_primary,
        created_at,
        updated_at,
        contact:contacts (
          id,
          first_name,
          last_name
        ),
        work_methods:contact_methods (*)
      ),
      poc_contact:contacts!companies_poc_contact_id_fkey (
        id,
        first_name,
        last_name
      ),
      created_by_user:users!companies_created_by_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq('id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Transform to CompanyWithDetails
  const types = (data.type_assignments || [])
    .map((ta: { type: CompanyType }) => ta.type)
    .filter(Boolean)

  const contacts = (data.contact_links || []).map((cl: {
    id: string
    contact_id: string
    company_id: string
    role_title: string | null
    is_primary: boolean
    created_at: string
    updated_at: string
    contact: { id: string; first_name: string; last_name: string | null }
    work_methods: ContactMethod[]
  }) => ({
    id: cl.id,
    contact_id: cl.contact_id,
    company_id: cl.company_id,
    role_title: cl.role_title,
    is_primary: cl.is_primary,
    created_at: cl.created_at,
    updated_at: cl.updated_at,
    contact: cl.contact,
    contact_methods: cl.work_methods || [],
  }))

  return {
    id: data.id,
    team_id: data.team_id,
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    website: data.website,
    notes: data.notes,
    poc_contact_id: data.poc_contact_id,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    types,
    contact_methods: data.contact_methods || [],
    contacts,
    poc_contact: data.poc_contact || null,
    created_by_user: data.created_by_user || null,
  }
}

/**
 * Create a new company
 */
export async function createCompany(dto: CreateCompanyDTO, userId: string): Promise<Company> {
  if (!supabase) throw new Error('Supabase not configured')

  // Create the company
  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      team_id: dto.team_id,
      name: dto.name,
      address: dto.address || null,
      city: dto.city || null,
      state: dto.state || null,
      zip: dto.zip || null,
      website: dto.website || null,
      notes: dto.notes || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // Assign types if provided
  if (dto.type_ids && dto.type_ids.length > 0) {
    const { error: typeError } = await supabase
      .from('company_type_assignments')
      .insert(
        dto.type_ids.map((typeId) => ({
          company_id: company.id,
          type_id: typeId,
        }))
      )

    if (typeError) throw typeError
  }

  // Save contact methods if provided
  if (dto.contact_methods && dto.contact_methods.length > 0) {
    await saveContactMethodsForCompany(company.id, dto.contact_methods)
  }

  return company
}

/**
 * Update an existing company
 */
export async function updateCompany(
  companyId: string,
  dto: UpdateCompanyDTO
): Promise<Company> {
  if (!supabase) throw new Error('Supabase not configured')

  // Update basic fields
  const updates: Record<string, unknown> = {}
  if (dto.name !== undefined) updates.name = dto.name
  if (dto.address !== undefined) updates.address = dto.address
  if (dto.city !== undefined) updates.city = dto.city
  if (dto.state !== undefined) updates.state = dto.state
  if (dto.zip !== undefined) updates.zip = dto.zip
  if (dto.website !== undefined) updates.website = dto.website
  if (dto.notes !== undefined) updates.notes = dto.notes
  if (dto.poc_contact_id !== undefined) updates.poc_contact_id = dto.poc_contact_id

  const { data: company, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single()

  if (error) throw error

  // Update type assignments if provided
  if (dto.type_ids !== undefined) {
    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('company_type_assignments')
      .delete()
      .eq('company_id', companyId)

    if (deleteError) throw deleteError

    // Insert new assignments
    if (dto.type_ids.length > 0) {
      const { error: insertError } = await supabase
        .from('company_type_assignments')
        .insert(
          dto.type_ids.map((typeId) => ({
            company_id: companyId,
            type_id: typeId,
          }))
        )

      if (insertError) throw insertError
    }
  }

  return company
}

/**
 * Delete a company
 */
export async function deleteCompany(companyId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId)

  if (error) throw error
}

/**
 * Check if a company can be deleted (returns info about dependencies)
 */
export async function getCompanyDeletionInfo(companyId: string): Promise<{
  contactLinkCount: number
}> {
  if (!supabase) throw new Error('Supabase not configured')

  // Count contact links
  const { count: linkCount } = await supabase
    .from('contact_companies')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  return {
    contactLinkCount: linkCount || 0,
  }
}

/**
 * Search companies by name (for autocomplete/select)
 */
export async function searchCompanies(
  teamId: string,
  search: string,
  limit: number = 10
): Promise<Pick<Company, 'id' | 'name' | 'city' | 'state'>[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, city, state')
    .eq('team_id', teamId)
    .ilike('name', `%${search}%`)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data || []
}

// ============================================================================
// Contact-Company Relationships
// ============================================================================

/**
 * Link a contact to a company
 */
export async function linkContactToCompany(dto: LinkContactToCompanyDTO): Promise<ContactCompany> {
  if (!supabase) throw new Error('Supabase not configured')

  // Create the link
  const { data: link, error } = await supabase
    .from('contact_companies')
    .insert({
      contact_id: dto.contact_id,
      company_id: dto.company_id,
      role_title: dto.role_title || null,
      is_primary: dto.is_primary || false,
    })
    .select()
    .single()

  if (error) throw error

  // Set as POC if requested
  if (dto.set_as_poc) {
    await supabase
      .from('companies')
      .update({ poc_contact_id: dto.contact_id })
      .eq('id', dto.company_id)
  }

  // Save work contact methods if provided
  if (dto.contact_methods && dto.contact_methods.length > 0) {
    await saveContactMethodsForRelationship(link.id, dto.contact_methods)
  }

  return link
}

/**
 * Update a contact-company relationship
 */
export async function updateContactCompanyLink(
  linkId: string,
  dto: UpdateContactCompanyDTO
): Promise<ContactCompany> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get the current link to know the company_id for POC updates
  const { data: currentLink, error: fetchError } = await supabase
    .from('contact_companies')
    .select('company_id, contact_id')
    .eq('id', linkId)
    .single()

  if (fetchError) throw fetchError

  // Update the link
  const updates: Record<string, unknown> = {}
  if (dto.role_title !== undefined) updates.role_title = dto.role_title
  if (dto.is_primary !== undefined) updates.is_primary = dto.is_primary

  const { data: link, error } = await supabase
    .from('contact_companies')
    .update(updates)
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error

  // Update POC if requested
  if (dto.set_as_poc !== undefined) {
    if (dto.set_as_poc) {
      await supabase
        .from('companies')
        .update({ poc_contact_id: currentLink.contact_id })
        .eq('id', currentLink.company_id)
    } else {
      // Clear POC if this contact was the POC
      await supabase
        .from('companies')
        .update({ poc_contact_id: null })
        .eq('id', currentLink.company_id)
        .eq('poc_contact_id', currentLink.contact_id)
    }
  }

  return link
}

/**
 * Remove a contact-company relationship
 */
export async function unlinkContactFromCompany(linkId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get the link details first (to clear POC if needed)
  const { data: link, error: fetchError } = await supabase
    .from('contact_companies')
    .select('contact_id, company_id')
    .eq('id', linkId)
    .single()

  if (fetchError) throw fetchError

  // Clear POC if this contact was the POC
  await supabase
    .from('companies')
    .update({ poc_contact_id: null })
    .eq('id', link.company_id)
    .eq('poc_contact_id', link.contact_id)

  // Delete the link (this will cascade delete work contact methods)
  const { error } = await supabase
    .from('contact_companies')
    .delete()
    .eq('id', linkId)

  if (error) throw error
}

/**
 * Get contacts linked to a company
 */
export async function getCompanyContacts(companyId: string): Promise<
  {
    link_id: string
    contact_id: string
    first_name: string
    last_name: string | null
    role_title: string | null
    is_primary: boolean
    is_poc: boolean
  }[]
> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get company's POC
  const { data: company } = await supabase
    .from('companies')
    .select('poc_contact_id')
    .eq('id', companyId)
    .single()

  const pocId = company?.poc_contact_id

  // Get linked contacts
  const { data, error } = await supabase
    .from('contact_companies')
    .select(
      `
      id,
      contact_id,
      role_title,
      is_primary,
      contact:contacts (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq('company_id', companyId)

  if (error) throw error

  return (data || []).map((link: {
    id: string
    contact_id: string
    role_title: string | null
    is_primary: boolean
    contact: { id: string; first_name: string; last_name: string | null }
  }) => ({
    link_id: link.id,
    contact_id: link.contact_id,
    first_name: link.contact.first_name,
    last_name: link.contact.last_name,
    role_title: link.role_title,
    is_primary: link.is_primary,
    is_poc: link.contact_id === pocId,
  }))
}
