import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// If service role key is not available, fall back to anon key with a warning
const effectiveKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Using anon key - some admin operations may fail due to RLS policies.')
}

// Server-side client - use service role key when available to bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})