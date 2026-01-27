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
import { CommissionRuleCard } from './CommissionRuleCard'
import { CommissionRuleFormModal } from './CommissionRuleFormModal'
import {
  getCommissionRulesForEmployee,
  updateCommissionRule,
  deleteCommissionRule,
} from '@/lib/commissionRuleService'
import { logCommissionRuleChange } from '@/lib/employeeActivityHelpers'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { CommissionRuleWithCreator } from '@/types/commission.types'

interface CommissionRulesSectionProps {
  employeeProfileId: string
  teamId: string
  isAdmin: boolean
}

export function CommissionRulesSection({
  employeeProfileId,
  teamId,
  isAdmin,
}: CommissionRulesSectionProps) {
  const { user } = useAuth()

  const [rules, setRules] = useState<CommissionRuleWithCreator[]>([])
  const [loading, setLoading] = useState(true)

  // Form modal state
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<CommissionRuleWithCreator | null>(null)

  // Delete dialog state
  const [deletingRule, setDeletingRule] = useState<CommissionRuleWithCreator | null>(null)

  const loadRules = async () => {
    setLoading(true)
    try {
      const data = await getCommissionRulesForEmployee(employeeProfileId)
      setRules(data)
    } catch (err) {
      console.error('Error loading commission rules:', err)
      toast.error('Failed to load commission rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [employeeProfileId])

  const handleCreate = () => {
    setEditingRule(null)
    setShowForm(true)
  }

  const handleEdit = (rule: CommissionRuleWithCreator) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleToggleActive = async (rule: CommissionRuleWithCreator) => {
    try {
      await updateCommissionRule(rule.id, { is_active: !rule.is_active })
      const action = rule.is_active ? 'Deactivated' : 'Activated'
      toast.success(`${action} commission rule`)

      if (user) {
        await logCommissionRuleChange({
          teamId,
          employeeProfileId,
          userId: user.id,
          action: 'updated',
          rule: { ...rule, is_active: !rule.is_active },
          previousRule: { ...rule },
        })
      }

      loadRules()
    } catch (err) {
      console.error('Error toggling commission rule:', err)
      toast.error('Failed to update commission rule')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRule || !user) return

    try {
      await deleteCommissionRule(deletingRule.id)
      toast.success('Commission rule deleted')

      await logCommissionRuleChange({
        teamId,
        employeeProfileId,
        userId: user.id,
        action: 'deleted',
        rule: { ...deletingRule },
      })

      setDeletingRule(null)
      loadRules()
    } catch (err) {
      console.error('Error deleting commission rule:', err)
      toast.error('Failed to delete commission rule')
    }
  }

  const handleSaved = async () => {
    if (!user) return

    // Reload first so we have the latest data
    const updatedRules = await getCommissionRulesForEmployee(employeeProfileId)
    setRules(updatedRules)

    // Find the newly created/updated rule
    const latestRule = editingRule
      ? updatedRules.find((r) => r.id === editingRule.id)
      : updatedRules[0]

    if (latestRule) {
      await logCommissionRuleChange({
        teamId,
        employeeProfileId,
        userId: user.id,
        action: editingRule ? 'updated' : 'created',
        rule: { ...latestRule },
        previousRule: editingRule ? { ...editingRule } : undefined,
      })
    }
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
            No commission rules configured
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <CommissionRuleCard
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
        <CommissionRuleFormModal
          open={showForm}
          onOpenChange={setShowForm}
          employeeProfileId={employeeProfileId}
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
              Are you sure you want to delete &quot;{deletingRule?.name}&quot;? This
              action cannot be undone.
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
