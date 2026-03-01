import { supabase } from './supabase'
import { EVENT_COLORS } from './calendarConstants'
import type {
  CalendarEventRow,
  CalendarEventType,
  CalendarScope,
  CalendarView,
} from '@/types/calendar.types'
import { addDays, addMinutes, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, subWeeks, addWeeks, subDays } from 'date-fns'

// ============================================================================
// Types
// ============================================================================

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  classNames: string[]
  extendedProps: {
    eventType: CalendarEventType
    dealId: string
    dealAddress: string
    dealStatus: string
    ownerId: string | null
    tcId: string | null
    metadata: Record<string, unknown> | null
    eventDate: string
    eventEndDate: string | null
    eventTime: string | null
    durationMin: number | null
    bufferMin: number | null
  }
}

export interface GetCalendarEventsParams {
  teamId: string
  userId: string
  scope: CalendarScope
  startDate: string
  endDate: string
  ownerFilter?: string | null
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getCalendarEvents(
  params: GetCalendarEventsParams
): Promise<CalendarEvent[]> {
  if (!supabase) {
    console.error('Supabase not configured')
    return []
  }

  const { data, error } = await supabase.rpc('get_calendar_events', {
    p_team_id: params.teamId,
    p_user_id: params.userId,
    p_scope: params.scope,
    p_start_date: params.startDate,
    p_end_date: params.endDate,
    p_owner_filter: params.ownerFilter ?? null,
  })

  if (error) {
    console.error('Failed to fetch calendar events:', error)
    return []
  }

  return (data as CalendarEventRow[]).map(transformEvent)
}

// ============================================================================
// Transformation
// ============================================================================

function transformEvent(row: CalendarEventRow): CalendarEvent {
  const eventType = row.event_type as CalendarEventType
  const colors = EVENT_COLORS[eventType]
  const classNames: string[] = [`event-${eventType}`]

  let backgroundColor = colors.hex
  let borderColor = colors.hexBorder
  const textColor = '#FFFFFF'

  // Extended closing: dashed border styling
  if (eventType === 'extended_closing') {
    classNames.push('event-extended-closing')
  }

  // Showing status visual indicators
  if (eventType === 'showing' && row.metadata?.showing_status) {
    const showingStatus = row.metadata.showing_status as string
    if (showingStatus === 'canceled') {
      classNames.push('event-canceled')
      backgroundColor = backgroundColor + '80'
      borderColor = borderColor + '80'
    } else if (showingStatus === 'completed') {
      classNames.push('event-showing-completed')
    } else if (showingStatus === 'no_show') {
      classNames.push('event-showing-no-show')
    }
  }

  // On-hold deals: muted styling
  if (row.deal_status === 'on_hold') {
    classNames.push('event-on-hold')
    backgroundColor = backgroundColor + '99' // ~60% opacity
    borderColor = borderColor + '99'
  }

  // Build start/end based on event type
  let start: string
  let end: string | undefined
  let allDay = true

  if (eventType === 'dd_period' && row.event_end_date) {
    // Range events: FullCalendar treats end as exclusive, so +1 day
    start = row.event_date
    end = format(addDays(new Date(row.event_end_date + 'T00:00:00'), 1), 'yyyy-MM-dd')
  } else if (eventType === 'showing' && row.event_time) {
    // Time events: combine date + time
    start = `${row.event_date}T${row.event_time}`
    const durationMin = row.duration_min ?? 30
    end = format(addMinutes(new Date(start), durationMin), "yyyy-MM-dd'T'HH:mm:ss")
    allDay = false
  } else {
    // Point events
    start = row.event_date
  }

  return {
    id: row.event_id,
    title: row.event_label,
    start,
    end,
    allDay,
    backgroundColor,
    borderColor,
    textColor,
    classNames,
    extendedProps: {
      eventType,
      dealId: row.deal_id,
      dealAddress: row.deal_address,
      dealStatus: row.deal_status,
      ownerId: row.owner_id,
      tcId: row.tc_id,
      metadata: row.metadata,
      eventDate: row.event_date,
      eventEndDate: row.event_end_date,
      eventTime: row.event_time,
      durationMin: row.duration_min,
      bufferMin: row.buffer_min,
    },
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the date range to fetch for a given calendar view centered on `date`.
 * Fetches extra buffer for smooth navigation.
 */
export function getDateRangeForView(
  date: Date,
  view: CalendarView
): { start: string; end: string } {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

  switch (view) {
    case 'month': {
      // Previous month start → next month end (3 months of data)
      const start = startOfMonth(subMonths(date, 1))
      const end = endOfMonth(addMonths(date, 1))
      return { start: fmt(start), end: fmt(end) }
    }
    case 'week': {
      // Previous week start → next week end (3 weeks)
      const start = startOfWeek(subWeeks(date, 1))
      const end = endOfWeek(addWeeks(date, 1))
      return { start: fmt(start), end: fmt(end) }
    }
    case 'day': {
      // 1 week before → 1 week after (buffer for navigation)
      const start = subDays(date, 7)
      const end = addDays(date, 7)
      return { start: fmt(start), end: fmt(end) }
    }
  }
}
