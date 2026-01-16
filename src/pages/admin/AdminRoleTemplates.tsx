import { useState, useEffect } from 'react'
import { Plus, Loader2, Shield, Lock, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getRoleTemplates,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
  type RoleTemplateWithUsage,
} from '@/lib/adminService'
import type { RolePermissions, SectionKey, SectionPermission } from '@/types/role.types'
import { toast } from 'sonner'

const PERMISSION_SECTIONS: { key: SectionKey; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Main dashboard view' },
  { key: 'pay_time', label: 'Pay Time', description: 'Payment tracking' },
  { key: 'team', label: 'Team', description: 'Team management' },
  { key: 'whiteboard', label: 'Whiteboard', description: 'Deal pipeline board' },
  { key: 'contacts', label: 'Contacts', description: 'Contact management' },
  { key: 'employees', label: 'Employees', description: 'Employee management' },
  { key: 'transactions', label: 'Transactions', description: 'Financial transactions' },
  { key: 'calendar', label: 'Calendar', description: 'Calendar and scheduling' },
  { key: 'reports', label: 'Reports', description: 'Reports and analytics' },
  { key: 'settings', label: 'Settings', description: 'Team settings' },
]

const DEFAULT_PERMISSIONS: RolePermissions = {}

export function AdminRoleTemplates() {
  const [templates, setTemplates] = useState<RoleTemplateWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplateWithUsage | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAutoInstall, setFormAutoInstall] = useState(false)
  const [formPermissions, setFormPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getRoleTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Error loading templates:', err)
      toast.error('Failed to load role templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const openCreateDialog = () => {
    setSelectedTemplate(null)
    setFormName('')
    setFormDescription('')
    setFormAutoInstall(false)
    setFormPermissions(DEFAULT_PERMISSIONS)
    setEditDialogOpen(true)
  }

  const openEditDialog = (template: RoleTemplateWithUsage) => {
    setSelectedTemplate(template)
    setFormName(template.name)
    setFormDescription(template.description || '')
    setFormAutoInstall(template.auto_install)
    setFormPermissions(template.permissions as RolePermissions)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (template: RoleTemplateWithUsage) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      if (selectedTemplate) {
        await updateRoleTemplate(selectedTemplate.id, {
          name: formName,
          description: formDescription || undefined,
          permissions: formPermissions,
          auto_install: formAutoInstall,
        })
        toast.success('Role template updated')
      } else {
        await createRoleTemplate({
          name: formName,
          description: formDescription || undefined,
          permissions: formPermissions,
          auto_install: formAutoInstall,
        })
        toast.success('Role template created')
      }
      setEditDialogOpen(false)
      loadTemplates()
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error('Failed to save role template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      await deleteRoleTemplate(selectedTemplate.id)
      toast.success('Role template deleted')
      setDeleteDialogOpen(false)
      loadTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      toast.error('Failed to delete role template')
    } finally {
      setSaving(false)
    }
  }

  const getPermissionAccess = (sectionKey: SectionKey): SectionPermission['access'] | 'none' => {
    const permission = formPermissions[sectionKey]
    return permission?.access || 'none'
  }

  const setPermissionAccess = (sectionKey: SectionKey, access: 'none' | 'view' | 'full') => {
    setFormPermissions((prev) => {
      if (access === 'none') {
        const updated = { ...prev }
        delete updated[sectionKey]
        return updated
      }
      return {
        ...prev,
        [sectionKey]: { access },
      }
    })
  }

  const togglePermission = (sectionKey: SectionKey, level: 'view' | 'full') => {
    const current = getPermissionAccess(sectionKey)
    if (level === 'view') {
      // Toggle view: none -> view, view -> none, full -> view
      setPermissionAccess(sectionKey, current === 'view' ? 'none' : 'view')
    } else {
      // Toggle full: none/view -> full, full -> none
      setPermissionAccess(sectionKey, current === 'full' ? 'none' : 'full')
    }
  }

  const getPermissionDisplay = (permissions: RolePermissions) => {
    const entries = Object.entries(permissions)
    const fullCount = entries.filter(([, p]) => p?.access === 'full').length
    const viewCount = entries.filter(([, p]) => p?.access === 'view').length
    if (fullCount === PERMISSION_SECTIONS.length) return 'Full Access'
    if (fullCount + viewCount === 0) return 'No Access'
    return `${fullCount} full, ${viewCount} view`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Templates</h1>
          <p className="text-muted-foreground">
            Manage global role templates that teams can use
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            All Templates
          </CardTitle>
          <CardDescription>
            System templates cannot be modified. Custom templates can be edited or deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Auto Install</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{template.name}</div>
                        {template.is_system && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            System
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getPermissionDisplay(template.permissions as RolePermissions)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {template.auto_install ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {template._count?.teams || 0} teams
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!template.is_system && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(template)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No role templates found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Role Template' : 'Create Role Template'}
            </DialogTitle>
            <DialogDescription>
              Configure the role template settings and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Sales Associate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what this role is for..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-install">Auto Install</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically add to new teams
                </p>
              </div>
              <Switch
                id="auto-install"
                checked={formAutoInstall}
                onCheckedChange={setFormAutoInstall}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {PERMISSION_SECTIONS.map((section) => {
                  const access = getPermissionAccess(section.key)
                  return (
                    <div
                      key={section.key}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={access === 'view' || access === 'full'}
                            onCheckedChange={() => togglePermission(section.key, 'view')}
                          />
                          View
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={access === 'full'}
                            onCheckedChange={() => togglePermission(section.key, 'full')}
                          />
                          Full
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action
              cannot be undone. Teams using this template will not be affected, but
              they won't be able to sync with this template anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
