'use client'

import { useEffect, useRef } from 'react'
import { checkConnection, refreshConnection } from '@/lib/supabase'

// Hook to keep Supabase connection alive during idle periods
export function useConnectionKeepAlive() {
  const keepAliveInterval = useRef(null)
  const isActive = useRef(true)

  useEffect(() => {
    // Start keep-alive mechanism
    const startKeepAlive = () => {
      // Check connection every 3 minutes during active periods
      keepAliveInterval.current = setInterval(async () => {
        if (!isActive.current) return

        try {
          const isHealthy = await checkConnection()
          if (!isHealthy) {
            console.log('Keep-alive: Connection unhealthy, refreshing...')
            await refreshConnection()
          } else {
            console.log('Keep-alive: Connection healthy')
          }
        } catch (error) {
          console.warn('Keep-alive check failed:', error)
        }
      }, 3 * 60 * 1000) // 3 minutes
    }

    // Stop keep-alive mechanism
    const stopKeepAlive = () => {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current)
        keepAliveInterval.current = null
      }
    }

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('Page hidden, stopping keep-alive')
        isActive.current = false
        stopKeepAlive()
      } else {
        console.log('Page visible, starting keep-alive and checking connection')
        isActive.current = true
        
        // Immediately check connection when page becomes visible
        try {
          const isHealthy = await checkConnection()
          if (!isHealthy) {
            console.log('Page focus: Connection stale, refreshing...')
            await refreshConnection()
          }
        } catch (error) {
          console.warn('Page focus connection check failed:', error)
        }
        
        startKeepAlive()
      }
    }

    // Handle online/offline events
    const handleOnline = async () => {
      console.log('Network online, refreshing connection...')
      isActive.current = true
      await refreshConnection()
      startKeepAlive()
    }

    const handleOffline = () => {
      console.log('Network offline, stopping keep-alive')
      isActive.current = false
      stopKeepAlive()
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Start initial keep-alive if page is visible
    if (!document.hidden) {
      startKeepAlive()
    }

    // Cleanup
    return () => {
      stopKeepAlive()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Return function to manually trigger connection check
  const triggerConnectionCheck = async () => {
    try {
      const isHealthy = await checkConnection()
      if (!isHealthy) {
        console.log('Manual trigger: Connection unhealthy, refreshing...')
        await refreshConnection()
        return false
      }
      return true
    } catch (error) {
      console.warn('Manual connection check failed:', error)
      return false
    }
  }

  return { triggerConnectionCheck }
}