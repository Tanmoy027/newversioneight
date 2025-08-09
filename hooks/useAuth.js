'use client'

import { useEffect, useState } from 'react'
import { supabase, ensureUserProfile } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Store auth state in sessionStorage and cookies for persistence
  const storeAuthState = (user, profile) => {
    if (typeof window !== 'undefined') {
      if (user && profile) {
        // Store in sessionStorage for current session
        sessionStorage.setItem('auth_user', JSON.stringify(user))
        sessionStorage.setItem('auth_profile', JSON.stringify(profile))
        
        // Store basic info in cookies for cross-session persistence (expires in 7 days)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        document.cookie = `auth_user_id=${user.id}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
        document.cookie = `auth_user_email=${user.email}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
      } else {
        // Clear sessionStorage
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('auth_profile')
        
        // Clear cookies
        document.cookie = 'auth_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'auth_user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
    }
  }

  // Load auth state from sessionStorage
  const loadAuthState = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = sessionStorage.getItem('auth_user')
        const storedProfile = sessionStorage.getItem('auth_profile')
        if (storedUser && storedProfile) {
          return {
            user: JSON.parse(storedUser),
            profile: JSON.parse(storedProfile)
          }
        }
      } catch (error) {
        console.error('Error loading auth state from sessionStorage:', error)
        // Clear corrupted data
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('auth_profile')
      }
    }
    return { user: null, profile: null }
  }

  // Helper function to get cookie value
  const getCookie = (name) => {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }

  useEffect(() => {
    // First, try to load from sessionStorage for immediate state
    const stored = loadAuthState()
    if (stored.user && stored.profile) {
      setUser(stored.user)
      setProfile(stored.profile)
      setLoading(false)
    }

    // Then get current session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
        // Clear stored auth state if no session
        storeAuthState(null, null)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setLoading(false)
        // Clear stored auth state on sign out
        storeAuthState(null, null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      // First ensure the profile exists
      const user = await supabase.auth.getUser()
      if (user.data.user) {
        const profileExists = await ensureUserProfile(user.data.user)
        if (!profileExists) {
          console.error('Failed to ensure user profile exists')
        }
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, is_admin, phone, address')
        .eq('id', userId)
        .single()

      let profileData
      if (error) {
        // If profile doesn't exist, create a basic one or use default
        console.warn('Profile not found, using default:', error.message)
        profileData = {
          id: userId,
          is_admin: false,
          full_name: 'User'
        }
      } else {
        profileData = { ...data, id: userId }
      }
      
      setProfile(profileData)
      
      // Store the complete auth state
      const currentUser = await supabase.auth.getUser()
      if (currentUser.data.user) {
        storeAuthState(currentUser.data.user, profileData)
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set default profile on error
      const defaultProfile = {
        id: userId,
        is_admin: false,
        full_name: 'User'
      }
      setProfile(defaultProfile)
      
      // Store the auth state even with default profile
      const currentUser = await supabase.auth.getUser()
      if (currentUser.data.user) {
        storeAuthState(currentUser.data.user, defaultProfile)
      }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    // Clear stored auth state before signing out
    storeAuthState(null, null)
    
    const { error } = await supabase.auth.signOut()
    
    // Ensure local state is cleared
    setUser(null)
    setProfile(null)
    
    return { error }
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    if (session?.user) {
      await fetchProfile(session.user.id)
    }
  }
  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAdmin: profile?.is_admin ?? false,
  }
}
