import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { TeamContext, TeamSwitcherItem } from '@/types'
import type { SectionKey, RolePermissions } from '@/types/role.types'
import type { PermissionLevel } from '@/types/team-member.types'

interface TeamContextState {
  // Current context
  context: TeamContext | null
  loading: boolean
  error: string | null

  // Available teams for switcher
  availableTeams: TeamSwitcherItem[]

  // Actions
  loadContext: (orgId: string, teamId: string, userId: string) => Promise<boolean>
  loadAvailableTeams: (userId: string) => Promise<void>
  clearContext: () => void

  // Computed helpers
  isAdmin: () => boolean
  isMember: () => boolean
  isOrgOwner: () => boolean
  canAccess: (section: SectionKey) => boolean
  hasFullAccess: (section: SectionKey) => boolean
  getPermissionLevel: () => PermissionLevel | null
}

// Default empty permissions
const DEFAULT_PERMISSIONS: RolePermissions = {}

export const useTeamContext = create<TeamContextState>((set, get) => ({
  // Initial state
  context: null,
  loading: false,
  error: null,
  availableTeams: [],

  // Load context for a specific org/team
  loadContext: async (orgId: string, teamId: string, userId: string): Promise<boolean> => {
    if (!supabase) {
      set({ error: 'Supabase not configured', loading: false })
      return false
    }

    set({ loading: true, error: null })

    try {
      // Query team membership with all related data
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role_id,
          permission_level,
          created_at,
          updated_at,
          role:team_roles (
            id,
            team_id,
            name,
            description,
            permissions,
            is_default,
            template_id,
            created_at,
            updated_at
          ),
          team:teams!inner (
            id,
            org_id,
            name,
            slug,
            join_code,
            join_link_enabled,
            default_role_id,
            created_at,
            updated_at,
            organization:organizations!inner (
              id,
              name,
              slug,
              owner_id,
              created_at,
              updated_at
            )
          ),
          user:users!inner (
            id,
            email,
            full_name,
            avatar_url,
            is_superadmin,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single()

      if (error) {
        // User is not a member of this team
        set({ error: 'Access denied: not a team member', loading: false, context: null })
        return false
      }

      if (!data) {
        set({ error: 'Team not found', loading: false, context: null })
        return false
      }

      // Type assertions for nested data
      const team = data.team as unknown as {
        id: string
        org_id: string
        name: string
        slug: string
        join_code: string
        join_link_enabled: boolean
        default_role_id: string | null
        created_at: string
        updated_at: string
        organization: {
          id: string
          name: string
          slug: string
          owner_id: string
          created_at: string
          updated_at: string
        }
      }

      const user = data.user as unknown as {
        id: string
        email: string
        full_name: string | null
        avatar_url: string | null
        is_superadmin: boolean
        created_at: string
        updated_at: string
      }

      const role = data.role as unknown as {
        id: string
        team_id: string
        name: string
        description: string | null
        permissions: RolePermissions
        is_default: boolean
        template_id: string | null
        created_at: string
        updated_at: string
      } | null

      // Verify org matches
      if (team.organization.id !== orgId) {
        set({ error: 'Team does not belong to this organization', loading: false, context: null })
        return false
      }

      // Build the context
      const context: TeamContext = {
        organization: team.organization,
        team: {
          id: team.id,
          org_id: team.org_id,
          name: team.name,
          slug: team.slug,
          join_code: team.join_code,
          join_link_enabled: team.join_link_enabled,
          default_role_id: team.default_role_id,
          created_at: team.created_at,
          updated_at: team.updated_at,
        },
        user,
        membership: {
          id: data.id,
          team_id: data.team_id,
          user_id: data.user_id,
          role_id: data.role_id,
          permission_level: data.permission_level,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        role: role,
        permissions: role?.permissions || DEFAULT_PERMISSIONS,
      }

      set({ context, loading: false, error: null })
      return true
    } catch (err) {
      console.error('Error loading team context:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load team context',
        loading: false,
        context: null,
      })
      return false
    }
  },

  // Load all teams the user has access to (for team switcher)
  loadAvailableTeams: async (userId: string): Promise<void> => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team:teams!inner (
            id,
            name,
            slug,
            organization:organizations!inner (
              id,
              name,
              slug
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading available teams:', error)
        return
      }

      const teams: TeamSwitcherItem[] = (data || []).map((item) => {
        const team = item.team as unknown as {
          id: string
          name: string
          slug: string
          organization: {
            id: string
            name: string
            slug: string
          }
        }
        return {
          org_id: team.organization.id,
          org_name: team.organization.name,
          org_slug: team.organization.slug,
          team_id: team.id,
          team_name: team.name,
          team_slug: team.slug,
        }
      })

      set({ availableTeams: teams })
    } catch (err) {
      console.error('Error loading available teams:', err)
    }
  },

  // Clear context (on logout or team switch)
  clearContext: () => {
    set({ context: null, error: null, availableTeams: [] })
  },

  // Helper: Check if current user is admin
  isAdmin: () => {
    const { context } = get()
    return context?.membership.permission_level === 'admin'
  },

  // Helper: Check if current user is at least a member (not viewer)
  isMember: () => {
    const { context } = get()
    return context?.membership.permission_level === 'admin' ||
           context?.membership.permission_level === 'member'
  },

  // Helper: Check if current user is the organization owner
  isOrgOwner: () => {
    const { context } = get()
    if (!context) return false
    return context.organization.owner_id === context.user.id
  },

  // Helper: Check if user can access a section (has any permission)
  canAccess: (section: SectionKey) => {
    const { context } = get()
    if (!context) return false

    // Admins can access everything
    if (context.membership.permission_level === 'admin') return true

    // Check role permissions
    const permission = context.permissions[section]
    return !!permission?.access
  },

  // Helper: Check if user has full access to a section
  hasFullAccess: (section: SectionKey) => {
    const { context } = get()
    if (!context) return false

    // Admins have full access to everything
    if (context.membership.permission_level === 'admin') return true

    // Check role permissions
    const permission = context.permissions[section]
    return permission?.access === 'full'
  },

  // Helper: Get current permission level
  getPermissionLevel: () => {
    const { context } = get()
    return context?.membership.permission_level || null
  },
}))
