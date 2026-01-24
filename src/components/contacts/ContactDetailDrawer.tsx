import { Loader2, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ContactSummaryPanel } from './ContactSummaryPanel'
import { useContactStore } from '@/hooks/useContactStore'

interface ContactDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailDrawer({
  open,
  onOpenChange,
}: ContactDetailDrawerProps) {
  const {
    selectedContact,
    loadingSelected,
    selectContact,
  } = useContactStore()

  const handleClose = () => {
    onOpenChange(false)
    selectContact(null)
  }

  // Format display name for header
  const displayName = selectedContact
    ? selectedContact.last_name
      ? `${selectedContact.first_name} ${selectedContact.last_name}`
      : selectedContact.first_name
    : 'Contact'

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>{displayName}</SheetTitle>
        </SheetHeader>

        {loadingSelected ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !selectedContact ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Contact not found</p>
          </div>
        ) : (
          <ContactSummaryPanel
            contact={selectedContact}
            onClose={handleClose}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
