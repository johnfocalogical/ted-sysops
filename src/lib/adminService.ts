import { supabase } from './supabase'
import type { User } from '@/types/user.types'
import type { PermissionLevel } from '@/types/team-member.types'
import type { RoleTemplate, RolePermissions } from '@/types/role.types'

// Dashboard stats
export interface DashboardStats {
  orgCount: number
  teamCount: number
  userCount: number
  newUsersLast7Days: number
}

// User with team memberships
export interface UserWithMemberships extends User {
  team_members: {
    permission_level: PermissionLevel
    team: {
      id: string
      name: string
      slug: string
      organization: {
        id: string
        name: string
      }
    }
    role: {
      id: string
      name: string
    } | null
  }[]
}

// Pagination
export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!supabase) throw new Error('Supabase not configured')

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [orgs, teams, users, newUsers] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
  ])

  return {
    orgCount: orgs.count || 0,
    teamCount: teams.count || 0,
    userCount: users.count || 0,
    newUsersLast7Days: newUsers.count || 0,
  }
}

/**
 * Get recent users (for dashboard)
 */
export async function getRecentUsers(limit: number = 5): Promise<User[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Get all users with pagination and search
 */
export async function getUsers(params: PaginationParams): Promise<PaginatedResult<User>> {
  if (!supabase) throw new Error('Supabase not configured')

  const { page, pageSize, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })

  // Apply search filter
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: data || [],
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get single user with their team memberships
 */
export async function getUserDetails(userId: string): Promise<UserWithMemberships | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      team_members (
        permission_level,
        team:teams (
          id,
          name,
          slug,
          organization:organizations (
            id,
            name
          )
        ),
        role:team_roles (
          id,
          name
        )
      )
    `)
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as unknown as UserWithMemberships
}

/**
 * Update a user's superadmin status
 */
export async function setSuperadminStatus(userId: string, isSuperadmin: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('users')
    .update({ is_superadmin: isSuperadmin })
    .eq('id', userId)

  if (error) throw error
}

// ============================================
// ORGANIZATION MANAGEMENT
// ============================================

export interface OrganizationWithDetails {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
  owner: {
    id: string
    full_name: string | null
    email: string
  }
  teams: {
    id: string
    name: string
    slug: string
  }[]
  _count: {
    teams: number
    members: number
  }
}

/**
 * Get all organizations with pagination and search
 */
export async function getOrganizations(params: PaginationParams): Promise<PaginatedResult<OrganizationWithDetails>> {
  if (!supabase) throw new Error('Supabase not configured')

  const { page, pageSize, search } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('organizations')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        email
      ),
      teams (
        id,
        name,
        slug
      )
    `, { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Add counts
  const orgsWithCounts = (data || []).map((org: OrganizationWithDetails) => ({
    ...org,
    _count: {
      teams: org.teams?.length || 0,
      members: 0, // We'll calculate this separately if needed
    },
  }))

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: orgsWithCounts,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get organization details
 */
export async function getOrganizationDetails(orgId: string): Promise<OrganizationWithDetails | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      owner:users!owner_id (
        id,
        full_name,
        email
      ),
      teams (
        id,
        name,
        slug
      )
    `)
    .eq('id', orgId)
    .single()

  if (error) throw error

  // Get member count across all teams
  const { count: memberCount } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .in('team_id', (data.teams || []).map((t: { id: string }) => t.id))

  return {
    ...data,
    _count: {
      teams: data.teams?.length || 0,
      members: memberCount || 0,
    },
  } as OrganizationWithDetails
}

// ============================================
// TEAM MANAGEMENT
// ============================================

export interface TeamWithDetails {
  id: string
  org_id: string
  name: string
  slug: string
  join_code: string | null
  join_code_enabled: boolean
  created_at: string
  updated_at: string
  organization: {
    id: string
    name: string
    slug: string
  }
  _count: {
    members: number
  }
}

/**
 * Get all teams with pagination and search
 */
export async function getTeams(params: PaginationParams & { orgId?: string }): Promise<PaginatedResult<TeamWithDetails>> {
  if (!supabase) throw new Error('Supabase not configured')

  const { page, pageSize, search, orgId } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('teams')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug
      )
    `, { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Get member counts for each team
  const teamIds = (data || []).map((t: TeamWithDetails) => t.id)
  const { data: memberCounts } = await supabase
    .from('team_members')
    .select('team_id')
    .in('team_id', teamIds)

  const countMap = new Map<string, number>()
  memberCounts?.forEach((m: { team_id: string }) => {
    countMap.set(m.team_id, (countMap.get(m.team_id) || 0) + 1)
  })

  const teamsWithCounts = (data || []).map((team: TeamWithDetails) => ({
    ...team,
    _count: {
      members: countMap.get(team.id) || 0,
    },
  }))

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  return {
    data: teamsWithCounts,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Get team details with members
 */
export async function getTeamDetails(teamId: string): Promise<TeamWithDetails & { members: UserWithMemberships['team_members'][0][] } | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      organization:organizations (
        id,
        name,
        slug
      ),
      team_members (
        permission_level,
        user:users (
          id,
          full_name,
          email
        ),
        role:team_roles (
          id,
          name
        )
      )
    `)
    .eq('id', teamId)
    .single()

  if (error) throw error

  return {
    ...data,
    members: data.team_members || [],
    _count: {
      members: data.team_members?.length || 0,
    },
  } as TeamWithDetails & { members: UserWithMemberships['team_members'][0][] }
}

// ============================================
// ROLE TEMPLATE MANAGEMENT
// ============================================

export interface RoleTemplateWithUsage extends RoleTemplate {
  _count: {
    teams: number
  }
}

/**
 * Get all role templates
 */
export async function getRoleTemplates(): Promise<RoleTemplateWithUsage[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('role_templates')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw error

  // Get usage counts (teams using each template)
  const { data: usageCounts } = await supabase
    .from('team_roles')
    .select('template_id')
    .not('template_id', 'is', null)

  const countMap = new Map<string, number>()
  usageCounts?.forEach((r: { template_id: string }) => {
    countMap.set(r.template_id, (countMap.get(r.template_id) || 0) + 1)
  })

  return (data || []).map((template: RoleTemplate) => ({
    ...template,
    _count: {
      teams: countMap.get(template.id) || 0,
    },
  }))
}

/**
 * Create a new role template
 */
export async function createRoleTemplate(dto: {
  name: string
  description?: string
  permissions: RolePermissions
  auto_install: boolean
}): Promise<RoleTemplate> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('role_templates')
    .insert({
      name: dto.name,
      description: dto.description || null,
      permissions: dto.permissions,
      is_system: false,
      auto_install: dto.auto_install,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a role template (only non-system templates)
 */
export async function updateRoleTemplate(
  templateId: string,
  dto: {
    name?: string
    description?: string
    permissions?: RolePermissions
    auto_install?: boolean
  }
): Promise<RoleTemplate> {
  if (!supabase) throw new Error('Supabase not configured')

  const updates: Record<string, unknown> = {}
  if (dto.name !== undefined) updates.name = dto.name
  if (dto.description !== undefined) updates.description = dto.description
  if (dto.permissions !== undefined) updates.permissions = dto.permissions
  if (dto.auto_install !== undefined) updates.auto_install = dto.auto_install

  const { data, error } = await supabase
    .from('role_templates')
    .update(updates)
    .eq('id', templateId)
    .eq('is_system', false) // Only allow updating non-system templates
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a role template (only non-system templates)
 */
export async function deleteRoleTemplate(templateId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('role_templates')
    .delete()
    .eq('id', templateId)
    .eq('is_system', false) // Only allow deleting non-system templates

  if (error) throw error
}

// ============================================
// IMPERSONATION
// ============================================

/**
 * Enter a team as admin (impersonation)
 * Returns the URL to navigate to
 */
export function getImpersonationUrl(orgId: string, teamId: string): string {
  return `/org/${orgId}/team/${teamId}/dashboard?impersonate=true`
}
