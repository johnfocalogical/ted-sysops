import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { PermissionLevel } from '@/types/team-member.types'

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  permissionLevel: z.enum(['admin', 'member', 'viewer']),
  roleIds: z.array(z.string()).optional(),
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
  const [createdInvitationId, setCreatedInvitationId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteUrl = createdInvitationId
    ? `${window.location.origin}/invite/${createdInvitationId}`
    : ''

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      permissionLevel: 'member',
      roleIds: [],
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
          form.setValue('roleIds', [defaultRole.id])
        }
      }
    }

    if (open && !createdInvitationId) {
      loadRoles()
    }
  }, [open, context, createdInvitationId])

  const onSubmit = async (data: InviteFormData) => {
    if (!supabase || !user || !context) {
      setError('Not authenticated')
      return
    }

    setError(null)

    try {
      // Check if there's already a pending invitation for this email
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

      // Create the invitation (without role_id - using junction table)
      const { data: newInvitation, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          team_id: context.team.id,
          email: data.email.toLowerCase(),
          permission_level: data.permissionLevel as PermissionLevel,
          invited_by: user.id,
          status: 'pending',
        })
        .select('id')
        .single()

      if (inviteError) {
        throw new Error(inviteError.message)
      }

      // Insert role assignments to junction table
      const selectedRoleIds = data.roleIds || []
      if (selectedRoleIds.length > 0) {
        const roleAssignments = selectedRoleIds.map((roleId) => ({
          invitation_id: newInvitation.id,
          role_id: roleId,
        }))

        const { error: rolesError } = await supabase
          .from('team_invitation_roles')
          .insert(roleAssignments)

        if (rolesError) {
          console.error('Error assigning roles to invitation:', rolesError)
          // Don't throw - invitation was created, roles are optional
        }
      }

      // Success - show the invite link
      setCreatedInvitationId(newInvitation.id)
      onInvited()
    } catch (err) {
      console.error('Error inviting member:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    form.reset()
    setError(null)
    setCreatedInvitationId(null)
    setCopied(false)
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

  // Success state - show copyable link
  if (createdInvitationId) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation Sent!</DialogTitle>
            <DialogDescription>
              Share this link with the invitee to join{' '}
              <span className="font-medium text-foreground">{context?.team.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
                  {inviteUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This link expires in 7 days. The invitee will be able to create an account
              or sign in with the invited email address.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const selectedRoleIds = form.watch('roleIds') || []

  // Form state
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
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormLabel>Roles (Optional)</FormLabel>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No roles defined for this team</p>
                    ) : (
                      roles.map((role) => (
                        <div key={role.id} className="flex items-start gap-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={selectedRoleIds.includes(role.id)}
                            onCheckedChange={() => toggleRole(role.id)}
                          />
                          <div className="grid gap-0.5 leading-none">
                            <label
                              htmlFor={`role-${role.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {role.name}
                              {role.is_default && (
                                <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                              )}
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
