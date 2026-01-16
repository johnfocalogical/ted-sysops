import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useTeamContext } from '@/hooks/useTeamContext'
import type { PermissionLevel } from '@/types/team-member.types'

interface MemberToRemove {
  id: string
  permission_level: PermissionLevel
  user: {
    full_name: string | null
    email: string
  }
}

interface RemoveMemberDialogProps {
  open: boolean
  member: MemberToRemove | null
  onClose: () => void
  onRemoved: () => void
}

export function RemoveMemberDialog({
  open,
  member,
  onClose,
  onRemoved,
}: RemoveMemberDialogProps) {
  const { context } = useTeamContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRemove = async () => {
    if (!supabase || !context || !member) {
      setError('Not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if removing the last admin
      if (member.permission_level === 'admin') {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', context.team.id)
          .eq('permission_level', 'admin')

        if (count && count <= 1) {
          setError('Cannot remove the last admin. Promote another member first.')
          setLoading(false)
          return
        }
      }

      // Remove the member
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Success
      onRemoved()
    } catch (err) {
      console.error('Error removing member:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const memberName = member?.user.full_name || member?.user.email.split('@')[0] || 'Member'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Team Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{' '}
            <span className="font-medium text-foreground">{memberName}</span> from{' '}
            <span className="font-medium text-foreground">{context?.team.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The user will immediately lose access to this team
            and all its resources. They can be re-invited later if needed.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
