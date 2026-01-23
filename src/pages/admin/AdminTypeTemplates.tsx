import { useState, useEffect } from 'react'
import { Plus, Loader2, Lock, Pencil, Trash2, Users, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { IconPicker } from '@/components/shared/IconPicker'
import { ColorPicker } from '@/components/shared/ColorPicker'
import { TypeBadge } from '@/components/shared/TypeBadge'
import {
  getContactTypeTemplates,
  createContactTypeTemplate,
  updateContactTypeTemplate,
  deleteContactTypeTemplate,
  getCompanyTypeTemplates,
  createCompanyTypeTemplate,
  updateCompanyTypeTemplate,
  deleteCompanyTypeTemplate,
} from '@/lib/typeTemplateService'
import type {
  ContactTypeTemplateWithUsage,
  CompanyTypeTemplateWithUsage,
} from '@/types/type-system.types'
import { toast } from 'sonner'

type TabValue = 'contact' | 'company'

export function AdminTypeTemplates() {
  const [activeTab, setActiveTab] = useState<TabValue>('contact')
  const [contactTemplates, setContactTemplates] = useState<ContactTypeTemplateWithUsage[]>([])
  const [companyTemplates, setCompanyTemplates] = useState<CompanyTypeTemplateWithUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<
    ContactTypeTemplateWithUsage | CompanyTypeTemplateWithUsage | null
  >(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIcon, setFormIcon] = useState('User')
  const [formColor, setFormColor] = useState('gray')
  const [formAutoInstall, setFormAutoInstall] = useState(true)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const [contactData, companyData] = await Promise.all([
        getContactTypeTemplates(),
        getCompanyTypeTemplates(),
      ])
      setContactTemplates(contactData)
      setCompanyTemplates(companyData)
    } catch (err) {
      console.error('Error loading templates:', err)
      toast.error('Failed to load type templates')
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
    setFormIcon(activeTab === 'contact' ? 'User' : 'Building2')
    setFormColor('gray')
    setFormAutoInstall(true)
    setEditDialogOpen(true)
  }

  const openEditDialog = (
    template: ContactTypeTemplateWithUsage | CompanyTypeTemplateWithUsage
  ) => {
    setSelectedTemplate(template)
    setFormName(template.name)
    setFormDescription(template.description || '')
    setFormIcon(template.icon)
    setFormColor(template.color)
    setFormAutoInstall(template.auto_install)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (
    template: ContactTypeTemplateWithUsage | CompanyTypeTemplateWithUsage
  ) => {
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
      const dto = {
        name: formName,
        description: formDescription || undefined,
        icon: formIcon,
        color: formColor,
        auto_install: formAutoInstall,
      }

      if (selectedTemplate) {
        // Update
        if (activeTab === 'contact') {
          await updateContactTypeTemplate(selectedTemplate.id, dto)
        } else {
          await updateCompanyTypeTemplate(selectedTemplate.id, dto)
        }
        toast.success('Type template updated')
      } else {
        // Create
        if (activeTab === 'contact') {
          await createContactTypeTemplate(dto)
        } else {
          await createCompanyTypeTemplate(dto)
        }
        toast.success('Type template created')
      }
      setEditDialogOpen(false)
      loadTemplates()
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save type template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return

    setSaving(true)
    try {
      if (activeTab === 'contact') {
        await deleteContactTypeTemplate(selectedTemplate.id)
      } else {
        await deleteCompanyTypeTemplate(selectedTemplate.id)
      }
      toast.success('Type template deleted')
      setDeleteDialogOpen(false)
      loadTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete type template')
    } finally {
      setSaving(false)
    }
  }

  const renderTemplateTable = (
    templates: (ContactTypeTemplateWithUsage | CompanyTypeTemplateWithUsage)[]
  ) => {
    if (templates.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">
          No {activeTab} type templates found
        </p>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
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
                  <TypeBadge
                    name={template.name}
                    icon={template.icon}
                    color={template.color}
                  />
                  {template.is_system && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      System
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {template.description || '-'}
                </span>
              </TableCell>
              <TableCell>
                {template.auto_install ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                  >
                    Yes
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {template.usage_count} teams
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
    )
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
          <h1 className="text-3xl font-bold">Type Templates</h1>
          <p className="text-muted-foreground">
            Manage contact and company type templates for teams
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="contact" className="gap-2">
            <Tag className="h-4 w-4" />
            Contact Types
            <Badge variant="secondary" className="ml-1">
              {contactTemplates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Tag className="h-4 w-4" />
            Company Types
            <Badge variant="secondary" className="ml-1">
              {companyTemplates.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Type Templates</CardTitle>
              <CardDescription>
                Templates for categorizing contacts (people). System templates cannot be
                modified.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTemplateTable(contactTemplates)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Type Templates</CardTitle>
              <CardDescription>
                Templates for categorizing companies (organizations). System templates
                cannot be modified.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTemplateTable(companyTemplates)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate
                ? `Edit ${activeTab === 'contact' ? 'Contact' : 'Company'} Type Template`
                : `Create ${activeTab === 'contact' ? 'Contact' : 'Company'} Type Template`}
            </DialogTitle>
            <DialogDescription>
              Configure the type template. Changes do not affect existing team types.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <TypeBadge name={formName || 'Preview'} icon={formIcon} color={formColor} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={
                  activeTab === 'contact' ? 'e.g., Investor, Agent' : 'e.g., Title Company'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe when to use this type..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker value={formIcon} onChange={setFormIcon} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorPicker value={formColor} onChange={setFormColor} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
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
            <AlertDialogTitle>Delete Type Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action
              cannot be undone. Teams with this type will keep their copy, but new teams
              won't receive it.
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
