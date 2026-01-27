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
import { IconPicker } from '@/components/shared/IconPicker'
import { ColorPicker } from '@/components/shared/ColorPicker'
import { TypeBadge } from '@/components/shared/TypeBadge'
import {
  updateTeamContactType,
  updateTeamCompanyType,
  updateTeamEmployeeType,
} from '@/lib/teamTypeService'
import type {
  TeamContactTypeWithUsage,
  TeamCompanyTypeWithUsage,
  TeamEmployeeTypeWithUsage,
} from '@/types/type-system.types'
import { toast } from 'sonner'

interface TypeFormModalProps {
  open: boolean
  type: TeamContactTypeWithUsage | TeamCompanyTypeWithUsage | TeamEmployeeTypeWithUsage | null
  entityType: 'contact' | 'company' | 'employee'
  onClose: () => void
  onSaved: () => void
}

export function TypeFormModal({
  open,
  type,
  entityType,
  onClose,
  onSaved,
}: TypeFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('User')
  const [color, setColor] = useState('gray')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (type) {
      setName(type.name)
      setDescription(type.description || '')
      setIcon(type.icon)
      setColor(type.color)
    }
  }, [type])

  const handleSave = async () => {
    if (!type) return

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      const dto = {
        name,
        description: description || null,
        icon,
        color,
      }

      if (entityType === 'contact') {
        await updateTeamContactType(type.id, dto)
      } else if (entityType === 'company') {
        await updateTeamCompanyType(type.id, dto)
      } else {
        await updateTeamEmployeeType(type.id, dto)
      }

      toast.success('Type updated')
      onSaved()
    } catch (err) {
      console.error('Error saving type:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save type')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {entityType === 'contact' ? 'Contact' : entityType === 'company' ? 'Company' : 'Employee'} Type
          </DialogTitle>
          <DialogDescription>
            Update the type details. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
            <TypeBadge name={name || 'Preview'} icon={icon} color={color} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                entityType === 'contact'
                  ? 'e.g., Investor, Agent'
                  : 'e.g., Title Company'
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this type..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
