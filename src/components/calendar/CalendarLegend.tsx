import type { CalendarEventType } from '@/types/calendar.types'
import { EVENT_COLORS, ALL_EVENT_TYPES } from '@/lib/calendarConstants'

interface CalendarLegendProps {
  visibleTypes: Set<CalendarEventType>
}

export function CalendarLegend({ visibleTypes }: CalendarLegendProps) {
  const typesToShow = ALL_EVENT_TYPES.filter((t) => visibleTypes.has(t))

  if (typesToShow.length === 0) return null

  return (
    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap bg-muted/50 rounded-md px-3 py-2">
      {typesToShow.map((type) => {
        const colors = EVENT_COLORS[type]
        return (
          <div key={type} className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.hex }}
            />
            <span className="text-xs text-muted-foreground">{colors.label}</span>
          </div>
        )
      })}
    </div>
  )
}
