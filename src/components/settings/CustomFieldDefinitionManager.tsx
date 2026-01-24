import { useState, useEffect } from 'react'
import { Loader2, Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { TypeBadge } from '@/components/shared/TypeBadge'
import { CustomFieldDefinitionFormModal } from './CustomFieldDefinitionFormModal'
import {
  getCustomFieldsForContactType,
  getCustomFieldsForCompanyType,
  deleteCustomField,
} from '@/lib/teamTypeService'
import type {
  TeamContactTypeWithUsage,
  TeamCompanyTypeWithUsage,
  CustomFieldDefinition,
} from '@/types/type-system.types'
import { CUSTOM_FIELD_TYPE_LABELS } from '@/types/type-system.types'
import { toast } from 'sonner'

interface CustomFieldDefinitionManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: TeamContactTypeWithUsage | TeamCompanyTypeWithUsage | null
  entityType: 'contact' | 'company'
  onFieldsChanged?: () => void
}

export function CustomFieldDefinitionManager({
  open,
  onOpenChange,
  type,
  entityType,
  onFieldsChanged,
}: CustomFieldDefinitionManagerProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingField, setDeletingField] = useState<CustomFieldDefinition | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load fields when drawer opens or type changes
  useEffect(() => {
    if (open && type) {
      loadFields()
    }
  }, [open, type?.id])

  const loadFields = async () => {
    if (!type) return

    setLoading(true)
    try {
      const fieldsData = entityType === 'contact'
        ? await getCustomFieldsForContactType(type.id)
        : await getCustomFieldsForCompanyType(type.id)
      setFields(fieldsData)
    } catch (err) {
      console.error('Error loading fields:', err)
      toast.error('Failed to load custom fields')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteField = async () => {
    if (!deletingField) return

    setDeleting(true)
    try {
      await deleteCustomField(deletingField.id)
      toast.success('Custom field deleted')
      setDeleteDialogOpen(false)
      setDeletingField(null)
      loadFields()
      onFieldsChanged?.()
    } catch (err) {
      console.error('Error deleting field:', err)
      toast.error('Failed to delete custom field')
    } finally {
      setDeleting(false)
    }
  }

  const handleFieldSaved = () => {
    loadFields()
    onFieldsChanged?.()
  }

  const openDeleteDialog = (field: CustomFieldDefinition) => {
    setDeletingField(field)
    setDeleteDialogOpen(true)
  }

  const handleClose = () => {
    onOpenChange(false)
    setEditingField(null)
    setShowAddModal(false)
  }

  if (!type) return null

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-md flex flex-col overflow-hidden">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-3">
              <TypeBadge
                name={type.name}
                icon={type.icon}
                color={type.color}
              />
              <span>Custom Fields</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 flex flex-col mt-4">
            {/* Add Field Button */}
            <Button
              onClick={() => setShowAddModal(true)}
              className="w-full shrink-0 mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>

            {/* Fields List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No custom fields defined</p>
                  <p className="text-sm mt-1">
                    Add fields to collect additional data for {entityType}s with this type
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{field.name}</span>
                            {field.is_required && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {CUSTOM_FIELD_TYPE_LABELS[field.field_type]}
                            {field.options && field.options.length > 0 && (
                              <span> ({field.options.length} options)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingField(field)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(field)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Modal */}
      <CustomFieldDefinitionFormModal
        open={showAddModal || !!editingField}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false)
            setEditingField(null)
          }
        }}
        typeId={type.id}
        entityType={entityType}
        field={editingField}
        onSaved={handleFieldSaved}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingField?.name}"?
              This will remove all saved values for this field from existing {entityType}s.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
