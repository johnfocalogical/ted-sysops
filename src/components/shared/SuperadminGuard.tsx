import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface SuperadminGuardProps {
  children: ReactNode
}

export function SuperadminGuard({ children }: SuperadminGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    const checkSuperadminStatus = async () => {
      if (!user || !supabase) {
        setIsSuperadmin(false)
        setCheckingStatus(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_superadmin')
          .eq('id', user.id)
          .single()

        if (error || !data) {
          setIsSuperadmin(false)
        } else {
          setIsSuperadmin(data.is_superadmin)
        }
      } catch {
        setIsSuperadmin(false)
      } finally {
        setCheckingStatus(false)
      }
    }

    if (!authLoading && user) {
      checkSuperadminStatus()
    } else if (!authLoading && !user) {
      setCheckingStatus(false)
    }
  }, [user, authLoading])

  // Still loading auth or checking superadmin status
  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Not a superadmin - redirect to home
  if (!isSuperadmin) {
    return <Navigate to="/" replace />
  }

  // Superadmin verified - render children
  return <>{children}</>
}
