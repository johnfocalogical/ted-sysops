import type { User } from './user.types'

// Base organization matching database table
export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

// Organization with owner details included
export interface OrganizationWithOwner extends Organization {
  owner: User
}

// DTO for creating a new organization
export interface CreateOrganizationDTO {
  name: string
  slug: string
}

// DTO for updating an organization
export interface UpdateOrganizationDTO {
  name?: string
  slug?: string
}
