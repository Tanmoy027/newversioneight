'use client'

import { createClient } from '@supabase/supabase-js'

// Enhanced Supabase client with automatic session management
class SupabaseAuthManager {
  constructor() {
    this.client = null
    this.lastActivity = Date.now()
    this.refreshTimer = null
    this.initializeClient()
    this.setupActivityTracking()
  }

  initializeClient() {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce'
        },
        realtime: {
          params: {
            eventsPerSecond: 2
          }
        }
      }
    )

    // Listen for auth state changes
    this.client.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session')
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, starting session management')
        this.startSessionManagement()
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, stopping session management')
        this.stopSessionManagement()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('Token refreshed successfully')
        this.lastActivity = Date.now()
      }
    })
  }

  setupActivityTracking() {
    // Track user activity to know when to refresh sessions
    const trackActivity = () => {
      this.lastActivity = Date.now()
    }

    if (typeof window !== 'undefined') {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, trackActivity, { passive: true })
      })

      // Track page visibility changes
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          console.log('Page became visible, checking session...')
          await this.ensureValidSession()
        }
      })
    }
  }

  startSessionManagement() {
    this.stopSessionManagement() // Clear any existing timer
    
    // Check session every 2 minutes
    this.refreshTimer = setInterval(async () => {
      await this.ensureValidSession()
    }, 2 * 60 * 1000)
  }

  stopSessionManagement() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async ensureValidSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession()
      
      if (error) {
        console.warn('Error getting session:', error)
        return false
      }

      if (!session) {
        console.log('No active session')
        return true // No session is fine for anonymous access
      }

      // Check if session is close to expiring (within 5 minutes)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at
      const timeUntilExpiry = expiresAt - now
      
      console.log(`Session expires in ${Math.floor(timeUntilExpiry / 60)} minutes`)

      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('Session expiring soon, refreshing...')
        const { error: refreshError } = await this.client.auth.refreshSession()
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError)
          return false
        }
        
        console.log('Session refreshed successfully')
      }

      return true
    } catch (error) {
      console.error('Error ensuring valid session:', error)
      return false
    }
  }

  // Safe query wrapper that handles auth sessions
  async safeQuery(queryFn, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Ensure session is valid before query
        const sessionValid = await this.ensureValidSession()
        
        if (!sessionValid && attempt === 0) {
          console.log('Session invalid, attempting refresh...')
          await this.client.auth.refreshSession()
        }

        // Execute the query
        const result = await queryFn(this.client)
        return result
        
      } catch (error) {
        console.warn(`Query attempt ${attempt + 1} failed:`, error)
        
        // Check for auth-related errors
        if (this.isAuthError(error) && attempt < retries) {
          console.log('Auth error detected, refreshing session...')
          await this.client.auth.refreshSession()
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else if (attempt === retries) {
          throw error
        }
      }
    }
  }

  isAuthError(error) {
    const errorMessage = error?.message?.toLowerCase() || ''
    const errorCode = error?.code || ''
    
    return (
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorMessage.includes('session') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized') ||
      errorCode === 'PGRST301' ||
      errorCode === 'PGRST302'
    )
  }

  // Get the managed client
  getClient() {
    return this.client
  }

  // Create a fresh client for API routes (no session persistence)
  createFreshClient() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )
  }
}

// Global instance
const authManager = new SupabaseAuthManager()

// Export the managed client and utilities
export const supabase = authManager.getClient()
export const safeQuery = (queryFn, retries) => authManager.safeQuery(queryFn, retries)
export const createFreshClient = () => authManager.createFreshClient()
export const ensureValidSession = () => authManager.ensureValidSession()

export default authManager