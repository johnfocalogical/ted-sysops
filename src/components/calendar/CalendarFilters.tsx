import type { CalendarScope, CalendarEventType } from '@/types/calendar.types'
import { EVENT_COLORS, ALL_EVENT_TYPES } from '@/lib/calendarConstants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CalendarFiltersProps {
  scope: CalendarScope
  onScopeChange: (scope: CalendarScope) => void
  ownerFilter: string | null
  onOwnerFilterChange: (userId: string | null) => void
  visibleTypes: Set<CalendarEventType>
  onToggleEventType: (type: CalendarEventType) => void
  teamMembers: Array<{ id: string; name: string }>
}

export function CalendarFilters({
  scope,
  onScopeChange,
  ownerFilter,
  onOwnerFilterChange,
  visibleTypes,
  onToggleEventType,
  teamMembers,
}: CalendarFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Dropdowns row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Scope:</span>
          <Select
            value={scope}
            onValueChange={(val) => onScopeChange(val as CalendarScope)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="my_deals">My Deals</SelectItem>
              <SelectItem value="team_deals">Team Deals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {scope === 'team_deals' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Owner:</span>
            <Select
              value={ownerFilter ?? 'all'}
              onValueChange={(val) =>
                onOwnerFilterChange(val === 'all' ? null : val)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Event type filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground mr-1">Show:</span>
        {ALL_EVENT_TYPES.map((type) => {
          const colors = EVENT_COLORS[type]
          const active = visibleTypes.has(type)
          return (
            <button
              key={type}
              onClick={() => onToggleEventType(type)}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                border transition-all cursor-pointer
                ${
                  active
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : 'bg-muted text-muted-foreground border-transparent opacity-50'
                }
              `}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors.hex }}
              />
              {colors.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
