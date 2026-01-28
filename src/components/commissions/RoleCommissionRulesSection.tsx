import { useState, useEffect } from 'react'
import { DollarSign, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { RoleCommissionRuleCard } from './RoleCommissionRuleCard'
import { RoleCommissionRuleFormModal } from './RoleCommissionRuleFormModal'
import {
  getRoleCommissionRules,
  updateRoleCommissionRule,
  deleteRoleCommissionRule,
} from '@/lib/roleCommissionRuleService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { RoleCommissionRuleWithCreator } from '@/types/roleCommission.types'

interface RoleCommissionRulesSectionProps {
  roleId: string
  teamId: string
  isAdmin: boolean
}

export function RoleCommissionRulesSection({
  roleId,
  teamId,
  isAdmin,
}: RoleCommissionRulesSectionProps) {
  const { user } = useAuth()

  const [rules, setRules] = useState<RoleCommissionRuleWithCreator[]>([])
  const [loading, setLoading] = useState(true)

  // Form modal state
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<RoleCommissionRuleWithCreator | null>(null)

  // Delete dialog state
  const [deletingRule, setDeletingRule] = useState<RoleCommissionRuleWithCreator | null>(null)

  const loadRules = async () => {
    setLoading(true)
    try {
      const data = await getRoleCommissionRules(roleId)
      setRules(data)
    } catch (err) {
      console.error('Error loading role commission rules:', err)
      toast.error('Failed to load commission rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [roleId])

  const handleCreate = () => {
    setEditingRule(null)
    setShowForm(true)
  }

  const handleEdit = (rule: RoleCommissionRuleWithCreator) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleToggleActive = async (rule: RoleCommissionRuleWithCreator) => {
    try {
      await updateRoleCommissionRule(rule.id, { is_active: !rule.is_active })
      const action = rule.is_active ? 'Deactivated' : 'Activated'
      toast.success(`${action} commission rule`)
      loadRules()
    } catch (err) {
      console.error('Error toggling role commission rule:', err)
      toast.error('Failed to update commission rule')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRule) return

    try {
      await deleteRoleCommissionRule(deletingRule.id)
      toast.success('Commission rule deleted')
      setDeletingRule(null)
      loadRules()
    } catch (err) {
      console.error('Error deleting role commission rule:', err)
      toast.error('Failed to delete commission rule')
    }
  }

  const handleSaved = () => {
    loadRules()
  }

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Commission Rules
            </span>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={handleCreate}>
              <Plus className="mr-1 h-3 w-3" />
              Add Rule
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No commission rules configured for this role
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <RoleCommissionRuleCard
                key={rule.id}
                rule={rule}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={setDeletingRule}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {user && (
        <RoleCommissionRuleFormModal
          open={showForm}
          onOpenChange={setShowForm}
          roleId={roleId}
          teamId={teamId}
          rule={editingRule}
          userId={user.id}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingRule?.name}&quot;? This will
              remove the commission rule from all employees who inherit it via this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
