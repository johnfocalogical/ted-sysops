import type { Team } from './team.types'
import type { TeamRole } from './role.types'
import type { User } from './user.types'
import type { PermissionLevel } from './team-member.types'

// Invitation status enum matching database
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

// Base team invitation matching database table
export interface TeamInvitation {
  id: string
  team_id: string
  email: string
  role_id: string | null
  permission_level: PermissionLevel
  status: InvitationStatus
  invited_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

// Invitation with related details
export interface InvitationWithDetails extends TeamInvitation {
  team: Team
  role: TeamRole | null
  inviter: User
}

// DTO for creating an invitation
export interface CreateInvitationDTO {
  team_id: string
  email: string
  role_id?: string
  permission_level?: PermissionLevel
}
