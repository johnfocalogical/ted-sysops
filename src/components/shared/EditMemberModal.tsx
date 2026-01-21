import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import type { PermissionLevel } from '@/types/team-member.types'

const editSchema = z.object({
  permissionLevel: z.enum(['admin', 'member', 'viewer']),
  roleId: z.string().optional(),
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
  role_id: string | null
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
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<TeamRole[]>([])

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      permissionLevel: 'member',
      roleId: 'none',
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
        roleId: member.role_id || 'none',
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

      // Update the member
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          permission_level: data.permissionLevel as PermissionLevel,
          role_id: data.roleId === 'none' ? null : (data.roleId || null),
        })
        .eq('id', member.id)

      if (updateError) {
        throw new Error(updateError.message)
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

  const memberName = member?.user.full_name || member?.user.email.split('@')[0] || 'Member'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update role and permissions for{' '}
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
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No specific role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
