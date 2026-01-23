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
import type { CompanyType, CompanyWithDetails } from '@/types/company.types'
import type { ContactMethodInput } from '@/types/contact.types'
import { ContactMethodsInput } from '@/components/shared/ContactMethodsInput'
import { CustomFieldsForm } from '@/components/custom-fields'
import { useCustomFields } from '@/hooks/useCustomFields'

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  website: z.string().optional(),
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
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyFormProps {
  company?: CompanyWithDetails | null
  companyTypes: CompanyType[]
  onSubmit: (
    data: CompanyFormData,
    saveCustomFields: (entityId: string) => Promise<void>
  ) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function CompanyForm({
  company,
  companyTypes,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CompanyFormProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      address: company?.address || '',
      city: company?.city || '',
      state: company?.state || '',
      zip: company?.zip || '',
      website: company?.website || '',
      notes: company?.notes || '',
      type_ids: company?.types.map((t) => t.id) || [],
      contact_methods: company?.contact_methods.map((m) => ({
        method_type: m.method_type,
        label: m.label || '',
        value: m.value,
        is_primary: m.is_primary,
      })) || [],
    },
  })

  const selectedTypeIds = form.watch('type_ids') || []

  // Custom fields hook
  const customFields = useCustomFields({
    entityType: 'company',
    entityId: company?.id,
    typeIds: selectedTypeIds,
    types: companyTypes.map((t) => ({
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

  const handleSubmit = async (data: CompanyFormData) => {
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
        {/* Company Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Title Company" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Fields */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main Street" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Austin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="TX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP</FormLabel>
                <FormControl>
                  <Input placeholder="78701" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Website */}
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Types */}
        <FormField
          control={form.control}
          name="type_ids"
          render={() => (
            <FormItem>
              <FormLabel>Company Types</FormLabel>
              <div className="border rounded-md p-3">
                <div className="grid grid-cols-2 gap-2">
                  {companyTypes.map((type) => (
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
                  placeholder="Additional notes about this company..."
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
            ) : company ? (
              'Save Changes'
            ) : (
              'Create Company'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
