import { format, startOfWeek, endOfWeek } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Columns3,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarView } from '@/types/calendar.types'

interface CalendarToolbarProps {
  currentDate: Date
  view: CalendarView
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
}

const VIEW_OPTIONS: { value: CalendarView; label: string; icon: React.ReactNode }[] = [
  { value: 'month', label: 'Month', icon: <Calendar className="h-4 w-4" /> },
  { value: 'week', label: 'Week', icon: <Columns3 className="h-4 w-4" /> },
  { value: 'day', label: 'Day', icon: <Clock className="h-4 w-4" /> },
]

function formatPeriodLabel(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy')
    case 'week': {
      const weekStart = startOfWeek(date)
      const weekEnd = endOfWeek(date)
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`
      }
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
    }
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy')
  }
}

export function CalendarToolbar({
  currentDate,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Navigation */}
      <div className="flex items-center justify-center gap-2 sm:justify-start">
        <Button variant="outline" size="icon" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[180px] sm:min-w-[200px] text-center">
          {formatPeriodLabel(currentDate, view)}
        </h2>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: View toggle + Today */}
      <div className="flex items-center justify-center gap-2 sm:justify-end">
        <div className="flex items-center rounded-md border bg-muted p-0.5">
          {VIEW_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={view === opt.value ? 'secondary' : 'ghost'}
              size="sm"
              className={
                view === opt.value
                  ? 'bg-background shadow-sm'
                  : 'hover:bg-transparent'
              }
              onClick={() => onViewChange(opt.value)}
            >
              {opt.icon}
              <span className="ml-1.5 hidden sm:inline">{opt.label}</span>
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onToday}>
          <CalendarDays className="mr-1.5 h-4 w-4" />
          Today
        </Button>
      </div>
    </div>
  )
}
