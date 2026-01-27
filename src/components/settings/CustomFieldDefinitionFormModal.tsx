import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  createCustomField,
  updateCustomField,
} from '@/lib/teamTypeService'
import type {
  CustomFieldDefinition,
  CustomFieldType,
} from '@/types/type-system.types'
import { CUSTOM_FIELD_TYPE_LABELS } from '@/types/type-system.types'
import { toast } from 'sonner'

const FIELD_TYPES: CustomFieldType[] = [
  'text',
  'textarea',
  'number',
  'currency',
  'date',
  'dropdown',
  'multi_select',
  'checkbox',
  'url',
  'email',
  'phone',
]

const formSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  field_type: z.enum(['text', 'textarea', 'number', 'currency', 'date', 'dropdown', 'multi_select', 'checkbox', 'url', 'email', 'phone']),
  description: z.string().optional(),
  is_required: z.boolean(),
  options: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CustomFieldDefinitionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  typeId: string
  entityType: 'contact' | 'company' | 'employee'
  field?: CustomFieldDefinition | null
  onSaved: () => void
}

export function CustomFieldDefinitionFormModal({
  open,
  onOpenChange,
  typeId,
  entityType,
  field,
  onSaved,
}: CustomFieldDefinitionFormModalProps) {
  const [saving, setSaving] = useState(false)
  const [newOption, setNewOption] = useState('')
  const isEditing = !!field

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      field_type: 'text',
      description: '',
      is_required: false,
      options: [],
    },
  })

  const fieldType = form.watch('field_type')
  const options = form.watch('options') || []
  const showOptions = fieldType === 'dropdown' || fieldType === 'multi_select'

  // Reset form when modal opens/closes or field changes
  useEffect(() => {
    if (open) {
      if (field) {
        form.reset({
          name: field.name,
          field_type: field.field_type,
          description: field.description || '',
          is_required: field.is_required,
          options: field.options || [],
        })
      } else {
        form.reset({
          name: '',
          field_type: 'text',
          description: '',
          is_required: false,
          options: [],
        })
      }
      setNewOption('')
    }
  }, [open, field, form])

  const handleAddOption = () => {
    const trimmed = newOption.trim()
    if (trimmed && !options.includes(trimmed)) {
      form.setValue('options', [...options, trimmed])
      setNewOption('')
    }
  }

  const handleRemoveOption = (optionToRemove: string) => {
    form.setValue('options', options.filter((opt) => opt !== optionToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddOption()
    }
  }

  const onSubmit = async (data: FormValues) => {
    setSaving(true)
    try {
      if (isEditing && field) {
        await updateCustomField(field.id, {
          name: data.name,
          field_type: data.field_type,
          description: data.description || null,
          is_required: data.is_required,
          options: showOptions ? data.options : null,
        })
        toast.success('Custom field updated')
      } else {
        const dto = {
          name: data.name,
          field_type: data.field_type,
          description: data.description || undefined,
          is_required: data.is_required,
          options: showOptions ? data.options : undefined,
          ...(entityType === 'contact'
            ? { team_contact_type_id: typeId }
            : entityType === 'company'
              ? { team_company_type_id: typeId }
              : { team_employee_type_id: typeId }),
        }
        await createCustomField(dto)
        toast.success('Custom field created')
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      console.error('Error saving field:', err)
      toast.error(isEditing ? 'Failed to update custom field' : 'Failed to create custom field')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Custom Field' : 'Add Custom Field'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the field definition'
              : `Add a custom field to collect additional data for ${entityType}s with this type`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Field Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Property Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Type */}
            <FormField
              control={form.control}
              name="field_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Type *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CUSTOM_FIELD_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional help text for this field"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required */}
            <FormField
              control={form.control}
              name="is_required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Required field</FormLabel>
                    <FormDescription>
                      Users must fill in this field when saving
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Options (for dropdown/multi_select) */}
            {showOptions && (
              <FormField
                control={form.control}
                name="options"
                render={() => (
                  <FormItem>
                    <FormLabel>Options</FormLabel>
                    <div className="space-y-2">
                      {/* Existing options */}
                      {options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {options.map((option) => (
                            <Badge
                              key={option}
                              variant="secondary"
                              className="flex items-center gap-1 pr-1"
                            >
                              {option}
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(option)}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Add new option */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add an option..."
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleAddOption}
                          disabled={!newOption.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <FormDescription>
                      Press Enter or click + to add each option
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Add Field'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
