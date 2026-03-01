import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// These values should be set in your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  )
}

// Create Supabase client - will be used throughout the app
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export { supabase }

// Export types for convenience
export type { User, Session } from '@supabase/supabase-js'
