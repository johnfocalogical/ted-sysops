import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  type DealStatus,
  type DealType,
  DEAL_STATUS_LABELS,
  DEAL_TYPE_LABELS,
} from '@/types/deal.types'

interface DealFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  statusFilter: DealStatus[]
  onStatusFilterChange: (statuses: DealStatus[]) => void
  dealTypeFilter: DealType[]
  onDealTypeFilterChange: (types: DealType[]) => void
  ownerFilter: string | null
  onOwnerFilterChange: (ownerId: string | null) => void
  teamMembers: { id: string; full_name: string | null; email: string }[]
}

const ALL_STATUSES: DealStatus[] = [
  'active',
  'for_sale',
  'pending_sale',
  'closed',
  'funded',
  'on_hold',
  'canceled',
]

const ALL_DEAL_TYPES: DealType[] = ['wholesale', 'listing', 'novation', 'purchase']

export function DealFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dealTypeFilter,
  onDealTypeFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  teamMembers,
}: DealFiltersProps) {
  const hasActiveFilters =
    statusFilter.length > 0 || dealTypeFilter.length > 0 || ownerFilter !== null

  function clearAll() {
    onStatusFilterChange([])
    onDealTypeFilterChange([])
    onOwnerFilterChange(null)
    onSearchChange('')
  }

  function toggleStatus(status: DealStatus) {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== status))
    } else {
      onStatusFilterChange([...statusFilter, status])
    }
  }

  function toggleDealType(type: DealType) {
    if (dealTypeFilter.includes(type)) {
      onDealTypeFilterChange(dealTypeFilter.filter((t) => t !== type))
    } else {
      onDealTypeFilterChange([...dealTypeFilter, type])
    }
  }

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search address, city..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter.length === 1 ? statusFilter[0] : 'multi'}
          onValueChange={(v) => {
            if (v === 'all') {
              onStatusFilterChange([])
            } else {
              toggleStatus(v as DealStatus)
            }
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue>
              {statusFilter.length === 0
                ? 'All Statuses'
                : statusFilter.length === 1
                  ? DEAL_STATUS_LABELS[statusFilter[0]]
                  : `${statusFilter.length} Statuses`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                <span className="flex items-center gap-2">
                  {statusFilter.includes(status) && '✓'} {DEAL_STATUS_LABELS[status]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Deal Type Filter */}
        <Select
          value={dealTypeFilter.length === 1 ? dealTypeFilter[0] : 'multi'}
          onValueChange={(v) => {
            if (v === 'all') {
              onDealTypeFilterChange([])
            } else {
              toggleDealType(v as DealType)
            }
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue>
              {dealTypeFilter.length === 0
                ? 'All Types'
                : dealTypeFilter.length === 1
                  ? DEAL_TYPE_LABELS[dealTypeFilter[0]]
                  : `${dealTypeFilter.length} Types`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ALL_DEAL_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  {dealTypeFilter.includes(type) && '✓'} {DEAL_TYPE_LABELS[type]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Owner Filter */}
        <Select
          value={ownerFilter || 'all'}
          onValueChange={(v) => onOwnerFilterChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.full_name || member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 text-xs">
            <X className="h-3.5 w-3.5 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilter.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleStatus(status)}
            >
              {DEAL_STATUS_LABELS[status]}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {dealTypeFilter.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleDealType(type)}
            >
              {DEAL_TYPE_LABELS[type]}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {ownerFilter && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => onOwnerFilterChange(null)}
            >
              Owner: {teamMembers.find((m) => m.id === ownerFilter)?.full_name || 'Selected'}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
