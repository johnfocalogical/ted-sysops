import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import { deleteContact, getContactDeletionInfo } from '@/lib/contactService'
import { toast } from 'sonner'

interface DeleteContactDialogProps {
  contactId: string
  contactName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteContactDialog({
  contactId,
  contactName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteContactDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [deletionInfo, setDeletionInfo] = useState<{
    companyLinkCount: number
    isPocForCompanies: string[]
  } | null>(null)

  // Load deletion info when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && !deletionInfo) {
      try {
        const info = await getContactDeletionInfo(contactId)
        setDeletionInfo(info)
      } catch (err) {
        console.error('Error loading deletion info:', err)
      }
    }
    onOpenChange(isOpen)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteContact(contactId)
      toast.success('Contact deleted successfully')
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      console.error('Error deleting contact:', err)
      toast.error('Failed to delete contact')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{contactName}</strong>?
            </p>
            {deletionInfo && deletionInfo.companyLinkCount > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                This will remove {deletionInfo.companyLinkCount} company link
                {deletionInfo.companyLinkCount > 1 ? 's' : ''}.
              </p>
            )}
            {deletionInfo && deletionInfo.isPocForCompanies.length > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                This contact is the POC for:{' '}
                {deletionInfo.isPocForCompanies.join(', ')}
              </p>
            )}
            <p className="text-muted-foreground">This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
