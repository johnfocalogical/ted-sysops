import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { ContactType, ContactWithDetails, ContactMethodInput } from '@/types/contact.types'
import type { CompanyType } from '@/types/company.types'
import { ContactMethodsInput } from '@/components/shared/ContactMethodsInput'
import { CompanyTypeSectionsInput, type CompanyTypeSection } from '@/components/shared/CompanyTypeSectionsInput'
import { CustomFieldsForm } from '@/components/custom-fields'
import { useCustomFields } from '@/hooks/useCustomFields'

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  notes: z.string().optional(),
  type_ids: z.array(z.string()).optional(),
  contact_methods: z.array(
    z.object({
      method_type: z.enum(['phone', 'email', 'fax', 'other']),
      label: z.string(),
      value: z.string().min(1, 'Value is required'),
      is_primary: z.boolean(),
    })
  ).optional(),
  company_sections: z.array(
    z.object({
      type_id: z.string(),
      type_name: z.string(),
      company_name: z.string().min(1, 'Company name is required'),
      contact_methods: z.array(
        z.object({
          method_type: z.enum(['phone', 'email', 'fax', 'other']),
          label: z.string(),
          value: z.string().min(1),
          is_primary: z.boolean(),
        })
      ).optional(),
    })
  ).optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  contact?: ContactWithDetails | null
  contactTypes: ContactType[]
  companyTypes: CompanyType[]
  teamId: string
  onSubmit: (
    data: ContactFormData,
    saveCustomFields: (entityId: string) => Promise<void>
  ) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ContactForm({
  contact,
  contactTypes,
  companyTypes,
  teamId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: contact?.first_name || '',
      last_name: contact?.last_name || '',
      notes: contact?.notes || '',
      type_ids: contact?.types.map((t) => t.id) || [],
      contact_methods: contact?.contact_methods.map((m) => ({
        method_type: m.method_type,
        label: m.label || '',
        value: m.value,
        is_primary: m.is_primary,
      })) || [],
      // Company sections are for creating NEW companies - don't pre-populate from existing links
      company_sections: [],
    },
  })

  const selectedTypeIds = form.watch('type_ids') || []

  // Custom fields hook
  const customFields = useCustomFields({
    entityType: 'contact',
    entityId: contact?.id,
    typeIds: selectedTypeIds,
    types: contactTypes.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      icon: t.icon,
    })),
  })

  const toggleType = (typeId: string) => {
    const current = form.getValues('type_ids') || []
    if (current.includes(typeId)) {
      form.setValue('type_ids', current.filter((id) => id !== typeId))
    } else {
      form.setValue('type_ids', [...current, typeId])
    }
  }

  const handleSubmit = async (data: ContactFormData) => {
    // Validate custom fields first
    if (!customFields.validate()) {
      return
    }

    // Pass both form data and custom fields save function
    await onSubmit(data, customFields.saveValues)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Types */}
        <FormField
          control={form.control}
          name="type_ids"
          render={() => (
            <FormItem>
              <FormLabel>Contact Types</FormLabel>
              <div className="border rounded-md p-3">
                <div className="grid grid-cols-2 gap-2">
                  {contactTypes.map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`type-${type.id}`}
                        checked={selectedTypeIds.includes(type.id)}
                        onCheckedChange={() => toggleType(type.id)}
                      />
                      <label
                        htmlFor={`type-${type.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Type Sections - For creating new companies */}
        <FormField
          control={form.control}
          name="company_sections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Companies</FormLabel>
              <CompanyTypeSectionsInput
                value={field.value || []}
                onChange={field.onChange}
                companyTypes={companyTypes}
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Fields (grouped by type) */}
        {customFields.sections.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="border-b pb-2">
              <h3 className="text-sm font-medium">Custom Fields</h3>
            </div>
            <CustomFieldsForm
              sections={customFields.sections}
              values={customFields.values}
              errors={customFields.errors}
              disabled={isSubmitting}
              onChange={customFields.setValue}
              onAddOption={customFields.addOptionToField}
            />
          </div>
        )}

        {/* Contact Methods */}
        <FormField
          control={form.control}
          name="contact_methods"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Methods</FormLabel>
              <ContactMethodsInput
                value={field.value || []}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this contact..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : contact ? (
              'Save Changes'
            ) : (
              'Create Contact'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
