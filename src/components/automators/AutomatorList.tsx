import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Play,
  Pause,
  Zap,
  CheckCircle,
  AlertTriangle,
  List,
  GitBranch,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AutomatorFormModal } from './AutomatorFormModal'
import { DeleteAutomatorDialog } from './DeleteAutomatorDialog'
import { useTeamContext } from '@/hooks/useTeamContext'
import {
  duplicateAutomator,
  publishAutomator,
  unpublishAutomator,
} from '@/lib/automatorService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AutomatorWithCreator } from '@/types/automator.types'

type ViewMode = 'flat' | 'tree'

interface AutomatorListProps {
  automators: AutomatorWithCreator[]
  onRefresh: () => void
}

// ============================================================================
// Relationship Computation
// ============================================================================

interface AutomatorRelationships {
  childrenByParent: Map<string, AutomatorWithCreator[]>
  parentsByChild: Map<string, AutomatorWithCreator[]>
  rootAutomators: AutomatorWithCreator[]
}

function computeRelationships(
  automators: AutomatorWithCreator[]
): AutomatorRelationships {
  const automatorMap = new Map(automators.map((a) => [a.id, a]))
  const childrenByParent = new Map<string, AutomatorWithCreator[]>()
  const parentsByChild = new Map<string, AutomatorWithCreator[]>()
  const hasParent = new Set<string>()

  for (const automator of automators) {
    for (const parentId of automator.parent_automator_ids ?? []) {
      const parent = automatorMap.get(parentId)
      if (parent) {
        hasParent.add(automator.id)

        const children = childrenByParent.get(parentId) ?? []
        children.push(automator)
        childrenByParent.set(parentId, children)

        const parents = parentsByChild.get(automator.id) ?? []
        parents.push(parent)
        parentsByChild.set(automator.id, parents)
      }
    }
  }

  const rootAutomators = automators.filter((a) => !hasParent.has(a.id))

  return { childrenByParent, parentsByChild, rootAutomators }
}

// ============================================================================
// Completeness Check
// ============================================================================

function checkCompleteness(
  automator: AutomatorWithCreator,
  childrenByParent: Map<string, AutomatorWithCreator[]>,
  visited: Set<string> = new Set()
): { complete: boolean; reason?: string } {
  if (visited.has(automator.id)) return { complete: true } // Circular reference guard
  visited.add(automator.id)

  if (automator.status !== 'published') {
    return { complete: false, reason: `${automator.name} is still in draft` }
  }

  const children = childrenByParent.get(automator.id) ?? []
  for (const child of children) {
    const childResult = checkCompleteness(child, childrenByParent, visited)
    if (!childResult.complete) {
      return childResult
    }
  }

  return { complete: true }
}

// ============================================================================
// Main Component
// ============================================================================

