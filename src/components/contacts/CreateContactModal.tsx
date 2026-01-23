import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContactForm } from './ContactForm'
import { useContactStore } from '@/hooks/useContactStore'
import { useAuth } from '@/hooks/useAuth'
import { createContact } from '@/lib/contactService'
import { toast } from 'sonner'

interface CreateContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
}

export function CreateContactModal({
  open,
  onOpenChange,
  teamId,
}: CreateContactModalProps) {
  const { user } = useAuth()
  const { contactTypes, refreshList } = useContactStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    data: {
      first_name: string
      last_name?: string
      notes?: string
      type_ids?: string[]
      contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
    },
    saveCustomFields: (entityId: string) => Promise<void>
  ) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const contact = await createContact(
        {
          team_id: teamId,
          first_name: data.first_name,
          last_name: data.last_name,
          notes: data.notes,
          type_ids: data.type_ids,
          contact_methods: data.contact_methods,
        },
        user.id
      )

      // Save custom field values
      if (contact?.id) {
        await saveCustomFields(contact.id)
      }

      toast.success('Contact created successfully')
      await refreshList()
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating contact:', err)
      toast.error('Failed to create contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your team
          </DialogDescription>
        </DialogHeader>
        <ContactForm
          contactTypes={contactTypes}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
