import type { Organization } from './organization.types'

// Base team matching database table
export interface Team {
  id: string
  org_id: string
  name: string
  slug: string
  join_code: string
  join_link_enabled: boolean
  default_role_id: string | null
  created_at: string
  updated_at: string
}

// Team with organization details
export interface TeamWithOrg extends Team {
  organization: Organization
}

// Simplified team reference for switcher/dropdown
export interface TeamReference {
  org_id: string
  org_name: string
  team_id: string
  team_name: string
}

// DTO for creating a new team
export interface CreateTeamDTO {
  org_id: string
  name: string
  slug: string
}

// DTO for updating a team
export interface UpdateTeamDTO {
  name?: string
  slug?: string
}
