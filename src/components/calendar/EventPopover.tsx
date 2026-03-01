import { useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EVENT_COLORS } from '@/lib/calendarConstants'
import type { CalendarEvent } from '@/lib/calendarService'
import type { CalendarEventType } from '@/types/calendar.types'

interface EventPopoverProps {
  event: CalendarEvent | null
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
  for_sale: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  pending_sale: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  on_hold: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function EventPopover({ event, anchorEl, open, onClose }: EventPopoverProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || !event || !anchorEl) return null

  const { extendedProps } = event
  const eventType = extendedProps.eventType as CalendarEventType
  const colors = EVENT_COLORS[eventType]

  // Position the popover near the anchor
  const rect = anchorEl.getBoundingClientRect()
  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 8,
    left: Math.min(rect.left, window.innerWidth - 340),
    zIndex: 50,
  }

  // If popover would go below viewport, show above
  if (rect.bottom + 300 > window.innerHeight) {
    popoverStyle.top = rect.top - 8
    popoverStyle.transform = 'translateY(-100%)'
  }

  const handleGoToDeal = () => {
    onClose()
    navigate(`/org/${orgId}/team/${teamId}/deals/${extendedProps.dealId}`)
  }

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="w-[320px] bg-popover border rounded-lg shadow-lg p-4 space-y-3"
    >
      {/* Event type header */}
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: colors.hex }}
        />
        <span className={`text-sm font-medium ${colors.text}`}>
          {colors.label}
        </span>
      </div>

      {/* Deal address */}
      <div className="text-base font-semibold leading-snug">
        {extendedProps.dealAddress}
      </div>

      {/* Date display */}
      <DateDisplay event={event} />

      {/* Deal metadata */}
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Badge
            variant="outline"
            className={STATUS_STYLES[extendedProps.dealStatus] ?? ''}
          >
            {formatStatus(extendedProps.dealStatus)}
          </Badge>
        </div>

        {/* Showing-specific metadata */}
        {eventType === 'showing' && extendedProps.metadata && (
          <>
            {extendedProps.metadata.showing_status && (
              <div>
                <span className="text-muted-foreground">Showing Status: </span>
                <span className="font-medium">
                  {formatStatus(extendedProps.metadata.showing_status as string)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Go to Deal button */}
      <Button size="sm" className="w-full" onClick={handleGoToDeal}>
        Go to Deal
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  )
}

// ============================================================================
// Date display sub-component
// ============================================================================

function DateDisplay({ event }: { event: CalendarEvent }) {
  const { extendedProps } = event
  const eventType = extendedProps.eventType

  // Range event (DD period)
  if (eventType === 'dd_period' && extendedProps.eventEndDate) {
    const startDate = parseISO(extendedProps.eventDate)
    const endDate = parseISO(extendedProps.eventEndDate)
    const today = new Date()
    const daysRemaining = differenceInDays(endDate, today)

    return (
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">
          {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
        </div>
        <div className="text-sm font-medium">
          {daysRemaining < 0 ? (
            <span className="text-red-500">Expired</span>
          ) : daysRemaining === 0 ? (
            <span className="text-amber-500">Expires today</span>
          ) : (
            <span>{daysRemaining} days remaining</span>
          )}
        </div>
      </div>
    )
  }

  // Showing (time event)
  if (eventType === 'showing' && extendedProps.eventTime) {
    const startDate = parseISO(extendedProps.eventDate)
    const startTime = extendedProps.eventTime
    const durationMin = extendedProps.durationMin ?? 30
    const startDateTime = parseISO(`${extendedProps.eventDate}T${startTime}`)
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000)

    return (
      <div className="space-y-0.5">
        <div className="text-sm text-muted-foreground">
          {format(startDate, 'MMMM d, yyyy')}
        </div>
        <div className="text-sm font-medium">
          {format(startDateTime, 'h:mm a')} – {format(endDateTime, 'h:mm a')}
        </div>
      </div>
    )
  }

  // Point event (default)
  return (
    <div className="text-sm text-muted-foreground">
      {format(parseISO(extendedProps.eventDate), 'MMMM d, yyyy')}
    </div>
  )
}
