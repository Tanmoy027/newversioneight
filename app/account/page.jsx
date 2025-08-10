'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { User, Mail, Calendar, ShoppingBag, LogOut, Edit, Save, X, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, safeQuery, ensureUserProfile } from '@/lib/supabase'

// Helper function to add timeout to promises
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    )
  ])
}

export default function AccountPage() {
  const { user, signOut, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [profileState, setProfileState] = useState({
    loading: false,
    error: null,
    retryCount: 0
  })
  const abortController = useRef(null)

  // Fetch profile data with retry logic
  const fetchProfileData = async (isRetry = false) => {
    if (!user) return
    
    try {
      setProfileState(prev => ({ ...prev, loading: true, error: null }))
      
      // Create new abort controller for this request
      abortController.current = new AbortController()
      
      // Add timeout to the query
      const { data, error } = await withTimeout(
        safeQuery(async () => 
          supabase.from('profiles').select('full_name, email, phone, address').eq('id', user.id).single()
        ),
        10000 // 10 second timeout
      )
      
      if (error) throw error
      
      if (data) {
        setProfileData({
          full_name: data.full_name || user?.email?.split('@')[0] || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          address: data.address || ''
        })
        
        // Cache profile data in localStorage
        localStorage.setItem('userProfile', JSON.stringify({
          full_name: data.full_name || user?.email?.split('@')[0] || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          address: data.address || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      
      // Set error state
      setProfileState(prev => ({
        ...prev,
        error: error.message || 'Failed to load profile data'
      }))
      
      // Show toast with retry option
      toast.error('Failed to load profile data', {
        description: error.message || 'Please check your connection and try again',
        action: {
          label: 'Retry',
          onClick: () => {
            setProfileState(prev => ({ 
              ...prev, 
              retryCount: prev.retryCount + 1 
            }))
          }
        }
      })
    } finally {
      setProfileState(prev => ({ ...prev, loading: false }))
      abortController.current = null
    }
  }

  // Effect to handle auth and profile loading
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return
    
    // Redirect if not authenticated
    if (!user) {
      router.push('/auth')
      return
    }
    
    // Try to load from cache first
    const cachedProfile = localStorage.getItem('userProfile')
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile)
        setProfileData(parsed)
      } catch (e) {
        console.error('Failed to parse cached profile:', e)
      }
    }
    
    // Fetch fresh data
    fetchProfileData()
    
    // Cleanup function to abort request if component unmounts
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [user, authLoading, router, profileState.retryCount])

  const handleLogout = async () => {
    try {
      setIsSaving(true)
      const { error } = await signOut()
      if (error) throw error
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Error logging out')
      console.error('Logout error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      console.log('Starting profile update...')
      
      // Ensure user profile exists
      console.log('Ensuring user profile exists...')
      let profileExists
      try {
        profileExists = await safeQuery(async () => await ensureUserProfile(user))
      } catch (error) {
        throw new Error('Failed to ensure user profile: ' + error.message)
      }
      if (!profileExists) {
        throw new Error('Failed to create or verify user profile')
      }
      console.log('User profile verified')
      
      // Update profiles table
      console.log('Updating profiles table...')
      const { error: profileUpdateError } = await safeQuery(async () => 
        supabase
          .from('profiles')
          .update({ 
            full_name: profileData.full_name,
            phone: profileData.phone,
            address: profileData.address
          })
          .eq('id', user.id)
      )
      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError)
        throw new Error(`Failed to update profile: ${profileUpdateError.message}`)
      }
      console.log('Profiles update successful')
      
      // Update cache
      localStorage.setItem('userProfile', JSON.stringify(profileData))
      
      // Refresh user data
      console.log('Refreshing user data...')
      await refreshUser()
      console.log('User data refreshed')
      
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.message || 'Error updating profile')
    } finally {
      setIsSaving(false)
      console.log('Profile save process completed')
    }
  }

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRetry = () => {
    setProfileState(prev => ({ 
      ...prev, 
      retryCount: prev.retryCount + 1,
      error: null
    }))
  }

  // Combined loading state
  const isLoading = authLoading || profileState.loading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading your account...</p>
          
          {profileState.error && (
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <div className="flex items-center text-red-800 mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Error: {profileState.error}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="flex items-center mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        {/* Error banner if profile fetch failed */}
        {profileState.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">Failed to load profile: {profileState.error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? 'Saving...' : <>
                        <Save className="h-4 w-4" />
                        Save
                      </>}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.full_name || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-900">{profileData.email}</p>
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.address || 'Not provided'}</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Member since {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Account Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/orders')}
                >
                  <ShoppingBag className="h-4 w-4" />
                  My Orders
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => router.push('/cart')}
                >
                  <ShoppingBag className="h-4 w-4" />
                  View Cart
                </Button>
                <Separator />
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                  onClick={handleLogout}
                  disabled={isSaving}
                >
                  <LogOut className="h-4 w-4" />
                  {isSaving ? 'Logging out...' : 'Logout'}
                </Button>
              </CardContent>
            </Card>
            
            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Status</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}