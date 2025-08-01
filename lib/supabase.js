import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client with better connection handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: {
      'x-client-info': 'eighthand-furniture@1.0.0'
    }
  }
})

// Connection health check and refresh mechanism
let lastHealthCheck = Date.now()
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const CONNECTION_TIMEOUT = 10 * 1000 // 10 seconds

// Function to check if connection is healthy
export async function checkConnection() {
  try {
    const startTime = Date.now()
    
    // Simple query to test connection
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.warn('Connection health check failed:', error)
      return false
    }
    
    if (responseTime > CONNECTION_TIMEOUT) {
      console.warn('Connection is slow:', responseTime + 'ms')
      return false
    }
    
    console.log('Connection healthy, response time:', responseTime + 'ms')
    return true
  } catch (error) {
    console.error('Connection health check error:', error)
    return false
  }
}

// Function to refresh connection
export async function refreshConnection() {
  try {
    console.log('Refreshing Supabase connection...')
    
    // Force refresh auth session
    const { error } = await supabase.auth.refreshSession()
    if (error) {
      console.warn('Auth refresh failed:', error)
    }
    
    // Test connection with a simple query
    const isHealthy = await checkConnection()
    
    if (isHealthy) {
      console.log('Connection refreshed successfully')
      return true
    } else {
      console.warn('Connection refresh failed')
      return false
    }
  } catch (error) {
    console.error('Error refreshing connection:', error)
    return false
  }
}

// Enhanced query function with automatic connection handling
export async function safeQuery(queryFn, maxRetries = 2) {
  let lastError = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if we should refresh connection
      const now = Date.now()
      if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
        console.log('Checking connection health...')
        const isHealthy = await checkConnection()
        
        if (!isHealthy && attempt === 0) {
          console.log('Connection unhealthy, refreshing...')
          await refreshConnection()
        }
        
        lastHealthCheck = now
      }
      
      // Execute the query with timeout
      const result = await Promise.race([
        queryFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000))
      ])
      
      // Reset health check timer on success
      lastHealthCheck = Date.now()
      
      return result
    } catch (error) {
      console.error(`Query attempt ${attempt + 1} failed:`, error)
      lastError = error
      
      // If it's a connection-related error, try to refresh
      if (attempt < maxRetries && isConnectionError(error)) {
        console.log('Connection error detected, refreshing connection...')
        await refreshConnection()
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      } else {
        // For non-connection errors, don't retry
        break
      }
    }
  }
  
  // If all attempts failed, throw the last error
  console.error('All query attempts failed, throwing error:', lastError)
  throw lastError
}

// Helper function to detect connection-related errors
function isConnectionError(error) {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || ''
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('fetch') ||
    errorCode === 'NETWORK_ERROR' ||
    errorCode === 'CONNECTION_ERROR' ||
    errorCode === 'TIMEOUT'
  )
}

// Helper function to ensure user profile exists
export async function ensureUserProfile(user) {
  if (!user) return false
  
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (existingProfile) {
      return true // Profile exists
    }
    
    // Profile doesn't exist, create it
    console.log('Creating missing profile for user:', user.id)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        is_admin: false
      })
    
    if (insertError) {
      console.error('Failed to create profile:', insertError)
      return false
    }
    
    console.log('Profile created successfully')
    return true
  } catch (error) {
    console.error('Error ensuring user profile:', error)
    return false
  }
}

// Initialize connection monitoring
if (typeof window !== 'undefined') {
  // Monitor page visibility to refresh connection when user returns
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('Page became visible, checking connection...')
      const isHealthy = await checkConnection()
      if (!isHealthy) {
        console.log('Connection stale, refreshing...')
        await refreshConnection()
      }
    }
  })
  
  // Monitor online/offline status
  window.addEventListener('online', async () => {
    console.log('Network connection restored, refreshing Supabase connection...')
    await refreshConnection()
  })
  
  window.addEventListener('offline', () => {
    console.log('Network connection lost')
  })
}
