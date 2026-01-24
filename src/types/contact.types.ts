// ============================================================================
// Contact Types - People/individuals
// ============================================================================

// Contact method type enum
export type ContactMethodType = 'phone' | 'email' | 'fax' | 'other'

// Contact method (can belong to contact, company, or relationship)
export interface ContactMethod {
  id: string
  contact_id: string | null
  company_id: string | null
  contact_company_id: string | null
  method_type: ContactMethodType
  label: string | null
  value: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

// Contact method for forms (without IDs)
export interface ContactMethodInput {
  method_type: ContactMethodType
  label: string
  value: string
  is_primary: boolean
}

// Contact type lookup
export interface ContactType {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Base contact matching database table
export interface Contact {
  id: string
  team_id: string
  first_name: string
  last_name: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// Contact with types only (for list views)
export interface ContactWithTypes extends Contact {
  types: ContactType[]
}

// Contact company relationship (from contact's perspective)
export interface ContactCompanyFromContact {
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
    types: Array<{
      id: string
      name: string
      icon: string
      color: string
    }>
  }
  contact_methods: ContactMethod[]
}

// Contact with full details (for detail view)
export interface ContactWithDetails extends Contact {
  types: ContactType[]
  contact_methods: ContactMethod[]
  companies: ContactCompanyFromContact[]
  created_by_user?: {
    id: string
    full_name: string | null
    email: string
  } | null
}

// Contact list item (for table display)
export interface ContactListItem extends Contact {
  types: ContactType[]
  primary_phone: string | null
  primary_email: string | null
  company_names: string[]
}

// DTO for creating a contact
export interface CreateContactDTO {
  team_id: string
  first_name: string
  last_name?: string
  notes?: string
  type_ids?: string[]
  contact_methods?: ContactMethodInput[]
}

// DTO for updating a contact
export interface UpdateContactDTO {
  first_name?: string
  last_name?: string | null
  notes?: string | null
  type_ids?: string[]
}

// DTO for adding/updating contact methods
export interface UpdateContactMethodsDTO {
  contact_id?: string
  company_id?: string
  contact_company_id?: string
  methods: ContactMethodInput[]
}
