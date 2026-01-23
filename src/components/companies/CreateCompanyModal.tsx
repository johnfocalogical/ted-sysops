import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CompanyForm } from './CompanyForm'
import { useCompanyStore } from '@/hooks/useCompanyStore'
import { useAuth } from '@/hooks/useAuth'
import { createCompany } from '@/lib/companyService'
import { toast } from 'sonner'

interface CreateCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
}

export function CreateCompanyModal({
  open,
  onOpenChange,
  teamId,
}: CreateCompanyModalProps) {
  const { user } = useAuth()
  const { companyTypes, refreshList } = useCompanyStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    data: {
      name: string
      address?: string
      city?: string
      state?: string
      zip?: string
      website?: string
      notes?: string
      type_ids?: string[]
      contact_methods?: { method_type: 'phone' | 'email' | 'fax' | 'other'; label: string; value: string; is_primary: boolean }[]
    },
    saveCustomFields: (entityId: string) => Promise<void>
  ) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const company = await createCompany(
        {
          team_id: teamId,
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          website: data.website,
          notes: data.notes,
          type_ids: data.type_ids,
          contact_methods: data.contact_methods,
        },
        user.id
      )

      // Save custom field values
      if (company?.id) {
        await saveCustomFields(company.id)
      }

      toast.success('Company created successfully')
      await refreshList()
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating company:', err)
      toast.error('Failed to create company')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
          <DialogDescription>
            Add a new company to your team
          </DialogDescription>
        </DialogHeader>
        <CompanyForm
          companyTypes={companyTypes}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
