import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
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
import { deleteRole, canDeleteRole } from '@/lib/roleService'
import { toast } from 'sonner'
import type { RoleWithMemberCount } from '@/lib/roleService'

interface DeleteRoleDialogProps {
  open: boolean
  role: RoleWithMemberCount | null
  onClose: () => void
  onDeleted: () => void
}

export function DeleteRoleDialog({ open, role, onClose, onDeleted }: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!role) return

    setLoading(true)
    setError(null)

    try {
      // Double-check if role can be deleted
      const { canDelete, reason } = await canDeleteRole(role.id)

      if (!canDelete) {
        setError(reason || 'Cannot delete this role')
        setLoading(false)
        return
      }

      await deleteRole(role.id)
      toast.success(`Role "${role.name}" deleted`)
      onDeleted()
    } catch (err) {
      console.error('Error deleting role:', err)
      setError('Failed to delete role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!role) return null

  // Check if deletion is blocked
  const isBlocked = role.is_default || role.member_count > 0
  const blockReason = role.is_default
    ? 'Default roles cannot be deleted.'
    : role.member_count > 0
    ? `This role has ${role.member_count} member${role.member_count > 1 ? 's' : ''} assigned. You must reassign them to another role before deleting.`
    : null

  return (
    <AlertDialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Role
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {isBlocked ? (
              <span className="block text-destructive">{blockReason}</span>
            ) : (
              <>
                <span className="block">
                  Are you sure you want to delete the role{' '}
                  <strong className="text-foreground">"{role.name}"</strong>?
                </span>
                <span className="block">This action cannot be undone.</span>
              </>
            )}
            {error && (
              <span className="block text-destructive">{error}</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {!isBlocked && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Role
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
