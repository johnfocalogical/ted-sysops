import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * TeamRedirect handles legacy URLs (e.g., /dashboard) and redirects
 * them to team-scoped URLs (e.g., /org/{orgId}/team/{teamId}/dashboard)
 */
export function TeamRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getDefaultTeam } = useAuth()

  useEffect(() => {
    const redirect = async () => {
      // Get the current path without leading slash
      const currentPath = location.pathname.replace(/^\//, '') || 'dashboard'

      // Get user's default team
      const defaultTeam = await getDefaultTeam()

      if (defaultTeam) {
        // Redirect to team-scoped URL
        navigate(`/org/${defaultTeam.org_id}/team/${defaultTeam.team_id}/${currentPath}`, {
          replace: true,
        })
      } else {
        // User has no teams - this shouldn't happen after signup
        // Redirect to home for now
        navigate('/', { replace: true })
      }
    }

    redirect()
  }, [location.pathname, getDefaultTeam, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to workspace...</p>
      </div>
    </div>
  )
}
