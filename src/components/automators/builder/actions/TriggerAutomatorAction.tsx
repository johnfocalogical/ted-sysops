import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Zap, Plus, Link, Loader2, ExternalLink } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useAuth } from '@/hooks/useAuth'
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import {
  getPublishedAutomatorsForTeam,
  createChildAutomator,
  addParentReference,
  removeParentReference,
  isAutomatorNameUnique,
  getAutomator,
  saveAutomatorDefinition,
} from '@/lib/automatorService'
import type { TriggerAutomatorParams } from '@/types/automator.types'

interface TriggerAutomatorActionProps {
  params: TriggerAutomatorParams
  onChange: (params: TriggerAutomatorParams) => void
}

export function TriggerAutomatorAction({ params, onChange }: TriggerAutomatorActionProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { context } = useTeamContext()
  const { user } = useAuth()
  const { automator, getDefinition, setIsDirty, pushBreadcrumb } = useAutomatorBuilderStore()

  const [mode, setMode] = useState<'link' | 'create'>(
    params.automator_id ? 'link' : 'link'
  )
  const [automators, setAutomators] = useState<
    Array<{ id: string; name: string; status: string }>
  >([])
  const [loadingList, setLoadingList] = useState(false)
  const [linkedAutomatorName, setLinkedAutomatorName] = useState<string | null>(null)

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Load available automators for the dropdown
  useEffect(() => {
    if (!context) return
    setLoadingList(true)
    getPublishedAutomatorsForTeam(context.team.id)
      .then(setAutomators)
      .catch((err) => console.error('Error loading automators:', err))
      .finally(() => setLoadingList(false))
  }, [context])

  // Resolve the linked automator name for display
  useEffect(() => {
    if (!params.automator_id) {
      setLinkedAutomatorName(null)
      return
    }
    // Check in the loaded list first
    const found = automators.find((a) => a.id === params.automator_id)
    if (found) {
      setLinkedAutomatorName(found.name)
      return
    }
    // Otherwise fetch it
    getAutomator(params.automator_id)
      .then((a) => setLinkedAutomatorName(a?.name ?? null))
      .catch(() => setLinkedAutomatorName(null))
  }, [params.automator_id, automators])

  const handleSelectExisting = async (automatorId: string) => {
    const previousId = params.automator_id

    onChange({ automator_id: automatorId })

    // Maintain parent references
    if (automator) {
      try {
        if (previousId && previousId !== automatorId) {
          await removeParentReference(previousId, automator.id)
        }
        await addParentReference(automatorId, automator.id)
      } catch (err) {
        console.error('Error updating parent references:', err)
      }
    }
  }

  const handleCreateNew = async () => {
    if (!context || !user || !automator) return
    if (!newName.trim()) return

    setCreating(true)
    try {
      // Check uniqueness
      const unique = await isAutomatorNameUnique(context.team.id, newName.trim())
      if (!unique) {
        toast.error('An automator with this name already exists')
        setCreating(false)
        return
      }

      // Create the child automator
      const child = await createChildAutomator(
        context.team.id,
        newName.trim(),
        newDescription.trim() || undefined,
        automator.id,
        user.id
      )

      // Set the child ID on the trigger action params
      onChange({ automator_id: child.id })

      // Save current automator before navigating
      const definition = getDefinition()
      await saveAutomatorDefinition(automator.id, definition, user.id)
      setIsDirty(false)

      toast.success(`Child automator "${child.name}" created`)
      setShowCreateModal(false)
      setNewName('')
      setNewDescription('')

      // Push current automator onto breadcrumb stack and navigate to child
      pushBreadcrumb({
        automatorId: automator.id,
        automatorName: automator.name,
      })
      navigate(
        `/org/${orgId}/team/${teamId}/settings/automators/${child.id}`
      )
    } catch (err) {
      console.error('Error creating child automator:', err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to create child automator'
      )
    } finally {
      setCreating(false)
    }
  }

  const handleDrillDown = () => {
    if (!params.automator_id || !automator || !user) return

    // Save current state before navigating
    const definition = getDefinition()
    saveAutomatorDefinition(automator.id, definition, user.id)
      .then(() => {
        setIsDirty(false)
        pushBreadcrumb({
          automatorId: automator.id,
          automatorName: automator.name,
        })
        navigate(
          `/org/${orgId}/team/${teamId}/settings/automators/${params.automator_id}`
        )
      })
      .catch((err) => {
        console.error('Error saving before drill-down:', err)
        toast.error('Failed to save before navigating')
      })
  }

  return (
    <div className="space-y-3">
      {/* Mode selection */}
      <div className="flex gap-1">
        <Button
          type="button"
          variant={mode === 'link' ? 'default' : 'ghost'}
          size="sm"
          className={mode === 'link' ? 'bg-accent hover:bg-accent/90 h-7 text-xs' : 'h-7 text-xs'}
          onClick={() => setMode('link')}
        >
          <Link className="h-3 w-3 mr-1" />
          Link Existing
        </Button>
        <Button
          type="button"
          variant={mode === 'create' ? 'default' : 'ghost'}
          size="sm"
          className={mode === 'create' ? 'bg-accent hover:bg-accent/90 h-7 text-xs' : 'h-7 text-xs'}
          onClick={() => {
            setMode('create')
            setShowCreateModal(true)
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Create New
        </Button>
      </div>

      {/* Link Existing mode */}
      {mode === 'link' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-purple-500" />
            Target Automator
          </Label>
          {loadingList ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading automators...
            </div>
          ) : automators.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No automators available. Create one first.
            </p>
          ) : (
            <Select
              value={params.automator_id || ''}
              onValueChange={handleSelectExisting}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select automator..." />
              </SelectTrigger>
              <SelectContent>
                {automators
                  .filter((a) => a.id !== automator?.id) // Don't allow self-reference
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        {a.name}
                        {a.status === 'draft' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 text-amber-600 border-amber-300"
                          >
                            Draft
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Current linked automator display */}
      {params.automator_id && linkedAutomatorName && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/10 border border-accent/20">
          <Zap className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs font-medium flex-1 truncate">
            {linkedAutomatorName}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-accent hover:text-accent/80"
            onClick={handleDrillDown}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      {/* Create New Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Create Child Automator
            </DialogTitle>
            <DialogDescription>
              Create a new automator that will be triggered by this step.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Title Review Process"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe what this automator does..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleCreateNew}
              disabled={creating || !newName.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Create & Edit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
