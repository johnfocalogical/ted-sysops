import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
// These values should be set in your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client (or null if not configured)
let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn(
    'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  )
}

export { supabase }

// Export types for convenience
export type { User, Session } from '@supabase/supabase-js'
