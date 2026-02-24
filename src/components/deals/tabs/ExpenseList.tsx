import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Trash2, Pencil, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getDealExpenses,
  createDealExpense,
  updateDealExpense,
  deleteDealExpense,
} from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import type { DealExpense, ExpenseCategory } from '@/types/deal.types'
import { EXPENSE_CATEGORY_LABELS } from '@/types/deal.types'

interface ExpenseListProps {
  dealId: string
  onExpensesChange: (expenses: DealExpense[]) => void
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700',
  inspection: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  title_escrow: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-300 dark:border-teal-700',
  legal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  hoa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700',
  earnest_money: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700',
  contractor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-700',
}

// ============================================================================
// Main Component
// ============================================================================

export function ExpenseList({ dealId, onExpensesChange }: ExpenseListProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [expenses, setExpenses] = useState<DealExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<DealExpense | null>(null)

  const refreshExpenses = useCallback(async () => {
    try {
      const data = await getDealExpenses(dealId)
      setExpenses(data)
      onExpensesChange(data)
    } catch (err) {
      console.error('Error loading expenses:', err)
    }
  }, [dealId, onExpensesChange])

  useEffect(() => {
    let cancelled = false
    getDealExpenses(dealId)
      .then((data) => {
        if (!cancelled) {
          setExpenses(data)
          onExpensesChange(data)
        }
      })
      .catch((err) => console.error('Error loading expenses:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId, onExpensesChange])

  const handleDelete = async (expense: DealExpense) => {
    try {
      await deleteDealExpense(expense.id)

      if (teamId && user?.id) {
        await createActivityLog(
          {
            team_id: teamId,
            deal_id: dealId,
            entity_type: 'deal',
            activity_type: 'updated',
            content: `Deleted expense: ${EXPENSE_CATEGORY_LABELS[expense.category]} — $${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
          user.id
        )
      }

      await refreshExpenses()
      toast.success('Expense deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete expense')
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Expenses</h3>
          <span className="text-xs text-muted-foreground">({expenses.length})</span>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              dealId={dealId}
              onSaved={() => {
                setAddOpen(false)
                refreshExpenses()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
                <TableHead className="text-xs w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm tabular-nums">
                    {expense.expense_date
                      ? new Date(expense.expense_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${CATEGORY_COLORS[expense.category]}`}
                    >
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {expense.description || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium tabular-nums">
                    ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {expense.notes || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this expense entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(expense)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Row */}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell colSpan={3} className="text-sm text-right">
                  Total Expenses
                </TableCell>
                <TableCell className="text-sm text-right font-bold tabular-nums text-red-600 dark:text-red-400">
                  ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Expense Dialog */}
      <Dialog open={editingExpense !== null} onOpenChange={(open) => { if (!open) setEditingExpense(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              dealId={dealId}
              existing={editingExpense}
              onSaved={() => {
                setEditingExpense(null)
                refreshExpenses()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Expense Form (Add/Edit)
// ============================================================================

function ExpenseForm({
  dealId,
  existing,
  onSaved,
}: {
  dealId: string
  existing?: DealExpense
  onSaved: () => void
}) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [category, setCategory] = useState<ExpenseCategory>(existing?.category || 'other')
  const [amount, setAmount] = useState(existing?.amount?.toString() || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [expenseDate, setExpenseDate] = useState(existing?.expense_date?.split('T')[0] || '')
  const [notes, setNotes] = useState(existing?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!teamId || !user?.id) return
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    try {
      if (existing) {
        await updateDealExpense(existing.id, {
          category,
          amount: parsedAmount,
          description: description.trim() || null,
          expense_date: expenseDate || null,
          notes: notes.trim() || null,
        })

        await createActivityLog(
          {
            team_id: teamId,
            deal_id: dealId,
            entity_type: 'deal',
            activity_type: 'updated',
            content: `Updated expense: ${EXPENSE_CATEGORY_LABELS[category]} — $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
          user.id
        )

        toast.success('Expense updated')
      } else {
        await createDealExpense(
          {
            deal_id: dealId,
            category,
            amount: parsedAmount,
            description: description.trim() || undefined,
            expense_date: expenseDate || undefined,
            notes: notes.trim() || undefined,
          },
          user.id
        )

        await createActivityLog(
          {
            team_id: teamId,
            deal_id: dealId,
            entity_type: 'deal',
            activity_type: 'created',
            content: `Added expense: ${EXPENSE_CATEGORY_LABELS[category]} — $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
          user.id
        )

        toast.success('Expense added')
      }

      onSaved()
    } catch (err) {
      console.error(err)
      toast.error(existing ? 'Failed to update expense' : 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Category *</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Amount and Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-9 pl-7 tabular-nums"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          className="h-9"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!amount || saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </div>
  )
}
