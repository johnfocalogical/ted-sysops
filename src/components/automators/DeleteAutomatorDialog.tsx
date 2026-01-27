import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteAutomator } from '@/lib/automatorService'
import { toast } from 'sonner'
import type { AutomatorWithCreator } from '@/types/automator.types'

interface DeleteAutomatorDialogProps {
  open: boolean
  automator: AutomatorWithCreator | null
  onClose: () => void
  onDeleted: () => void
}

export function DeleteAutomatorDialog({
  open,
  automator,
  onClose,
  onDeleted,
}: DeleteAutomatorDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!automator) return

    setDeleting(true)
    try {
      await deleteAutomator(automator.id)
      toast.success('Automator deleted')
      onDeleted()
    } catch (err) {
      console.error('Error deleting automator:', err)
      toast.error('Failed to delete automator')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Automator
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{automator?.name}"</strong>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
