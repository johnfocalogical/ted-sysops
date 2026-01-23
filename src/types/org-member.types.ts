import type { User } from './user.types'
import type { PermissionLevel } from './team-member.types'

// Base organization member matching database table
export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  is_owner: boolean
  created_at: string
  updated_at: string
}

// Organization member with user details
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: User
}

// Team membership info for cross-team display
export interface TeamMembershipInfo {
  team_id: string
  team_name: string
  permission_level: PermissionLevel
  role_names: string[]
}

// Organization member with user and team memberships
export interface OrgMemberWithTeams extends OrganizationMember {
  user: User
  teams: TeamMembershipInfo[]
}

// Team with member count for org settings
export interface TeamWithMemberCount {
  id: string
  name: string
  slug: string
  member_count: number
  created_at: string
}

// Organization with owner details for settings
export interface OrganizationWithDetails {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
  owner: User
  owner_count: number
  member_count: number
  team_count: number
}

// DTO for updating organization
export interface UpdateOrganizationDTO {
  name?: string
}

// DTO for managing team membership
export interface TeamMembershipUpdate {
  team_id: string
  action: 'add' | 'remove' | 'update'
  permission_level?: PermissionLevel
  role_ids?: string[]
}
