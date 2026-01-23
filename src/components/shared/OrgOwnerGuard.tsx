import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrgContext } from '@/hooks/useOrgContext'
import { supabase } from '@/lib/supabase'

interface OrgOwnerGuardProps {
  children: ReactNode
}

export function OrgOwnerGuard({ children }: OrgOwnerGuardProps) {
  const { orgId } = useParams<{ orgId: string }>()
  const { user, loading: authLoading } = useAuth()
  const { loadOrg, isOwner, loading: orgLoading } = useOrgContext()
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !supabase || !orgId) {
        setHasAccess(false)
        setCheckingAccess(false)
        return
      }

      try {
        // Check superadmin status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_superadmin')
          .eq('id', user.id)
          .single()

        if (!userError && userData?.is_superadmin) {
          setIsSuperadmin(true)
          setHasAccess(true)
          // Still load org context for display
          await loadOrg(orgId, user.id)
          setCheckingAccess(false)
          return
        }

        setIsSuperadmin(false)

        // Load org context and check ownership
        const success = await loadOrg(orgId, user.id)

        if (success) {
          // isOwner is set by loadOrg
          const { isOwner: ownerStatus } = useOrgContext.getState()
          setHasAccess(ownerStatus)
        } else {
          setHasAccess(false)
        }
      } catch {
        setHasAccess(false)
      } finally {
        setCheckingAccess(false)
      }
    }

    if (!authLoading && user) {
      checkAccess()
    } else if (!authLoading && !user) {
      setCheckingAccess(false)
    }
  }, [user, authLoading, orgId, loadOrg])

  // Still loading
  if (authLoading || checkingAccess || orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // No org ID in URL
  if (!orgId) {
    return <Navigate to="/" replace />
  }

  // Not an owner or superadmin
  if (!hasAccess) {
    return <Navigate to="/" replace />
  }

  // Access granted
  return <>{children}</>
}
