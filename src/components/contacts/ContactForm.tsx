import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Loader2, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Basic Info
          </div>
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
        </div>

        {/* Contact Types */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Contact Types
          </div>
          <FormField
            control={form.control}
            name="type_ids"
            render={() => (
              <FormItem>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Companies Section */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Companies
          </div>

          {/* Existing Linked Companies (read-only) */}
          {contact?.companies && contact.companies.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Linked Companies
              </div>
              <div className="space-y-2">
                {contact.companies.map((link) => (
                  <div
                    key={link.id}
                    className="rounded-lg border bg-background/50 p-3 space-y-2"
                  >
                    <div className="font-medium text-sm">{link.company.name}</div>
                    {link.role_title && (
                      <div className="text-xs text-muted-foreground">{link.role_title}</div>
                    )}
                    {/* Company Types */}
                    {link.company.types && link.company.types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {link.company.types.map((type) => (
                          <Badge
                            key={type.id}
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                            style={{
                              borderColor: type.color,
                              color: type.color,
                            }}
                          >
                            {type.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Relationship Contact Methods */}
                    {link.contact_methods.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/50">
                        {link.contact_methods.map((method) => (
                          <div key={method.id} className="flex items-center gap-2 text-xs">
                            {method.method_type === 'phone' ? (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            ) : method.method_type === 'email' ? (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            ) : null}
                            <span>{method.value}</span>
                            {method.label && (
                              <span className="text-muted-foreground">({method.label})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Company Section */}
          <FormField
            control={form.control}
            name="company_sections"
            render={({ field }) => (
              <FormItem>
                <div className="text-xs text-muted-foreground">
                  Add New Company
                </div>
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
        </div>

        {/* Custom Fields (grouped by type) */}
        {customFields.sections.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Custom Fields
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
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Contact Methods
          </div>
          <FormField
            control={form.control}
            name="contact_methods"
            render={({ field }) => (
              <FormItem>
                <ContactMethodsInput
                  value={field.value || []}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this contact..."
                    className="resize-none bg-background"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
