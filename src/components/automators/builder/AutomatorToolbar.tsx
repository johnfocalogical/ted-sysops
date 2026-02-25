import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, CheckCircle, Play, Pause, ChevronRight } from 'lucide-react'
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
    breadcrumbStack,
    popBreadcrumb,
  } = useAutomatorBuilderStore()

  const handleBack = async () => {
    // Auto-save if there are unsaved changes
    if (isDirty && automator && user) {
      setIsSaving(true)
      try {
        const definition = getDefinition()
        await saveAutomatorDefinition(automator.id, definition, user.id)
        setIsDirty(false)
      } catch {
        // If save fails, ask user whether to discard
        const confirmed = window.confirm(
          'Failed to save changes. Leave anyway and discard changes?'
        )
        if (!confirmed) {
          setIsSaving(false)
          return
        }
      } finally {
        setIsSaving(false)
      }
    }

    // If we have breadcrumbs, go back to parent automator
    if (breadcrumbStack.length > 0) {
      const parent = popBreadcrumb()
      if (parent) {
        navigate(
          `/org/${orgId}/team/${teamId}/settings/automators/${parent.automatorId}`
        )
        return
      }
    }

    navigate(`/org/${orgId}/team/${teamId}/settings/automators`)
  }

  const handleBreadcrumbClick = async (index: number) => {
    // Auto-save if there are unsaved changes
    if (isDirty && automator && user) {
      setIsSaving(true)
      try {
        const definition = getDefinition()
        await saveAutomatorDefinition(automator.id, definition, user.id)
        setIsDirty(false)
      } catch {
        const confirmed = window.confirm(
          'Failed to save changes. Leave anyway and discard changes?'
        )
        if (!confirmed) {
          setIsSaving(false)
          return
        }
      } finally {
        setIsSaving(false)
      }
    }

    // Pop all breadcrumbs after the clicked index
    const entry = breadcrumbStack[index]
    const { breadcrumbStack: currentStack } = useAutomatorBuilderStore.getState()
    const newStack = currentStack.slice(0, index)
    useAutomatorBuilderStore.setState({ breadcrumbStack: newStack })

    navigate(
      `/org/${orgId}/team/${teamId}/settings/automators/${entry.automatorId}`
    )
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
      {/* Left side - Back button, breadcrumbs, and title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {breadcrumbStack.length > 0 ? 'Parent' : 'Back'}
        </Button>
        <div className="flex items-center gap-2">
          {/* Breadcrumb trail */}
          {breadcrumbStack.map((entry, index) => (
            <div key={entry.automatorId} className="flex items-center gap-2">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                onClick={() => handleBreadcrumbClick(index)}
                title={entry.automatorName}
              >
                {entry.automatorName}
              </button>
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
          ))}

          {/* Current automator name */}
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
