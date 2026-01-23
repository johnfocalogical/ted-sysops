import { supabase } from './supabase'
import type {
  OrganizationMember,
  OrganizationMemberWithUser,
  OrgMemberWithTeams,
  TeamWithMemberCount,
  OrganizationWithDetails,
  UpdateOrganizationDTO,
  TeamMembershipInfo,
} from '@/types/org-member.types'
import type { PermissionLevel } from '@/types/team-member.types'

/**
 * Check if a user is an org owner
 */
export async function isOrgOwner(orgId: string, userId: string): Promise<boolean> {
  if (!supabase) throw new Error('Supabase not configured')

  // First check organization_members table
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('is_owner')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    if (!error && data) {
      return data.is_owner
    }
  } catch {
    // Fall through to legacy check
  }

  // Fallback: check legacy owner_id on organizations table
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single()

  return org?.owner_id === userId
}

/**
 * Get organization details with owner info
 */
export async function getOrganizationDetails(orgId: string): Promise<OrganizationWithDetails> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get org (without owner join - owner_id references auth.users, not public.users)
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (orgError) throw orgError

  // Get owner info from public.users table
  const { data: owner } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url')
    .eq('id', org.owner_id)
    .single()

  // Get owner count (with fallback if organization_members doesn't have data yet)
  let ownerCount = 1 // Default to 1 (the original owner)
  try {
    const { count, error: ownerError } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_owner', true)

    if (!ownerError && count !== null) {
      ownerCount = count
    }
  } catch {
    // Fallback to 1 if query fails
  }

  // Get member count (with fallback)
  let memberCount = 1 // Default to 1
  try {
    const { count, error: memberError } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    if (!memberError && count !== null) {
      memberCount = count
    }
  } catch {
    // Fallback to 1 if query fails
  }

  // Get team count
  const { count: teamCount, error: teamError } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (teamError) throw teamError

  return {
    ...org,
    owner: owner || { id: org.owner_id, email: '', full_name: null, avatar_url: null },
    owner_count: ownerCount,
    member_count: memberCount,
    team_count: teamCount || 0,
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(orgId: string, dto: UpdateOrganizationDTO): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('organizations')
    .update({ name: dto.name })
    .eq('id', orgId)

  if (error) throw error
}

/**
 * Delete organization (cascades to teams, members, etc.)
 */
export async function deleteOrganization(orgId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId)

  if (error) throw error
}

/**
 * Get all teams in organization with member counts
 */
