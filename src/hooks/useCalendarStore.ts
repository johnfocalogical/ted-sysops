import { create } from 'zustand'
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import type {
  CalendarView,
  CalendarScope,
  CalendarEventType,
  DateRange,
} from '@/types/calendar.types'
import { ALL_EVENT_TYPES } from '@/lib/calendarConstants'
import {
  getCalendarEvents,
  getDateRangeForView,
} from '@/lib/calendarService'
import type { CalendarEvent } from '@/lib/calendarService'

// ============================================================================
// Types
// ============================================================================

interface CalendarStoreState {
  // Event data
  events: CalendarEvent[]
  loading: boolean
  error: string | null

  // View state
  view: CalendarView
  currentDate: Date

  // Filtering
  scope: CalendarScope
  ownerFilter: string | null
  visibleTypes: Set<CalendarEventType>

  // Cache tracking
  fetchedRanges: DateRange[]
  allFetchedEvents: CalendarEvent[]

  // Context
  teamId: string | null
  userId: string | null

  // Actions
  initialize: (teamId: string, userId: string) => void
  fetchEvents: (startDate: string, endDate: string) => Promise<void>
  setView: (view: CalendarView) => void
  setCurrentDate: (date: Date) => void
  setScope: (scope: CalendarScope) => void
  setOwnerFilter: (userId: string | null) => void
  toggleEventType: (type: CalendarEventType) => void
  navigateToday: () => void
  navigatePrev: () => void
  navigateNext: () => void
  getFilteredEvents: () => CalendarEvent[]
  clearStore: () => void
  refreshEvents: () => Promise<void>
}

// ============================================================================
// Helpers
// ============================================================================

function isRangeCovered(
  fetchedRanges: DateRange[],
  start: string,
  end: string
): boolean {
  // Check if any single fetched range fully covers the requested range
  return fetchedRanges.some(
    (r) => r.start <= start && r.end >= end
  )
}

function filterByVisibleTypes(
  events: CalendarEvent[],
  visibleTypes: Set<CalendarEventType>
): CalendarEvent[] {
  return events.filter((e) => visibleTypes.has(e.extendedProps.eventType))
}

function deduplicateEvents(
  existing: CalendarEvent[],
  incoming: CalendarEvent[]
): CalendarEvent[] {
  const byId = new Map<string, CalendarEvent>()
  for (const e of existing) byId.set(e.id, e)
  for (const e of incoming) byId.set(e.id, e)
  return Array.from(byId.values())
}

// ============================================================================
// Store
// ============================================================================

export const useCalendarStore = create<CalendarStoreState>((set, get) => ({
  // Initial state
  events: [],
  loading: false,
  error: null,
  view: 'month',
  currentDate: new Date(),
  scope: 'my_deals',
  ownerFilter: null,
  visibleTypes: new Set(ALL_EVENT_TYPES),
  fetchedRanges: [],
  allFetchedEvents: [],
  teamId: null,
  userId: null,

  initialize: (teamId: string, userId: string) => {
    const state = get()
    const teamChanged = state.teamId !== teamId

    set({
      teamId,
      userId,
      ...(teamChanged
        ? {
            allFetchedEvents: [],
            fetchedRanges: [],
            events: [],
            error: null,
          }
        : {}),
    })

    const { start, end } = getDateRangeForView(get().currentDate, get().view)
    get().fetchEvents(start, end)
  },

  fetchEvents: async (startDate: string, endDate: string) => {
    const { teamId, userId, scope, ownerFilter, fetchedRanges, visibleTypes } = get()

    if (!teamId || !userId) return

    // Skip if range is already cached
    if (isRangeCovered(fetchedRanges, startDate, endDate)) {
      return
    }

    set({ loading: true, error: null })

    try {
      const newEvents = await getCalendarEvents({
        teamId,
        userId,
        scope,
        startDate,
        endDate,
        ownerFilter,
      })

      const allFetchedEvents = deduplicateEvents(get().allFetchedEvents, newEvents)
      const events = filterByVisibleTypes(allFetchedEvents, visibleTypes)

      set({
        allFetchedEvents,
        events,
        fetchedRanges: [...get().fetchedRanges, { start: startDate, end: endDate }],
        loading: false,
      })
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch calendar events',
      })
    }
  },

  setView: (view: CalendarView) => {
    set({ view })
    const { currentDate } = get()
    const { start, end } = getDateRangeForView(currentDate, view)
    get().fetchEvents(start, end)
  },

  setCurrentDate: (date: Date) => {
    set({ currentDate: date })
    const { view } = get()
    const { start, end } = getDateRangeForView(date, view)
    get().fetchEvents(start, end)
  },

  setScope: (scope: CalendarScope) => {
    set({
      scope,
      ownerFilter: scope === 'my_deals' ? null : get().ownerFilter,
      allFetchedEvents: [],
      fetchedRanges: [],
      events: [],
    })
    const { currentDate, view } = get()
    const { start, end } = getDateRangeForView(currentDate, view)
    get().fetchEvents(start, end)
  },

  setOwnerFilter: (userId: string | null) => {
    set({
      ownerFilter: userId,
      allFetchedEvents: [],
      fetchedRanges: [],
      events: [],
    })
    const { currentDate, view } = get()
    const { start, end } = getDateRangeForView(currentDate, view)
    get().fetchEvents(start, end)
  },

  toggleEventType: (type: CalendarEventType) => {
    const { visibleTypes, allFetchedEvents } = get()
    const newTypes = new Set(visibleTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    set({
      visibleTypes: newTypes,
      events: filterByVisibleTypes(allFetchedEvents, newTypes),
    })
  },

  navigateToday: () => {
    const now = new Date()
    set({ currentDate: now })
    const { view } = get()
    const { start, end } = getDateRangeForView(now, view)
    get().fetchEvents(start, end)
  },

  navigatePrev: () => {
    const { currentDate, view } = get()
    let newDate: Date
    switch (view) {
      case 'month':
        newDate = subMonths(currentDate, 1)
        break
      case 'week':
        newDate = subWeeks(currentDate, 1)
        break
      case 'day':
        newDate = subDays(currentDate, 1)
        break
    }
    set({ currentDate: newDate })
    const { start, end } = getDateRangeForView(newDate, view)
    get().fetchEvents(start, end)
  },

  navigateNext: () => {
    const { currentDate, view } = get()
    let newDate: Date
    switch (view) {
      case 'month':
        newDate = addMonths(currentDate, 1)
        break
      case 'week':
        newDate = addWeeks(currentDate, 1)
        break
      case 'day':
        newDate = addDays(currentDate, 1)
        break
    }
    set({ currentDate: newDate })
    const { start, end } = getDateRangeForView(newDate, view)
    get().fetchEvents(start, end)
  },

  getFilteredEvents: () => {
    const { allFetchedEvents, visibleTypes } = get()
    return filterByVisibleTypes(allFetchedEvents, visibleTypes)
  },

  clearStore: () => {
    set({
      events: [],
      loading: false,
      error: null,
      view: 'month',
      currentDate: new Date(),
      scope: 'my_deals',
      ownerFilter: null,
      visibleTypes: new Set(ALL_EVENT_TYPES),
      fetchedRanges: [],
      allFetchedEvents: [],
      teamId: null,
      userId: null,
    })
  },

  refreshEvents: async () => {
    set({ fetchedRanges: [], allFetchedEvents: [], events: [] })
    const { currentDate, view } = get()
    const { start, end } = getDateRangeForView(currentDate, view)
    await get().fetchEvents(start, end)
  },
}))
