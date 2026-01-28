import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PermissionMatrix,
  toRolePermissions,
  fromRolePermissions,
  getDefaultPermissionState,
} from './PermissionMatrix'
import { createRole, updateRole, isRoleNameUnique } from '@/lib/roleService'
import { getActiveDepartments } from '@/lib/departmentService'
import { useTeamContext } from '@/hooks/useTeamContext'
import { toast } from 'sonner'
import type { TeamRole, SectionKey } from '@/types/role.types'
import type { Department } from '@/types/employee.types'

type AccessValue = 'none' | 'view' | 'full'

interface RoleFormModalProps {
  open: boolean
  role: TeamRole | null // null = create mode, set = edit mode
  onClose: () => void
  onSaved: (role: TeamRole) => void
}

export function RoleFormModal({ open, role, onClose, onSaved }: RoleFormModalProps) {
  const { context } = useTeamContext()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [permissions, setPermissions] = useState<Record<SectionKey, AccessValue>>(
    getDefaultPermissionState()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!role

  // Load departments
  useEffect(() => {
    if (open && context) {
      getActiveDepartments(context.team.id)
        .then(setDepartments)
        .catch((err) => console.error('Error loading departments:', err))
    }
  }, [open, context])

  // Reset form when modal opens/closes or role changes
  useEffect(() => {
    if (open) {
      if (role) {
        // Edit mode - populate from existing role
        setName(role.name)
        setDescription(role.description || '')
        setDepartmentId(role.department_id || '')
        setPermissions(fromRolePermissions(role.permissions))
      } else {
        // Create mode - reset to defaults
        setName('')
        setDescription('')
        setDepartmentId('')
        setPermissions(getDefaultPermissionState())
      }
      setError(null)
    }
  }, [open, role])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!context) return

    // Validate name
    if (!name.trim()) {
      setError('Role name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if name is unique
      const isUnique = await isRoleNameUnique(
        context.team.id,
        name.trim(),
        role?.id // Exclude current role in edit mode
      )

      if (!isUnique) {
        setError('A role with this name already exists')
        setLoading(false)
        return
      }

      // Validate department selection
      if (!departmentId) {
        setError('Department is required')
        setLoading(false)
        return
      }

      // Convert permissions state to JSONB format
      const permissionsJson = toRolePermissions(permissions)

      let savedRole: TeamRole

      if (isEditing && role) {
        // Update existing role
        savedRole = await updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: permissionsJson,
          department_id: departmentId || null,
        })
        toast.success('Role updated successfully')
      } else {
        // Create new role
        savedRole = await createRole({
          team_id: context.team.id,
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: permissionsJson,
          department_id: departmentId || undefined,
        })
        toast.success('Role created successfully')
      }

      onSaved(savedRole)
    } catch (err) {
      console.error('Error saving role:', err)
      setError('Failed to save role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the role name, description, and permissions.'
                : 'Create a new custom role with specific section permissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Marketing Assistant"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role's responsibilities"
                disabled={loading}
                rows={2}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-2">
              <Label>Section Permissions</Label>
              <PermissionMatrix
                value={permissions}
                onChange={setPermissions}
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