export function AutomatorList({ automators, onRefresh }: AutomatorListProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useTeamContext()
  const { user } = useAuth()
  const [editingAutomator, setEditingAutomator] = useState<AutomatorWithCreator | null>(null)
  const [deletingAutomator, setDeletingAutomator] = useState<AutomatorWithCreator | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('flat')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Compute relationships
  const { childrenByParent, parentsByChild, rootAutomators } = useMemo(
    () => computeRelationships(automators),
    [automators]
  )

  const handleEdit = (automator: AutomatorWithCreator) => {
    navigate(`/org/${orgId}/team/${teamId}/settings/automators/${automator.id}`)
  }

  const handleRename = (automator: AutomatorWithCreator) => {
    setEditingAutomator(automator)
  }

  const handleDuplicate = async (automator: AutomatorWithCreator) => {
    if (!user) return

    try {
      const newName = `${automator.name} (Copy)`
      const duplicated = await duplicateAutomator(automator.id, newName, user.id)
      toast.success('Automator duplicated')
      onRefresh()
      navigate(`/org/${orgId}/team/${teamId}/settings/automators/${duplicated.id}`)
    } catch (err) {
      console.error('Error duplicating automator:', err)
      toast.error('Failed to duplicate automator')
    }
  }

  const handleTogglePublish = async (automator: AutomatorWithCreator) => {
    if (!user) return

    try {
      if (automator.status === 'published') {
        await unpublishAutomator(automator.id, user.id)
        toast.success('Automator unpublished')
      } else {
        await publishAutomator(automator.id, user.id)
        toast.success('Automator published')
      }
      onRefresh()
    } catch (err) {
      console.error('Error toggling publish status:', err)
      toast.error('Failed to update automator status')
    }
  }

  const handleRenameSaved = () => {
    setEditingAutomator(null)
    onRefresh()
  }

  const handleDeleted = () => {
    setDeletingAutomator(null)
    onRefresh()
  }

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const navigateToAutomator = useCallback(
    (e: React.MouseEvent, automatorId: string) => {
      e.stopPropagation()
      navigate(`/org/${orgId}/team/${teamId}/settings/automators/${automatorId}`)
    },
    [navigate, orgId, teamId]
  )

  // ============================================================================
  // Render Row
  // ============================================================================

  const renderRow = (
    automator: AutomatorWithCreator,
    indent: number = 0,
    showTreeControls: boolean = false
  ) => {
    const children = childrenByParent.get(automator.id) ?? []
    const parents = parentsByChild.get(automator.id) ?? []
    const { complete, reason } = checkCompleteness(automator, childrenByParent)
    const isExpanded = expandedIds.has(automator.id)
    const hasChildren = children.length > 0

    return (
      <div key={automator.id}>
        <div
          className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer group"
          style={{ marginLeft: indent * 24 }}
          onClick={() => handleEdit(automator)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Tree expand/collapse control */}
            {showTreeControls && (
              <button
                type="button"
                className={cn(
                  'shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors',
                  hasChildren
                    ? 'hover:bg-muted text-muted-foreground'
                    : 'invisible'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpanded(automator.id)
                }}
              >
                {hasChildren &&
                  (isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ))}
              </button>
            )}

            {/* Completeness indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="shrink-0">
                  {complete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-xs">
                  {complete
                    ? 'Ready \u2014 all workflows published'
                    : `Incomplete \u2014 ${reason}`}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Icon */}
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-accent" />
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium truncate">{automator.name}</h4>
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

                {/* Dependency badges (only in flat view) */}
                {viewMode === 'flat' && children.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Triggers:
                    </span>
                    {children.slice(0, 3).map((child) => (
                      <Badge
                        key={child.id}
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 cursor-pointer border-primary/30 text-primary hover:bg-primary/10"
                        onClick={(e) => navigateToAutomator(e, child.id)}
                      >
                        {child.name}
                      </Badge>
                    ))}
                    {children.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{children.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {viewMode === 'flat' && parents.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Triggered by:
                    </span>
                    {parents.slice(0, 3).map((parent) => (
                      <Badge
                        key={parent.id}
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 cursor-pointer border-accent/30 text-accent hover:bg-accent/10"
                        onClick={(e) => navigateToAutomator(e, parent.id)}
                      >
                        {parent.name}
                      </Badge>
                    ))}
                    {parents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{parents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground truncate">
                {automator.description || 'No description'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Updated{' '}
                {formatDistanceToNow(new Date(automator.updated_at), {
                  addSuffix: true,
                })}
                {automator.creator &&
                  ` by ${automator.creator.full_name || automator.creator.email}`}
              </p>
            </div>
          </div>

          {isAdmin() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={() => handleEdit(automator)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRename(automator)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(automator)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleTogglePublish(automator)}
                >
                  {automator.status === 'published' ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingAutomator(automator)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Render children in tree mode */}
        {showTreeControls && isExpanded &&
          children.map((child) => renderRow(child, indent + 1, true))}
      </div>
    )
  }

  // ============================================================================
  // Empty State
  // ============================================================================

  if (automators.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="h-6 w-6 text-accent" />
        </div>
        <h3 className="text-lg font-medium mb-2">No automators yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Create your first automator to build guided workflows for your team.
        </p>
      </div>
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  const hasRelationships = childrenByParent.size > 0

  return (
    <TooltipProvider delayDuration={300}>
      {/* View toggle (only shown when relationships exist) */}
      {hasRelationships && (
        <div className="flex items-center justify-end mb-3">
          <div className="flex items-center border rounded-md">
            <button
              type="button"
              className={cn(
                'px-2.5 py-1.5 text-xs flex items-center gap-1 rounded-l-md transition-colors',
                viewMode === 'flat'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
              onClick={() => setViewMode('flat')}
            >
              <List className="h-3.5 w-3.5" />
              Flat
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1.5 text-xs flex items-center gap-1 rounded-r-md border-l transition-colors',
                viewMode === 'tree'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
              onClick={() => setViewMode('tree')}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Tree
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {viewMode === 'flat'
          ? automators.map((automator) => renderRow(automator))
          : rootAutomators.map((automator) => renderRow(automator, 0, true))}
      </div>

      {/* Rename Modal */}
      <AutomatorFormModal
        open={!!editingAutomator}
        automator={editingAutomator}
        onClose={() => setEditingAutomator(null)}
        onSaved={handleRenameSaved}
      />

      {/* Delete Dialog */}
      <DeleteAutomatorDialog
        open={!!deletingAutomator}
        automator={deletingAutomator}
        onClose={() => setDeletingAutomator(null)}
        onDeleted={handleDeleted}
      />
    </TooltipProvider>
  )
}
