import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { format } from 'date-fns'
import { useCalendarStore } from '@/hooks/useCalendarStore'
import { CalendarToolbar } from './CalendarToolbar'
import { CalendarFilters } from './CalendarFilters'
import { CalendarLegend } from './CalendarLegend'
import { EventPopover } from './EventPopover'
import type { CalendarEvent } from '@/lib/calendarService'
import './calendarStyles.css'

interface DealCalendarProps {
  teamId: string
  userId: string
  orgId: string
  teamMembers: Array<{ id: string; name: string }>
}

const VIEW_MAP: Record<string, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
}

function getInitialView(): string {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 'listWeek'
  }
  return 'dayGridMonth'
}

export function DealCalendar({ teamId, userId, teamMembers }: DealCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)

  // Popover state
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)

  const {
    loading,
    error,
    view,
    currentDate,
    scope,
    ownerFilter,
    visibleTypes,
    allFetchedEvents,
    initialize,
    fetchEvents,
    setView,
    setScope,
    setOwnerFilter,
    toggleEventType,
    navigateToday,
    navigatePrev,
    navigateNext,
    clearStore,
  } = useCalendarStore()

  // Memoize filtered events to avoid unnecessary FullCalendar re-renders
  const filteredEvents = useMemo(() => {
    return allFetchedEvents.filter((e) => visibleTypes.has(e.extendedProps.eventType))
  }, [allFetchedEvents, visibleTypes])

  // Initialize store on mount
  useEffect(() => {
    initialize(teamId, userId)
    return () => clearStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, userId])

  // Sync FullCalendar API with store state
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return

    const fcView = VIEW_MAP[view] ?? 'dayGridMonth'
    if (api.view.type !== fcView) {
      api.changeView(fcView)
    }
    api.gotoDate(currentDate)
  }, [view, currentDate])

  // Handle FullCalendar date range changes
  const handleDatesSet = useCallback(
    (info: DatesSetArg) => {
      const start = format(info.start, 'yyyy-MM-dd')
      const end = format(info.end, 'yyyy-MM-dd')
      fetchEvents(start, end)
    },
    [fetchEvents]
  )

  // Handle event click → open popover
  const handleEventClick = useCallback((info: EventClickArg) => {
    info.jsEvent.preventDefault()
    const fc = info.event
    const calEvent: CalendarEvent = {
      id: fc.id,
      title: fc.title,
      start: fc.startStr,
      end: fc.endStr || undefined,
      allDay: fc.allDay,
      backgroundColor: fc.backgroundColor,
      borderColor: fc.borderColor,
      textColor: fc.textColor,
      classNames: [...fc.classNames],
      extendedProps: fc.extendedProps as CalendarEvent['extendedProps'],
    }
    setPopoverEvent(calEvent)
    setPopoverAnchor(info.el)
  }, [])

  // Handle "+N more" click → switch to day view
  const handleMoreLinkClick = useCallback(
    (info: { date: Date }) => {
      setView('day')
      useCalendarStore.getState().setCurrentDate(info.date)
    },
    [setView]
  )

  const noEvents = !loading && filteredEvents.length === 0
  const allFiltered = !loading && allFetchedEvents.length > 0 && filteredEvents.length === 0

  return (
    <div className="space-y-4">
      <CalendarToolbar
        currentDate={currentDate}
        view={view}
        onPrev={navigatePrev}
        onNext={navigateNext}
        onToday={navigateToday}
        onViewChange={setView}
      />

      <CalendarFilters
        scope={scope}
        onScopeChange={setScope}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        visibleTypes={visibleTypes}
        onToggleEventType={toggleEventType}
        teamMembers={teamMembers}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {allFiltered && (
        <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-center">
          All event types are hidden. Toggle some back on above to see events.
        </div>
      )}

      {noEvents && !allFiltered && (
        <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-center">
          {scope === 'my_deals'
            ? 'No deal events found. Events appear automatically from deal dates — check the Whiteboard for active deals.'
            : 'No deal events this period.'}
        </div>
      )}

      <div className="deal-calendar-wrapper relative rounded-lg border bg-card p-2">
        {loading && <div className="calendar-loading" />}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={getInitialView()}
          headerToolbar={false}
          events={filteredEvents}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          moreLinkClick={handleMoreLinkClick}
          height="auto"
          dayMaxEvents={3}
          nowIndicator={true}
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          eventDisplay="block"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>

      <CalendarLegend visibleTypes={visibleTypes} />

      <EventPopover
        event={popoverEvent}
        anchorEl={popoverAnchor}
        open={!!popoverEvent}
        onClose={() => {
          setPopoverEvent(null)
          setPopoverAnchor(null)
        }}
      />
    </div>
  )
}
