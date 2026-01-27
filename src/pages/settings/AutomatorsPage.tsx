import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ViewOnlyBanner } from '@/components/shared/ViewOnlyBanner'
import { AutomatorList } from '@/components/automators/AutomatorList'
import { AutomatorFormModal } from '@/components/automators/AutomatorFormModal'
import { usePermissions } from '@/hooks/usePermissions'
import { useTeamContext } from '@/hooks/useTeamContext'
import { getTeamAutomators } from '@/lib/automatorService'
import type { AutomatorWithCreator } from '@/types/automator.types'

export function AutomatorsPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { isViewOnly } = usePermissions('settings')
  const { context, isAdmin } = useTeamContext()
  const settingsPath = `/org/${orgId}/team/${teamId}/settings`

  const [automators, setAutomators] = useState<AutomatorWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadAutomators = async () => {
    if (!context) return

    setLoading(true)
    try {
      const data = await getTeamAutomators(context.team.id)
      setAutomators(data)
    } catch (err) {
      console.error('Error loading automators:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAutomators()
  }, [context?.team.id])

  const handleCreated = (automatorId: string) => {
    setShowCreateModal(false)
    // Navigate to the builder
    navigate(`/org/${orgId}/team/${teamId}/settings/automators/${automatorId}`)
  }

  if (!context) return null

  return (
    <div className="max-w-4xl">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={settingsPath}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Automators</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage workflow automations for your team
        </p>
      </div>

      {/* View Only Banner */}
      {isViewOnly && <ViewOnlyBanner className="mb-6" />}

      {/* Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Automators</CardTitle>
              <CardDescription>
                {automators.length} automator{automators.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
          </div>
          {isAdmin() && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Automator
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AutomatorList
              automators={automators}
              onRefresh={loadAutomators}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <AutomatorFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
