import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTeamContext } from '@/hooks/useTeamContext'

interface LocationState {
  section?: string
  sectionName?: string
}

export function AccessDeniedPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { context } = useTeamContext()

  const state = location.state as LocationState | undefined
  const sectionName = state?.sectionName || 'this section'

  const handleGoToDashboard = () => {
    navigate(`/org/${orgId}/team/${teamId}/dashboard`)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md border border-border text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access{' '}
            <span className="font-medium text-foreground">{sectionName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Contact your team admin if you believe this is an error or if you need access to this section.
          </p>

          {context?.role && (
            <p className="text-xs text-muted-foreground">
              Your current role: <span className="font-medium">{context.role.name}</span>
            </p>
          )}

          <Button
            onClick={handleGoToDashboard}
            className="bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
