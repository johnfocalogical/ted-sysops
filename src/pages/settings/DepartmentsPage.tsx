import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, Briefcase, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { ViewOnlyBanner } from '@/components/shared/ViewOnlyBanner'
import { usePermissions } from '@/hooks/usePermissions'
import { useTeamContext } from '@/hooks/useTeamContext'
import {
  getTeamDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  canDeleteDepartment,
  isDepartmentNameUnique,
} from '@/lib/departmentService'
import { toast } from 'sonner'
import type { DepartmentWithUsage } from '@/types/employee.types'

export function DepartmentsPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { isViewOnly } = usePermissions('settings')
  const { context, isAdmin } = useTeamContext()
  const settingsPath = `/org/${orgId}/team/${teamId}/settings`

  const [departments, setDepartments] = useState<DepartmentWithUsage[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingDept, setEditingDept] = useState<DepartmentWithUsage | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Delete state
  const [deletingDept, setDeletingDept] = useState<DepartmentWithUsage | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ canDelete: boolean; reason?: string } | null>(null)

  const loadDepartments = async () => {
    if (!context) return

    setLoading(true)
    try {
      const data = await getTeamDepartments(context.team.id)
      setDepartments(data)
    } catch (err) {
      console.error('Error loading departments:', err)
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [context?.team.id])

  const handleCreate = () => {
    setEditingDept(null)
    setFormName('')
    setFormDescription('')
    setShowForm(true)
  }

  const handleEdit = (dept: DepartmentWithUsage) => {
    setEditingDept(dept)
    setFormName(dept.name)
    setFormDescription(dept.description || '')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!context || !formName.trim()) return

    setFormSaving(true)
    try {
      // Check uniqueness
      const isUnique = await isDepartmentNameUnique(
        context.team.id,
        formName.trim(),
        editingDept?.id
      )
      if (!isUnique) {
        toast.error('A department with this name already exists')
        setFormSaving(false)
        return
      }

      if (editingDept) {
        await updateDepartment(editingDept.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
        })
        toast.success('Department updated')
      } else {
        await createDepartment({
          team_id: context.team.id,
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        })
        toast.success('Department created')
      }

      setShowForm(false)
      loadDepartments()
    } catch (err) {
      console.error('Error saving department:', err)
      toast.error('Failed to save department')
    } finally {
      setFormSaving(false)
    }
  }

  const handleToggleActive = async (dept: DepartmentWithUsage) => {
    try {
      await updateDepartment(dept.id, { is_active: !dept.is_active })
      toast.success(dept.is_active ? 'Department deactivated' : 'Department activated')
      loadDepartments()
    } catch (err) {
      console.error('Error toggling department:', err)
      toast.error('Failed to update department')
    }
  }

  const handleDeleteClick = async (dept: DepartmentWithUsage) => {
    const info = await canDeleteDepartment(dept.id)
    setDeleteInfo(info)
    setDeletingDept(dept)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return

    try {
      await deleteDepartment(deletingDept.id)
      toast.success('Department deleted')
      setDeletingDept(null)
      loadDepartments()
    } catch (err) {
      console.error('Error deleting department:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete department')
    }
  }

  if (!context) return null

  return (
    <div className="max-w-4xl">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={settingsPath}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="text-muted-foreground mt-1">
          Configure departments for your team's employee profiles
        </p>
      </div>

      {/* View Only Banner */}
      {isViewOnly && <ViewOnlyBanner className="mb-6" />}

      {/* Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                {departments.length} department{departments.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
          </div>
          {isAdmin() && (
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No departments configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    !dept.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dept.name}</span>
                      {!dept.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {dept.usage_count} employee{dept.usage_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {dept.description}
                      </p>
                    )}
                  </div>
                  {isAdmin() && (
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={dept.is_active}
                        onCheckedChange={() => handleToggleActive(dept)}
                        aria-label={`Toggle ${dept.name}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(dept)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(dept)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDept ? 'Edit Department' : 'Create Department'}
            </DialogTitle>
            <DialogDescription>
              {editingDept
                ? 'Update department details'
                : 'Add a new department for your team'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-description">Description (optional)</Label>
              <Textarea
                id="dept-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this department"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={formSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || formSaving}
            >
              {formSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingDept}
        onOpenChange={(open) => !open && setDeletingDept(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteInfo?.canDelete
                ? `Are you sure you want to delete "${deletingDept?.name}"? This action cannot be undone.`
                : deleteInfo?.reason || 'This department cannot be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteInfo?.canDelete && (
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
