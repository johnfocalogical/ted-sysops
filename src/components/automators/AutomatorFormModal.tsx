import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useAuth } from '@/hooks/useAuth'
import {
  createAutomator,
  updateAutomator,
  isAutomatorNameUnique,
} from '@/lib/automatorService'
import { toast } from 'sonner'
import type { AutomatorWithCreator } from '@/types/automator.types'

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AutomatorFormModalProps {
  open: boolean
  automator?: AutomatorWithCreator | null
  onClose: () => void
  onCreated?: (automatorId: string) => void
  onSaved?: () => void
}

export function AutomatorFormModal({
  open,
  automator,
  onClose,
  onCreated,
  onSaved,
}: AutomatorFormModalProps) {
  const { context } = useTeamContext()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const isEditing = !!automator

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Reset form when modal opens/closes or automator changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: automator?.name || '',
        description: automator?.description || '',
      })
    }
  }, [open, automator, form])

  const onSubmit = async (values: FormValues) => {
    if (!context || !user) return

    setSaving(true)
    try {
      // Check name uniqueness
      const isUnique = await isAutomatorNameUnique(
        context.team.id,
        values.name,
        automator?.id
      )
      if (!isUnique) {
        form.setError('name', {
          type: 'manual',
          message: 'An automator with this name already exists',
        })
        setSaving(false)
        return
      }

      if (isEditing && automator) {
        // Update existing automator
        await updateAutomator(
          automator.id,
          {
            name: values.name,
            description: values.description || undefined,
          },
          user.id
        )
        toast.success('Automator updated')
        onSaved?.()
      } else {
        // Create new automator
        const created = await createAutomator(
          {
            team_id: context.team.id,
            name: values.name,
            description: values.description || undefined,
          },
          user.id
        )
        toast.success('Automator created')
        onCreated?.(created.id)
      }
      onClose()
    } catch (err) {
      console.error('Error saving automator:', err)
      toast.error('Failed to save automator')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Automator' : 'Create Automator'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the automator name and description.'
              : 'Create a new workflow automator for your team.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lead Follow-up" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this automator does..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
