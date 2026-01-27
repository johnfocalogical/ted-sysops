import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, CheckCircle, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import { saveAutomatorDefinition, publishAutomator, unpublishAutomator } from '@/lib/automatorService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function AutomatorToolbar() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [publishing, setPublishing] = useState(false)

  const {
    automator,
    isDirty,
    isSaving,
    setIsSaving,
    setIsDirty,
    getDefinition,
    setAutomator,
  } = useAutomatorBuilderStore()

  const handleBack = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) return
    }
    navigate(`/org/${orgId}/team/${teamId}/settings/automators`)
  }

  const handleSave = async () => {
    if (!automator || !user) return

    setIsSaving(true)
    try {
      const definition = getDefinition()
      const updated = await saveAutomatorDefinition(automator.id, definition, user.id)
      setAutomator(updated)
      setIsDirty(false)
      toast.success('Automator saved')
    } catch (err) {
      console.error('Error saving automator:', err)
      toast.error('Failed to save automator')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!automator || !user) return

    // Save first if there are unsaved changes
    if (isDirty) {
      await handleSave()
    }

    setPublishing(true)
    try {
      let updated
      if (automator.status === 'published') {
        updated = await unpublishAutomator(automator.id, user.id)
        toast.success('Automator unpublished')
      } else {
        updated = await publishAutomator(automator.id, user.id)
        toast.success('Automator published')
      }
      setAutomator(updated)
    } catch (err) {
      console.error('Error toggling publish:', err)
      toast.error('Failed to update automator status')
    } finally {
      setPublishing(false)
    }
  }

  if (!automator) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      {/* Left side - Back button and title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{automator.name}</h1>
          <Badge
            variant={automator.status === 'published' ? 'default' : 'secondary'}
            className={
              automator.status === 'published'
                ? 'bg-green-100 text-green-800 border-green-300'
                : ''
            }
          >
            {automator.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
          {isDirty && (
            <span className="text-xs text-muted-foreground">• Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isDirty ? (
            <Save className="h-4 w-4 mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          )}
          {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
        </Button>

        <Button
          size="sm"
          onClick={handleTogglePublish}
          disabled={publishing}
          className={
            automator.status === 'published'
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-accent hover:bg-accent/90'
          }
        >
          {publishing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : automator.status === 'published' ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {automator.status === 'published' ? 'Unpublish' : 'Publish'}
        </Button>
      </div>
    </div>
  )
}
