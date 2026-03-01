import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommsAutomationSettings } from '@/components/settings/CommsAutomationSettings'
import { ViewOnlyBanner } from '@/components/shared/ViewOnlyBanner'
import { usePermissions } from '@/hooks/usePermissions'

export function CommsAutomationPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { isViewOnly } = usePermissions('settings')
  const settingsPath = `/org/${orgId}/team/${teamId}/settings`

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
        <h1 className="text-2xl font-bold">Comms Automation</h1>
        <p className="text-muted-foreground mt-1">
          Configure automatic deal event broadcasting to conversations
        </p>
      </div>

      {/* View Only Banner */}
      {isViewOnly && <ViewOnlyBanner className="mb-6" />}

      {/* Content */}
      <CommsAutomationSettings />
    </div>
  )
}
