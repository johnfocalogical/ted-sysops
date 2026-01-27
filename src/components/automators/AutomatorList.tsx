import { useState } from 'react'
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
import type { AutomatorWithCreator } from '@/types/automator.types'

interface AutomatorListProps {
  automators: AutomatorWithCreator[]
  onRefresh: () => void
}

export function AutomatorList({ automators, onRefresh }: AutomatorListProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useTeamContext()
  const { user } = useAuth()
  const [editingAutomator, setEditingAutomator] = useState<AutomatorWithCreator | null>(null)
  const [deletingAutomator, setDeletingAutomator] = useState<AutomatorWithCreator | null>(null)

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
      // Navigate to the new automator
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

  return (
    <>
      <div className="space-y-2">
        {automators.map((automator) => (
          <div
            key={automator.id}
            className="flex items-center justify-between p-4 rounded-lg border hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer group"
            onClick={() => handleEdit(automator)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
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
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {automator.description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {formatDistanceToNow(new Date(automator.updated_at), { addSuffix: true })}
                  {automator.creator && ` by ${automator.creator.full_name || automator.creator.email}`}
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
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                  <DropdownMenuItem onClick={() => handleTogglePublish(automator)}>
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
        ))}
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
    </>
  )
}
