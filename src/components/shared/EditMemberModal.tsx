import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { supabase } from '@/lib/supabase'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useAuth } from '@/hooks/useAuth'
import { logRoleChange } from '@/lib/employeeActivityHelpers'
import type { PermissionLevel } from '@/types/team-member.types'

const editSchema = z.object({
  permissionLevel: z.enum(['admin', 'member', 'viewer']),
  roleIds: z.array(z.string()).optional(),
})

type EditFormData = z.infer<typeof editSchema>

interface TeamRole {
  id: string
  name: string
  description: string | null
}

interface MemberToEdit {
  id: string
  permission_level: PermissionLevel
  role_ids: string[]  // Changed from role_id
  user: {
    full_name: string | null
    email: string
  }
}

interface EditMemberModalProps {
  open: boolean
  member: MemberToEdit | null
  onClose: () => void
  onUpdated: () => void
}

export function EditMemberModal({
  open,
  member,
  onClose,
  onUpdated,
}: EditMemberModalProps) {
  const { context } = useTeamContext()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<TeamRole[]>([])

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      permissionLevel: 'member',
      roleIds: [],
    },
  })

  // Load team roles and set initial values when modal opens
  useEffect(() => {
    const loadRoles = async () => {
      if (!supabase || !context) return

      const { data, error } = await supabase
        .from('team_roles')
        .select('id, name, description')
        .eq('team_id', context.team.id)
        .order('name')

      if (!error && data) {
        setRoles(data)
      }
    }

    if (open && member) {
      loadRoles()
      form.reset({
        permissionLevel: member.permission_level,
        roleIds: member.role_ids || [],
      })
    }
  }, [open, member, context])

  const onSubmit = async (data: EditFormData) => {
    if (!supabase || !context || !member) {
      setError('Not authenticated')
      return
    }

    setError(null)

    try {
      // Check if demoting the last admin
      if (member.permission_level === 'admin' && data.permissionLevel !== 'admin') {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', context.team.id)
          .eq('permission_level', 'admin')

        if (count && count <= 1) {
          setError('Cannot demote the last admin. Promote another member first.')
          return
        }
      }

      // Update the member's permission level
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          permission_level: data.permissionLevel as PermissionLevel,
        })
        .eq('id', member.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update role assignments: delete old, insert new
      // First, delete existing role assignments
      const { error: deleteError } = await supabase
        .from('team_member_roles')
        .delete()
        .eq('team_member_id', member.id)

      if (deleteError) {
        console.error('Error deleting old roles:', deleteError)
      }

      // Insert new role assignments
      const selectedRoleIds = data.roleIds || []
      if (selectedRoleIds.length > 0) {
        const roleAssignments = selectedRoleIds.map((roleId) => ({
          team_member_id: member.id,
          role_id: roleId,
        }))

        const { error: insertError } = await supabase
          .from('team_member_roles')
          .insert(roleAssignments)

        if (insertError) {
          console.error('Error assigning new roles:', insertError)
        }
      }

      // Log role/permission changes to activity
      if (user && supabase && context) {
        try {
          // Look up employee_profile_id from team_member_id
          const { data: epData } = await supabase
            .from('employee_profiles')
            .select('id')
            .eq('team_member_id', member.id)
            .single()

          if (epData) {
            const beforeRoleNames = roles
              .filter((r) => (member.role_ids || []).includes(r.id))
              .map((r) => r.name)
            const afterRoleNames = roles
              .filter((r) => (data.roleIds || []).includes(r.id))
              .map((r) => r.name)

            await logRoleChange({
              teamId: context.team.id,
              employeeProfileId: epData.id,
              userId: user.id,
              beforeRoles: beforeRoleNames,
              afterRoles: afterRoleNames,
              beforePermissionLevel: member.permission_level,
              afterPermissionLevel: data.permissionLevel,
            })
          }
        } catch (logErr) {
          console.error('Error logging role change:', logErr)
        }
      }

      // Success
      onUpdated()
    } catch (err) {
      console.error('Error updating member:', err)
      setError(err instanceof Error ? err.message : 'Failed to update member')
    }
  }

  const handleClose = () => {
    form.reset()
    setError(null)
    onClose()
  }

  // Toggle a role in the selection
  const toggleRole = (roleId: string) => {
    const current = form.getValues('roleIds') || []
    if (current.includes(roleId)) {
      form.setValue('roleIds', current.filter((id) => id !== roleId))
    } else {
      form.setValue('roleIds', [...current, roleId])
    }
  }

  const memberName = member?.user.full_name || member?.user.email.split('@')[0] || 'Member'
  const selectedRoleIds = form.watch('roleIds') || []

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update roles and permissions for{' '}
            <span className="font-medium text-foreground">{memberName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="permissionLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select permission level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full management access</SelectItem>
                      <SelectItem value="member">Member - Standard access</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No roles defined for this team</p>
                    ) : (
                      roles.map((role) => (
                        <div key={role.id} className="flex items-start gap-2">
                          <Checkbox
                            id={`edit-role-${role.id}`}
                            checked={selectedRoleIds.includes(role.id)}
                            onCheckedChange={() => toggleRole(role.id)}
                          />
                          <div className="grid gap-0.5 leading-none">
                            <label
                              htmlFor={`edit-role-${role.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {role.name}
                            </label>
                            {role.description && (
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
