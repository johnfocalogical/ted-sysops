import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { PermissionLevel } from '@/types/team-member.types'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  permissionLevel: z.enum(['admin', 'member', 'viewer']),
  roleId: z.string().optional(),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface TeamRole {
  id: string
  name: string
  description: string | null
  is_default: boolean
}

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

export function InviteMemberModal({
  open,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const { context } = useTeamContext()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<TeamRole[]>([])

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      permissionLevel: 'member',
      roleId: '',
    },
  })

  // Load team roles
  useEffect(() => {
    const loadRoles = async () => {
      if (!supabase || !context) return

      const { data, error } = await supabase
        .from('team_roles')
        .select('id, name, description, is_default')
        .eq('team_id', context.team.id)
        .order('name')

      if (!error && data) {
        setRoles(data)
        // Set default role if there is one
        const defaultRole = data.find((r) => r.is_default)
        if (defaultRole) {
          form.setValue('roleId', defaultRole.id)
        }
      }
    }

    if (open) {
      loadRoles()
    }
  }, [open, context])

  const onSubmit = async (data: InviteFormData) => {
    if (!supabase || !user || !context) {
      setError('Not authenticated')
      return
    }

    setError(null)

    try {
      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', context.team.id)
        .eq('user_id', (
          await supabase
            .from('users')
            .select('id')
            .eq('email', data.email)
            .single()
        ).data?.id || '')
        .single()

      if (existingMember) {
        setError('This user is already a member of this team')
        return
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', context.team.id)
        .eq('email', data.email.toLowerCase())
        .eq('status', 'pending')
        .single()

      if (existingInvitation) {
        setError('There is already a pending invitation for this email')
        return
      }

      // Create the invitation
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          team_id: context.team.id,
          email: data.email.toLowerCase(),
          permission_level: data.permissionLevel as PermissionLevel,
          role_id: data.roleId || null,
          invited_by: user.id,
          status: 'pending',
        })

      if (inviteError) {
        throw new Error(inviteError.message)
      }

      // Success
      form.reset()
      onInvited()
    } catch (err) {
      console.error('Error inviting member:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    }
  }

  const handleClose = () => {
    form.reset()
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join{' '}
            <span className="font-medium text-foreground">{context?.team.name}</span>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissionLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                  <FormLabel>Role (Optional)</FormLabel>
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
                      <SelectItem value="">No specific role</SelectItem>
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
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
