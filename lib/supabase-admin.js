import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// If service role key is not available, fall back to anon key with a warning
const effectiveKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseServiceKey) {
  console.warn('⚠️  Service role key not found. Using anon key - some admin operations may fail due to RLS policies.')
}

// Debug which key is being used (without exposing the full key)
const keyType = supabaseServiceKey ? 'service_role' : 'anon';
const keyPreview = effectiveKey ? `${effectiveKey.substring(0, 5)}...` : 'none';
console.log(`Creating admin client with key type: ${keyType}, preview: ${keyPreview}`);
console.log('Service role key available:', !!supabaseServiceKey);

// Server-side client - use service role key when available to bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})