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
import { deleteCompany, getCompanyDeletionInfo } from '@/lib/companyService'
import { toast } from 'sonner'

interface DeleteCompanyDialogProps {
  companyId: string
  companyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteCompanyDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCompanyDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [deletionInfo, setDeletionInfo] = useState<{
    contactLinkCount: number
  } | null>(null)

  // Load deletion info when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && !deletionInfo) {
      try {
        const info = await getCompanyDeletionInfo(companyId)
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
      await deleteCompany(companyId)
      toast.success('Company deleted successfully')
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      console.error('Error deleting company:', err)
      toast.error('Failed to delete company')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Company</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{companyName}</strong>?
            </p>
            {deletionInfo && deletionInfo.contactLinkCount > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                This will remove {deletionInfo.contactLinkCount} contact link
                {deletionInfo.contactLinkCount > 1 ? 's' : ''}.
                The contacts themselves will not be deleted.
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
