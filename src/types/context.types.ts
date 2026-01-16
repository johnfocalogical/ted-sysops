import type { Organization } from './organization.types'
import type { Team } from './team.types'
import type { User } from './user.types'
import type { TeamMember } from './team-member.types'
import type { TeamRole, RolePermissions } from './role.types'

// Current team context with all relevant details
export interface TeamContext {
  organization: Organization
  team: Team
  user: User
  membership: TeamMember
  role: TeamRole | null
  permissions: RolePermissions
}

// Simplified team reference for navigation/switcher
export interface TeamSwitcherItem {
  org_id: string
  org_name: string
  org_slug: string
  team_id: string
  team_name: string
  team_slug: string
}

// List of teams user has access to
export interface UserTeamsList {
  teams: TeamSwitcherItem[]
  current_team_id: string | null
}
