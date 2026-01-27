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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ContactMethodsInput } from '@/components/shared/ContactMethodsInput'
import { TypeBadge } from '@/components/shared/TypeBadge'
import type { EmployeeWithDetails, Department } from '@/types/employee.types'
import type { TeamEmployeeType } from '@/types/type-system.types'
import type { ContactMethodInput } from '@/types/contact.types'

const employeeProfileSchema = z.object({
  job_title: z.string().optional(),
  department_id: z.string().optional(),
  hire_date: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  employee_notes: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  contact_methods: z.array(
    z.object({
      method_type: z.enum(['phone', 'email', 'fax', 'other']),
      label: z.string(),
      value: z.string().min(1, 'Value is required'),
      is_primary: z.boolean(),
    })
  ).optional(),
  type_ids: z.array(z.string()).optional(),
})

type EmployeeProfileFormData = z.infer<typeof employeeProfileSchema>

interface EmployeeProfileFormProps {
  employee: EmployeeWithDetails
  departments: Department[]
  employeeTypes?: TeamEmployeeType[]
  assignedTypeIds?: string[]
  onSubmit: (data: EmployeeProfileFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function EmployeeProfileForm({
  employee,
  departments,
  employeeTypes = [],
  assignedTypeIds = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EmployeeProfileFormProps) {
  const form = useForm<EmployeeProfileFormData>({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: {
      job_title: employee.job_title || '',
      department_id: employee.department_id || '',
      hire_date: employee.hire_date || '',
      status: employee.status,
      employee_notes: employee.employee_notes || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      emergency_contact_relationship: employee.emergency_contact_relationship || '',
      contact_methods: employee.contact_methods.map((m) => ({
        method_type: m.method_type,
        label: m.label || '',
        value: m.value,
        is_primary: m.is_primary,
      })),
      type_ids: assignedTypeIds,
    },
  })

  const handleSubmit = async (data: EmployeeProfileFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Job Info Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Job Information
          </h4>

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Acquisitions Manager" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hire_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hire Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Employee Types */}
        {employeeTypes.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Employee Types
            </h4>
            <FormField
              control={form.control}
              name="type_ids"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {employeeTypes.map((type) => {
                      const isChecked = (field.value || []).includes(type.id)
                      return (
                        <div key={type.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const current = field.value || []
                              if (checked) {
                                field.onChange([...current, type.id])
                              } else {
                                field.onChange(current.filter((id: string) => id !== type.id))
                              }
                            }}
                          />
                          <TypeBadge
                            name={type.name}
                            icon={type.icon}
                            color={type.color}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Contact Methods */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Contact Methods
          </h4>
          <FormField
            control={form.control}
            name="contact_methods"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ContactMethodsInput
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Notes
          </h4>
          <FormField
            control={form.control}
            name="employee_notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Internal notes about this employee..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Emergency Contact Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Emergency Contact
          </h4>

          <FormField
            control={form.control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Emergency contact name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Emergency contact phone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Spouse, Parent, Sibling" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </Form>
  )
}
