import { useState } from 'react'
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
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTeamContext } from '@/hooks/useTeamContext'

const createTeamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
})

type CreateTeamFormData = z.infer<typeof createTeamSchema>

interface CreateTeamModalProps {
  open: boolean
  onClose: () => void
  onCreated: (orgId: string, teamId: string) => void
  orgId: string
  orgName: string
}

export function CreateTeamModal({
  open,
  onClose,
  onCreated,
  orgId,
  orgName,
}: CreateTeamModalProps) {
  const { user } = useAuth()
  const { loadAvailableTeams } = useTeamContext()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      teamName: '',
    },
  })

  const onSubmit = async (data: CreateTeamFormData) => {
    if (!supabase || !user) {
      setError('Not authenticated')
      return
    }

    setError(null)

    try {
      // Generate slug from team name
      const slug = generateSlug(data.teamName)

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          org_id: orgId,
          name: data.teamName,
          slug,
          join_link_enabled: false,
          default_role_id: null,
        })
        .select()
        .single()

      if (teamError) {
        // Check for duplicate slug constraint violation
        if (teamError.message.includes('teams_org_id_slug_key') || teamError.code === '23505') {
          throw new Error('A team with this name already exists in this organization. Please choose a different name.')
        }
        throw new Error(teamError.message)
      }

      // The database trigger auto-installs role templates
      // Now we need to add the current user as admin

      // Get the Full Access role (created by trigger)
      const { data: role, error: roleError } = await supabase
        .from('team_roles')
        .select('id')
        .eq('team_id', team.id)
        .eq('name', 'Full Access')
        .single()

      if (roleError) {
        console.error('Could not find Full Access role:', roleError)
        // Continue anyway - we'll add without a role
      }

      // Add current user as admin member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role_id: role?.id || null,
          permission_level: 'admin',
        })

      if (memberError) {
        throw new Error(`Team created but could not add you as member: ${memberError.message}`)
      }

      // Refresh available teams
      await loadAvailableTeams(user.id)

      // Reset form and notify parent
      form.reset()
      onCreated(orgId, team.id)
    } catch (err) {
      console.error('Error creating team:', err)
      setError(err instanceof Error ? err.message : 'Failed to create team')
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
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team in <span className="font-medium text-foreground">{orgName}</span>
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
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Austin Office"
                      {...field}
                    />
                  </FormControl>
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
                    Creating...
                  </>
                ) : (
                  'Create Team'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