export async function getOrganizationTeams(orgId: string): Promise<TeamWithMemberCount[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      id, name, slug, created_at,
      team_members (count)
    `)
    .eq('org_id', orgId)
    .order('name', { ascending: true })

  if (error) throw error

  return (teams || []).map((team) => ({
    id: team.id,
    name: team.name,
    slug: team.slug,
    created_at: team.created_at,
    member_count: (team.team_members as unknown as { count: number }[])?.[0]?.count || 0,
  }))
}

/**
 * Get ALL users in organization (anyone in any team) with their team memberships
 * This includes users who may not be in organization_members table
 */
export async function getAllOrgUsers(orgId: string): Promise<OrgMemberWithTeams[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // 1. Get all DISTINCT user_ids from team_members where team belongs to this org
  const { data: teamMemberData, error: tmError } = await supabase
    .from('team_members')
    .select(`
      user_id,
      permission_level,
      team:teams!inner (id, name, org_id),
      roles:team_member_roles (
        role:team_roles (name)
      )
    `)
    .eq('team.org_id', orgId)

  if (tmError) throw tmError
  if (!teamMemberData || teamMemberData.length === 0) return []

  // Extract unique user IDs
  const userIds = [...new Set(teamMemberData.map((tm) => tm.user_id))]

  // 2. Get user info from public.users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url')
    .in('id', userIds)

  if (usersError) throw usersError

  // Build user lookup map
  const usersMap = new Map(users?.map((u) => [u.id, u]) || [])

  // 3. Get organization_members records to check is_owner status
  const { data: orgMembers, error: omError } = await supabase
    .from('organization_members')
    .select('user_id, is_owner')
    .eq('organization_id', orgId)
    .in('user_id', userIds)

  if (omError) throw omError

  // Build owner status lookup map
  const ownerMap = new Map(orgMembers?.map((om) => [om.user_id, om.is_owner]) || [])

  // 4. Build team memberships lookup map: userId -> teams
  const teamsMap = new Map<string, TeamMembershipInfo[]>()
  teamMemberData.forEach((tm) => {
    const team = tm.team as unknown as { id: string; name: string }
    const roles = tm.roles as unknown as { role: { name: string } }[]
    const roleNames = roles?.map((r) => r.role?.name).filter(Boolean) || []

    const info: TeamMembershipInfo = {
      team_id: team.id,
      team_name: team.name,
      permission_level: tm.permission_level as PermissionLevel,
      role_names: roleNames,
    }

    const existing = teamsMap.get(tm.user_id) || []
    existing.push(info)
    teamsMap.set(tm.user_id, existing)
  })

  // 5. Combine into result, sorted by owner status then name
  const result: OrgMemberWithTeams[] = userIds.map((userId) => {
    const user = usersMap.get(userId)
    const isOwner = ownerMap.get(userId) ?? false

    return {
      id: `org-user-${userId}`, // Synthetic ID since user may not be in organization_members
      organization_id: orgId,
      user_id: userId,
      is_owner: isOwner,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: user || { id: userId, email: '', full_name: null, avatar_url: null },
      teams: teamsMap.get(userId) || [],
    }
  })

  // Sort: owners first, then by name/email
  return result.sort((a, b) => {
    if (a.is_owner !== b.is_owner) return a.is_owner ? -1 : 1
    const nameA = a.user.full_name || a.user.email || ''
    const nameB = b.user.full_name || b.user.email || ''
    return nameA.localeCompare(nameB)
  })
}

/**
 * Get all members in organization with their team memberships
 * @deprecated Use getAllOrgUsers() instead to include all team members
 */
export async function getOrganizationMembers(orgId: string): Promise<OrgMemberWithTeams[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get all org members (without user join - user_id references auth.users, not public.users)
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, is_owner, created_at, updated_at')
    .eq('organization_id', orgId)
    .order('is_owner', { ascending: false })
    .order('created_at', { ascending: true })

  if (membersError) throw membersError
  if (!members || members.length === 0) return []

  // Get user info from public.users table
  const userIds = members.map((m) => m.user_id)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url')
    .in('id', userIds)

  if (usersError) throw usersError

  // Build user lookup map
  const usersMap = new Map(users?.map((u) => [u.id, u]) || [])

  // Get all team memberships for these users within this org
  const { data: teamMemberships, error: teamError } = await supabase
    .from('team_members')
    .select(`
      user_id,
      permission_level,
      team:teams!inner (id, name, org_id),
      roles:team_member_roles (
        role:team_roles (name)
      )
    `)
    .in('user_id', userIds)
    .eq('team.org_id', orgId)

  if (teamError) throw teamError

  // Build lookup map: userId -> teams
  const teamsMap = new Map<string, TeamMembershipInfo[]>()
  teamMemberships?.forEach((tm) => {
    const team = tm.team as unknown as { id: string; name: string }
    const roles = tm.roles as unknown as { role: { name: string } }[]
    const roleNames = roles?.map((r) => r.role?.name).filter(Boolean) || []

    const info: TeamMembershipInfo = {
      team_id: team.id,
      team_name: team.name,
      permission_level: tm.permission_level as PermissionLevel,
      role_names: roleNames,
    }

    const existing = teamsMap.get(tm.user_id) || []
    existing.push(info)
    teamsMap.set(tm.user_id, existing)
  })

  // Combine members with their user info and teams
  return members.map((m) => {
    const user = usersMap.get(m.user_id)
    return {
      ...m,
      user: user || { id: m.user_id, email: '', full_name: null, avatar_url: null },
      teams: teamsMap.get(m.user_id) || [],
    }
  })
}

/**
 * Ensure a user is in organization_members table (creates record if not present)
 * Used before promoting someone to owner who may only be in team_members
 */
export async function ensureOrgMember(orgId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('organization_members')
    .upsert(
      { organization_id: orgId, user_id: userId, is_owner: false },
      { onConflict: 'organization_id,user_id', ignoreDuplicates: true }
    )

  if (error) throw error
}

/**
 * Make a user an org owner
 * Note: Automatically ensures user is in organization_members first
 */
export async function makeOrgOwner(orgId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // First ensure user is in organization_members
  await ensureOrgMember(orgId, userId)

  const { error } = await supabase
    .from('organization_members')
    .update({ is_owner: true })
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Remove a user's org owner status
 */
export async function removeOrgOwner(orgId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Check if this is the original org creator - they cannot be demoted
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single()

  if (orgError) throw orgError

  if (org?.owner_id === userId) {
    throw new Error('Cannot remove the organization creator as owner')
  }

  // Check if this is the last owner
  const count = await getOwnerCount(orgId)
  if (count <= 1) {
    throw new Error('Cannot remove the last owner')
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ is_owner: false })
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Get the number of org owners
 */
export async function getOwnerCount(orgId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.rpc('get_org_owner_count', { p_org_id: orgId })

  if (error) throw error
  return data || 0
}

/**
 * Update a team's name
 */
export async function updateTeam(teamId: string, name: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)

  if (error) throw error
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) throw error
}

/**
 * Add a user to a team
 */
export async function addUserToTeam(
  teamId: string,
  userId: string,
  permissionLevel: PermissionLevel,
  roleIds?: string[]
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')

  // Create team membership
  const { data: member, error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      permission_level: permissionLevel,
    })
    .select('id')
    .single()

  if (memberError) throw memberError

  // Assign roles if provided
  if (roleIds && roleIds.length > 0) {
    const roleAssignments = roleIds.map((roleId) => ({
      team_member_id: member.id,
      role_id: roleId,
    }))

    const { error: rolesError } = await supabase
      .from('team_member_roles')
      .insert(roleAssignments)

    if (rolesError) throw rolesError
  }

  return member.id
}

/**
 * Remove a user from a team
 */
export async function removeUserFromTeam(teamId: string, userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Get all teams a user belongs to within an org
 */
export async function getUserTeamsInOrg(orgId: string, userId: string): Promise<TeamMembershipInfo[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      permission_level,
      team:teams!inner (id, name, org_id),
      roles:team_member_roles (
        role:team_roles (name)
      )
    `)
    .eq('user_id', userId)
    .eq('team.org_id', orgId)

  if (error) throw error

  return (data || []).map((tm) => {
    const team = tm.team as unknown as { id: string; name: string }
    const roles = tm.roles as unknown as { role: { name: string } }[]
    const roleNames = roles?.map((r) => r.role?.name).filter(Boolean) || []

    return {
      team_id: team.id,
      team_name: team.name,
      permission_level: tm.permission_level as PermissionLevel,
      role_names: roleNames,
    }
  })
}
