'use client'

import { useEffect, useState } from 'react'
import { supabase, ensureUserProfile } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
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

      if (error) {
        // If profile doesn't exist, create a basic one or use default
        console.warn('Profile not found, using default:', error.message)
        setProfile({
          id: userId,
          is_admin: false,
          full_name: 'User'
        })
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set default profile on error
      setProfile({
        id: userId,
        is_admin: false,
        full_name: 'User'
      })
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
    const { error } = await supabase.auth.signOut()
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
