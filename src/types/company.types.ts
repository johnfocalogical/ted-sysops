import type { ContactMethod, ContactMethodInput } from './contact.types'

// ============================================================================
// Company Types - Organizations/businesses
// ============================================================================

// Company type lookup
export interface CompanyType {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Base company matching database table
export interface Company {
  id: string
  team_id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  website: string | null
  notes: string | null
  poc_contact_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// Company with types only (for list views)
export interface CompanyWithTypes extends Company {
  types: CompanyType[]
}

// Contact-company relationship (from company's perspective)
export interface ContactCompanyFromCompany {
  id: string
  contact_id: string
  company_id: string
  role_title: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
  contact: {
    id: string
    first_name: string
    last_name: string | null
  }
  contact_methods: ContactMethod[]
}

// POC contact reference
export interface PocContact {
  id: string
  first_name: string
  last_name: string | null
}

// Company with full details (for detail view)
export interface CompanyWithDetails extends Company {
  types: CompanyType[]
  contact_methods: ContactMethod[]
  contacts: ContactCompanyFromCompany[]
  poc_contact: PocContact | null
  created_by_user?: {
    id: string
    full_name: string | null
    email: string
  } | null
}

// Company list item (for table display)
export interface CompanyListItem extends Company {
  types: CompanyType[]
  primary_phone: string | null
  primary_email: string | null
  poc_name: string | null
}

// DTO for creating a company
export interface CreateCompanyDTO {
  team_id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  website?: string
  notes?: string
  type_ids?: string[]
  contact_methods?: ContactMethodInput[]
}

// DTO for updating a company
export interface UpdateCompanyDTO {
  name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  website?: string | null
  notes?: string | null
  poc_contact_id?: string | null
  type_ids?: string[]
}

// ============================================================================
// Contact-Company Relationship Types
// ============================================================================

// Base contact-company link
export interface ContactCompany {
  id: string
  contact_id: string
  company_id: string
  role_title: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

// DTO for linking a contact to a company
export interface LinkContactToCompanyDTO {
  contact_id: string
  company_id: string
  role_title?: string
  is_primary?: boolean
  set_as_poc?: boolean
  contact_methods?: ContactMethodInput[]
}

// DTO for updating a contact-company relationship
export interface UpdateContactCompanyDTO {
  role_title?: string | null
  is_primary?: boolean
  set_as_poc?: boolean
}
