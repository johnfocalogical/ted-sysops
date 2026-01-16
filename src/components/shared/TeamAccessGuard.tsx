import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTeamContext } from '@/hooks/useTeamContext'

interface TeamAccessGuardProps {
  children: React.ReactNode
}

export function TeamAccessGuard({ children }: TeamAccessGuardProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { user, getDefaultTeam } = useAuth()
  const { loadContext, loadAvailableTeams, loading, error } = useTeamContext()
  const navigate = useNavigate()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeContext = async () => {
      if (!user || !orgId || !teamId) {
        return
      }

      // Load team context
      const success = await loadContext(orgId, teamId, user.id)

      if (!success) {
        // Access denied - redirect to default team
        const defaultTeam = await getDefaultTeam()
        if (defaultTeam) {
          navigate(`/org/${defaultTeam.org_id}/team/${defaultTeam.team_id}/dashboard`, { replace: true })
        } else {
          // No teams at all - redirect to home
          navigate('/', { replace: true })
        }
        return
      }

      // Also load available teams for switcher
      await loadAvailableTeams(user.id)
      setInitialized(true)
    }

    initializeContext()
  }, [user, orgId, teamId, loadContext, loadAvailableTeams, getDefaultTeam, navigate])

  // Show loading state
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Show error state (shouldn't normally reach here as we redirect)
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
