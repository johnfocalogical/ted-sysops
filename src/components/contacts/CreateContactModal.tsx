import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContactForm } from './ContactForm'
import { useContactStore } from '@/hooks/useContactStore'
import { useCompanyStore } from '@/hooks/useCompanyStore'
import { useAuth } from '@/hooks/useAuth'
import { createContact } from '@/lib/contactService'
import { createCompany, linkContactToCompany } from '@/lib/companyService'
import { toast } from 'sonner'
import type { CompanyTypeSection } from '@/components/shared/CompanyTypeSectionsInput'

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
  const { companyTypes, loadCompanyTypes, setTeamId } = useCompanyStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load company types when modal opens
  useEffect(() => {
    if (open && teamId) {
      setTeamId(teamId)
      loadCompanyTypes()
    }
  }, [open, teamId, setTeamId, loadCompanyTypes])

  const handleSubmit = async (
    data: {
      first_name: string
      last_name?: string
      notes?: string
      type_ids?: string[]
      contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
      company_sections?: CompanyTypeSection[]
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

        // Create companies and link them
        if (data.company_sections?.length) {
          for (const section of data.company_sections) {
            // Create the company with the selected type
            const company = await createCompany(
              {
                team_id: teamId,
                name: section.company_name,
                type_ids: [section.type_id],
              },
              user.id
            )

            // Link contact to company with relationship-level contact methods
            await linkContactToCompany({
              contact_id: contact.id,
              company_id: company.id,
              contact_methods: section.contact_methods,
            })
          }
        }
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
          companyTypes={companyTypes}
          teamId={teamId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
