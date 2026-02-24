import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import type { DealListItem, DealStatus, DealType } from '@/types/deal.types'
import { DEAL_STATUS_LABELS, DEAL_TYPE_LABELS } from '@/types/deal.types'

interface DealListViewProps {
  deals: DealListItem[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  totalPages: number
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: string, direction: 'asc' | 'desc') => void
  onPageChange: (page: number) => void
  orgId: string
  teamId: string
}

const STATUS_BADGE_STYLES: Record<DealStatus, string> = {
  active:
    'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700',
  for_sale:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
  pending_sale:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
  closed:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
  funded:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
  on_hold:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700',
  canceled:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface SortableHeaderProps {
  label: string
  column: string
  currentColumn: string
  currentDirection: 'asc' | 'desc'
  onSort: (column: string, direction: 'asc' | 'desc') => void
}

function SortableHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentColumn === column

  function handleClick() {
    if (isActive) {
      onSort(column, currentDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(column, 'asc')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-medium text-muted-foreground hover:text-foreground"
      onClick={handleClick}
    >
      {label}
      {isActive ? (
        currentDirection === 'asc' ? (
          <ArrowUp className="ml-1 h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="ml-1 h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
      )}
    </Button>
  )
}

export function DealListView({
  deals,
  loading,
  total,
  page,
  pageSize,
  totalPages,
  sortColumn,
  sortDirection,
  onSort,
  onPageChange,
  orgId,
  teamId,
}: DealListViewProps) {
  const navigate = useNavigate()

  function handleRowClick(dealId: string) {
    navigate(`/org/${orgId}/team/${teamId}/deals/${dealId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div className="py-12 text-center">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Deals Found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or create a new deal.
        </p>
      </div>
    )
  }

  const showingFrom = (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader
                label="Address"
                column="address"
                currentColumn={sortColumn}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <SortableHeader
                label="City"
                column="city"
                currentColumn={sortColumn}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Owner</TableHead>
            <TableHead className="text-right">
              <SortableHeader
                label="Contract Price"
                column="contract_price"
                currentColumn={sortColumn}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              <SortableHeader
                label="Closing Date"
                column="closing_date"
                currentColumn={sortColumn}
                currentDirection={sortDirection}
                onSort={onSort}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="cursor-pointer"
              onClick={() => handleRowClick(deal.id)}
            >
              <TableCell className="font-medium">{deal.address}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {deal.city || '—'}
              </TableCell>
              <TableCell>
                <Badge className={STATUS_BADGE_STYLES[deal.status]}>
                  {DEAL_STATUS_LABELS[deal.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {DEAL_TYPE_LABELS[deal.deal_type as DealType] || deal.deal_type}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm">
                  {deal.owner?.full_name || deal.owner?.email || '—'}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCurrency(deal.contract_price)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                {formatDate(deal.closing_date)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-muted-foreground">
            Showing {showingFrom} to {showingTo} of {total} deals
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
