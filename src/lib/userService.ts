import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_superadmin: boolean
  created_at: string
  updated_at: string
}

export interface UpdateUserProfileDTO {
  full_name: string
}

/**
 * Fetch the current user's profile from public.users
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as UserProfile
}

/**
 * Update the user's profile in public.users and auth metadata
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateUserProfileDTO
): Promise<UserProfile> {
  if (!supabase) throw new Error('Supabase not configured')

  // Update public.users table
  const { data, error } = await supabase
    .from('users')
    .update({ full_name: updates.full_name })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Also update auth metadata so user_metadata stays in sync
  await supabase.auth.updateUser({
    data: { full_name: updates.full_name },
  })

  return data as UserProfile
}

/**
 * Update the current user's password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
