import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import type { SignUpWithOrgTeamDTO, SignUpResult, User as AppUser } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>
  signUpWithOrgAndTeam: (dto: SignUpWithOrgTeamDTO) => Promise<{ data: SignUpResult | null; error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  getDefaultTeam: () => Promise<{ org_id: string; team_id: string } | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName ? {
        data: { full_name: fullName }
      } : undefined
    })

    // Check if email confirmation is required
    const needsConfirmation = !!(data?.user && !data?.session)

    return { error, needsConfirmation }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    return { error }
  }

  const signUpWithOrgAndTeam = async (dto: SignUpWithOrgTeamDTO): Promise<{ data: SignUpResult | null; error: Error | null }> => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') }
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          data: { full_name: dto.full_name }
        }
      })

      if (authError) {
        return { data: null, error: authError }
      }

      if (!authData.user) {
        return { data: null, error: new Error('Failed to create user') }
      }

      const userId = authData.user.id
      const needsEmailConfirmation = !!(authData.user && !authData.session)

      // Step 2: Wait briefly for the trigger to create public.users row
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 3: Create org, team, and membership using SECURITY DEFINER function
      // This bypasses RLS since the user may not have an active session yet
      const orgSlug = generateSlug(dto.org_name)
      const teamSlug = generateSlug(dto.team_name)

      const { data: workspaceData, error: workspaceError } = await supabase
        .rpc('create_user_workspace', {
          p_user_id: userId,
          p_org_name: dto.org_name,
          p_org_slug: orgSlug,
          p_team_name: dto.team_name,
          p_team_slug: teamSlug
        })
        .single<{ out_org_id: string; out_team_id: string; out_team_member_id: string }>()

      if (workspaceError || !workspaceData) {
        console.error('Failed to create workspace:', workspaceError)
        return { data: null, error: new Error(`Workspace setup failed: ${workspaceError?.message || 'Unknown error'}`) }
      }

      // Step 4: Fetch the user record
      const { data: appUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const result: SignUpResult = {
        user: appUser as AppUser,
        org_id: workspaceData.out_org_id,
        team_id: workspaceData.out_team_id,
        needsEmailConfirmation
      }

      return { data: result, error: null }
    } catch (err) {
      console.error('Signup error:', err)
      return { data: null, error: err instanceof Error ? err : new Error('An unexpected error occurred') }
    }
  }

  const getDefaultTeam = async (): Promise<{ org_id: string; team_id: string } | null> => {
    if (!supabase || !user) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner (
            id,
            org_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      const teamData = data.teams as unknown as { id: string; org_id: string }
      return {
        org_id: teamData.org_id,
        team_id: teamData.id
      }
    } catch {
      return null
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signUpWithOrgAndTeam,
    signOut,
    resetPassword,
    getDefaultTeam,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
