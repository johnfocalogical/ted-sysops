import { useState, useEffect, useCallback } from 'react'
import { Loader2, Percent, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDealEmployees, updateDealEmployee } from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import type { DealEmployeeWithUser } from '@/types/deal.types'

interface CommissionBreakdownProps {
  dealId: string
  grossAfterExpenses: number | null
  onCommissionsChange: (total: number) => void
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
  return email[0].toUpperCase()
}

export function CommissionBreakdown({
  dealId,
  grossAfterExpenses,
  onCommissionsChange,
}: CommissionBreakdownProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [employees, setEmployees] = useState<DealEmployeeWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Local editable percentages (keyed by employee id)
  const [percentages, setPercentages] = useState<Record<string, string>>({})
  // Track which ones have been changed
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    getDealEmployees(dealId)
      .then((data) => {
        if (!cancelled) {
          setEmployees(data)
          const pctMap: Record<string, string> = {}
          for (const emp of data) {
            pctMap[emp.id] = emp.commission_percentage != null ? emp.commission_percentage.toString() : ''
          }
          setPercentages(pctMap)
        }
      })
      .catch((err) => console.error('Error loading employees for commissions:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId])

  // Calculate commissions whenever percentages or grossAfterExpenses changes
  const calculateCommission = useCallback(
    (pct: string): number | null => {
      if (grossAfterExpenses == null) return null
      const parsed = parseFloat(pct)
      if (isNaN(parsed)) return null
      return (grossAfterExpenses * parsed) / 100
    },
    [grossAfterExpenses]
  )

  // Report total commissions to parent
  useEffect(() => {
    let total = 0
    for (const emp of employees) {
      const pct = percentages[emp.id] || ''
      const amount = calculateCommission(pct)
      if (amount != null) total += amount
    }
    onCommissionsChange(total)
  }, [employees, percentages, calculateCommission, onCommissionsChange])

  const handlePercentageChange = (empId: string, value: string) => {
    setPercentages((prev) => ({ ...prev, [empId]: value }))
    setDirtyIds((prev) => new Set(prev).add(empId))
  }

  const handleSave = async () => {
    if (!teamId || !user?.id) return

    setSaving(true)
    try {
      const updates: Promise<void>[] = []
      for (const empId of dirtyIds) {
        const pctStr = percentages[empId]
        const parsed = pctStr ? parseFloat(pctStr) : null
        const pct = parsed != null && !isNaN(parsed) ? parsed : null
        updates.push(
          updateDealEmployee(empId, { commission_percentage: pct }).then(() => {})
        )
      }
      await Promise.all(updates)

      // Log activity
      const changedNames = employees
        .filter((e) => dirtyIds.has(e.id))
        .map((e) => {
          const name = e.user.full_name || e.user.email
          const pct = percentages[e.id] || '0'
          return `${name}: ${pct}%`
        })

      await createActivityLog(
        {
          team_id: teamId,
          deal_id: dealId,
          entity_type: 'deal',
          activity_type: 'updated',
          content: `Updated commission rates: ${changedNames.join(', ')}`,
        },
        user.id
      )

      setDirtyIds(new Set())
      toast.success('Commission rates saved')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save commission rates')
    } finally {
      setSaving(false)
    }
  }

  const totalCommissions = employees.reduce((sum, emp) => {
    const amount = calculateCommission(percentages[emp.id] || '')
    return sum + (amount ?? 0)
  }, 0)

  const netProfit = grossAfterExpenses != null ? grossAfterExpenses - totalCommissions : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Commission Breakdown</h3>
        </div>
        <div className="text-center py-8 text-sm text-muted-foreground">
          No employees assigned to this deal. Add employees in the Employee tab.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Commission Breakdown</h3>
        </div>

        {dirtyIds.size > 0 && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 h-8 text-xs gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Rates
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Employee</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="text-xs w-[120px]">Rate (%)</TableHead>
              <TableHead className="text-xs text-right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const pct = percentages[emp.id] || ''
              const amount = calculateCommission(pct)

              return (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] bg-muted">
                          {getInitials(emp.user.full_name, emp.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {emp.user.full_name || emp.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {emp.role || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={pct}
                        onChange={(e) => handlePercentageChange(emp.id, e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm tabular-nums pr-7"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        %
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium tabular-nums">
                    {amount != null
                      ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </TableCell>
                </TableRow>
              )
            })}

            {/* Total Row */}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={3} className="text-sm text-right">
                Total Commissions
              </TableCell>
              <TableCell className="text-sm text-right font-bold tabular-nums text-red-600 dark:text-red-400">
                ${totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
            </TableRow>

            {/* Net Profit Row */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={3} className="text-sm text-right font-medium">
                Estimated Net Profit
              </TableCell>
              <TableCell
                className={`text-sm text-right font-bold tabular-nums ${
                  netProfit != null && netProfit >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {netProfit != null
                  ? `$${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
