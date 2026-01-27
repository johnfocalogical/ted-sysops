import { useState } from 'react'
import { MoreHorizontal, Pencil, Power, PowerOff, Settings2, Trash2 } from 'lucide-react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TypeBadge } from '@/components/shared/TypeBadge'
import {
  updateTeamContactType,
  updateTeamCompanyType,
  updateTeamEmployeeType,
  deleteTeamContactType,
  deleteTeamCompanyType,
  deleteTeamEmployeeType,
  canDeleteTeamContactType,
  canDeleteTeamCompanyType,
  canDeleteTeamEmployeeType,
} from '@/lib/teamTypeService'
import type {
  TeamContactTypeWithUsage,
  TeamCompanyTypeWithUsage,
  TeamEmployeeTypeWithUsage,
} from '@/types/type-system.types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type AnyTeamTypeWithUsage = TeamContactTypeWithUsage | TeamCompanyTypeWithUsage | TeamEmployeeTypeWithUsage

interface TypeListProps {
  types: AnyTeamTypeWithUsage[]
  entityType: 'contact' | 'company' | 'employee'
  onEdit: (type: AnyTeamTypeWithUsage) => void
  onManageFields?: (type: AnyTeamTypeWithUsage) => void
  onRefresh: () => void
}

export function TypeList({ types, entityType, onEdit, onManageFields, onRefresh }: TypeListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<AnyTeamTypeWithUsage | null>(null)
  const [canDelete, setCanDelete] = useState(true)
  const [deleteReason, setDeleteReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleToggleActive = async (
    type: AnyTeamTypeWithUsage
  ) => {
    setProcessing(true)
    try {
      if (entityType === 'contact') {
        await updateTeamContactType(type.id, { is_active: !type.is_active })
      } else if (entityType === 'company') {
        await updateTeamCompanyType(type.id, { is_active: !type.is_active })
      } else {
        await updateTeamEmployeeType(type.id, { is_active: !type.is_active })
      }
      toast.success(type.is_active ? 'Type deactivated' : 'Type activated')
      onRefresh()
    } catch (err) {
      console.error('Error toggling type:', err)
      toast.error('Failed to update type')
    } finally {
      setProcessing(false)
    }
  }

  const openDeleteDialog = async (
    type: AnyTeamTypeWithUsage
  ) => {
    setDeletingType(type)
    setProcessing(true)

    try {
      const result =
        entityType === 'contact'
          ? await canDeleteTeamContactType(type.id)
          : entityType === 'company'
            ? await canDeleteTeamCompanyType(type.id)
            : await canDeleteTeamEmployeeType(type.id)

      setCanDelete(result.canDelete)
      setDeleteReason(result.reason || '')
    } catch (err) {
      console.error('Error checking delete:', err)
      setCanDelete(false)
      setDeleteReason('Unable to check if type can be deleted')
    } finally {
      setProcessing(false)
      setDeleteDialogOpen(true)
    }
  }

  const handleDelete = async () => {
    if (!deletingType) return

    setProcessing(true)
    try {
      if (entityType === 'contact') {
        await deleteTeamContactType(deletingType.id)
      } else if (entityType === 'company') {
        await deleteTeamCompanyType(deletingType.id)
      } else {
        await deleteTeamEmployeeType(deletingType.id)
      }
      toast.success('Type deleted')
      setDeleteDialogOpen(false)
      setDeletingType(null)
      onRefresh()
    } catch (err) {
      console.error('Error deleting type:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete type')
    } finally {
      setProcessing(false)
    }
  }

  if (types.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No {entityType} types found. Create one to get started.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {types.map((type) => (
          <div
            key={type.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border',
              !type.is_active && 'bg-muted/50 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <TypeBadge
                name={type.name}
                icon={type.icon}
                color={type.color}
              />
              {!type.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              {type.template_id && (
                <Badge variant="outline" className="text-xs">
                  From template
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {type.usage_count} {entityType === 'contact' ? 'contacts' : entityType === 'company' ? 'companies' : 'employees'}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={processing}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(type)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onManageFields?.(type)}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Manage Fields
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleActive(type)}>
                    {type.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(type)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {entityType === 'contact' ? 'Contact' : entityType === 'company' ? 'Company' : 'Employee'} Type
            </AlertDialogTitle>
            <AlertDialogDescription>
              {canDelete ? (
                <>
                  Are you sure you want to delete "{deletingType?.name}"? This action
                  cannot be undone.
                </>
              ) : (
                <>
                  Cannot delete "{deletingType?.name}". {deleteReason}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={processing}
              >
                {processing ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
