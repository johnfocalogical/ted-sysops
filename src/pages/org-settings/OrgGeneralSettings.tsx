import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOrgContext } from '@/hooks/useOrgContext'
import { updateOrganization, deleteOrganization } from '@/lib/orgService'
import { useNavigate } from 'react-router-dom'

const nameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

type NameFormData = z.infer<typeof nameSchema>

export function OrgGeneralSettings() {
  const navigate = useNavigate()
  const { organization, loadOrg } = useOrgContext()
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const form = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: organization?.name || '',
    },
  })

  const onSubmit = async (data: NameFormData) => {
    if (!organization) return

    setSaving(true)
    try {
      await updateOrganization(organization.id, { name: data.name })
      // Reload org context to reflect changes
      await loadOrg(organization.id, organization.owner_id)
      toast.success('Organization name updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!organization || deleteConfirmation !== organization.name) return

    setDeleting(true)
    try {
      await deleteOrganization(organization.id)
      toast.success('Organization deleted')
      navigate('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization')
      setDeleting(false)
    }
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const createdDate = new Date(organization.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-2xl space-y-6">
      {/* Organization Name */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Name</CardTitle>
          <CardDescription>
            Update your organization's display name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Slug</label>
            <p className="mt-1 text-sm">{organization.slug}</p>
            <p className="text-xs text-muted-foreground mt-1">
              The slug cannot be changed after creation
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <p className="mt-1 text-sm">{createdDate}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created By</label>
            <p className="mt-1 text-sm">
              {organization.owner?.full_name || organization.owner?.email || 'Unknown'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{organization.owner_count}</p>
              <p className="text-xs text-muted-foreground">Owners</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{organization.member_count}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{organization.team_count}</p>
              <p className="text-xs text-muted-foreground">Teams</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its teams, members, and data.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete...
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the organization
              "{organization.name}" and all its:
            </DialogDescription>
          </DialogHeader>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 my-4">
            <li>{organization.team_count} team(s)</li>
            <li>{organization.member_count} member(s)</li>
            <li>All deals, contacts, and data</li>
            <li>All roles and permissions</li>
          </ul>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type "{organization.name}" to confirm:
            </label>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={organization.name}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setDeleteConfirmation('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== organization.name || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
