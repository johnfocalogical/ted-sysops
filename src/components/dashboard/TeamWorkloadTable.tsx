import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DashboardTeamWorkload } from '@/types/dashboard.types'

interface TeamWorkloadTableProps {
  workload: DashboardTeamWorkload[]
  loading: boolean
  onMemberClick?: (userId: string) => void
}

type SortColumn = 'full_name' | 'active_count' | 'for_sale_count' | 'pending_count' | 'closed_mtd_count' | 'total_pipeline_value'

function formatCurrency(value: number): string {
  if (value === 0) return '$0'
  const absVal = Math.abs(value)
  const formatted =
    absVal >= 1_000_000
      ? `$${(absVal / 1_000_000).toFixed(1)}M`
      : absVal >= 1_000
        ? `$${(absVal / 1_000).toFixed(0)}K`
        : `$${absVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return value < 0 ? `-${formatted}` : formatted
}

export function TeamWorkloadTable({
  workload,
  loading,
  onMemberClick,
}: TeamWorkloadTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('active_count')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    return [...workload].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      const aNum = Number(aVal) || 0
      const bNum = Number(bVal) || 0
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
    })
  }, [workload, sortColumn, sortDirection])

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDirection('desc')
    }
  }

  const sortIndicator = (col: SortColumn) => {
    if (sortColumn !== col) return null
    return sortDirection === 'asc' ? ' \u25B2' : ' \u25BC'
  }

  const columns: { key: SortColumn; label: string }[] = [
    { key: 'full_name', label: 'Team Member' },
    { key: 'active_count', label: 'Active' },
    { key: 'for_sale_count', label: 'For Sale' },
    { key: 'pending_count', label: 'Pending' },
    { key: 'closed_mtd_count', label: 'Closed (MTD)' },
    { key: 'total_pipeline_value', label: 'Pipeline Value' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Team Workload</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : workload.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No team members found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="font-semibold uppercase text-xs tracking-wider cursor-pointer hover:text-foreground"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{sortIndicator(col.key)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((member) => {
                const totalActive = member.active_count + member.for_sale_count + member.pending_count
                const isIdle = totalActive === 0
                const isOverloaded = totalActive >= 10

                return (
                  <TableRow
                    key={member.user_id}
                    className={cn(
                      'hover:bg-muted/50 border-b border-border/50',
                      isIdle && 'bg-amber-50/50 dark:bg-amber-900/10',
                      isOverloaded && 'bg-red-50/50 dark:bg-red-900/10'
                    )}
                  >
                    <TableCell>
                      {onMemberClick ? (
                        <button
                          onClick={() => onMemberClick(member.user_id)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {member.full_name || 'Unknown'}
                        </button>
                      ) : (
                        <span className="text-sm font-medium">{member.full_name || 'Unknown'}</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{member.active_count}</TableCell>
                    <TableCell className="tabular-nums">{member.for_sale_count}</TableCell>
                    <TableCell className="tabular-nums">{member.pending_count}</TableCell>
                    <TableCell className="tabular-nums">{member.closed_mtd_count}</TableCell>
                    <TableCell className="tabular-nums font-medium">
                      {formatCurrency(member.total_pipeline_value)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
