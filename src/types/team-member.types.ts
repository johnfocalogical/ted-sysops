import type { User } from './user.types'
import type { TeamRole } from './role.types'

// Permission level enum matching database
export type PermissionLevel = 'admin' | 'member' | 'viewer'

// Base team member matching database table (after migration - no role_id column)
export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  permission_level: PermissionLevel
  created_at: string
  updated_at: string
}

// Team member with user details
export interface TeamMemberWithUser extends TeamMember {
  user: User
}

// Team member with user and roles details (multiple roles)
export interface TeamMemberWithDetails extends TeamMember {
  user: User
  roles: TeamRole[]
}

// DTO for adding a team member
export interface CreateTeamMemberDTO {
  team_id: string
  user_id: string
  role_ids?: string[]
  permission_level?: PermissionLevel
}

// DTO for updating a team member
export interface UpdateTeamMemberDTO {
  role_ids?: string[]
  permission_level?: PermissionLevel
}
