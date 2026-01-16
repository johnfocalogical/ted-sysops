// Base user matching database table
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_superadmin: boolean
  created_at: string
  updated_at: string
}

// DTO for updating a user
export interface UpdateUserDTO {
  full_name?: string
  avatar_url?: string
}

// DTO for multi-step signup with org/team creation
export interface SignUpWithOrgTeamDTO {
  email: string
  password: string
  full_name: string
  org_name: string
  team_name: string
}

// Result of signup process
export interface SignUpResult {
  user: User
  org_id: string
  team_id: string
  needsEmailConfirmation: boolean
}
