// Event types derived from deal data
export type CalendarEventType =
  | 'closing'
  | 'extended_closing'
  | 'dd_period'
  | 'dd_expiration'
  | 'inspection'
  | 'earnest_money'
  | 'contract'
  | 'showing'

// Raw event from the Postgres view/function
export interface CalendarEventRow {
  event_id: string
  deal_id: string
  team_id: string
  owner_id: string | null
  tc_id: string | null
  deal_address: string
  deal_status: string
  event_type: CalendarEventType
  event_date: string // ISO date string
  event_end_date: string | null
  event_time: string | null // HH:MM:SS
  duration_min: number | null
  buffer_min: number | null
  event_label: string
  metadata: Record<string, unknown> | null
}

// Calendar view modes
export type CalendarView = 'month' | 'week' | 'day'

// Scope for filtering
export type CalendarScope = 'my_deals' | 'team_deals'

// Date range for cache tracking
export interface DateRange {
  start: string // ISO date
  end: string // ISO date
}
