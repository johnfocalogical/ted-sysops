import type { CalendarEventType } from '@/types/calendar.types'

// Color mapping for each event type
// These map to Tailwind color classes and hex values for FullCalendar
export const EVENT_COLORS: Record<CalendarEventType, {
  bg: string          // Tailwind bg class
  text: string        // Tailwind text class
  border: string      // Tailwind border class
  hex: string         // Hex value for FullCalendar eventColor
  hexBorder: string   // Hex value for FullCalendar eventBorderColor
  label: string       // Human-readable label
}> = {
  closing: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    hex: '#EF4444',
    hexBorder: '#DC2626',
    label: 'Closing',
  },
  extended_closing: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-400 dark:border-red-600 border-dashed',
    hex: '#F87171',
    hexBorder: '#EF4444',
    label: 'Ext. Closing',
  },
  dd_period: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    hex: '#7C3AED',
    hexBorder: '#6D28D9',
    label: 'DD Period',
  },
  dd_expiration: {
    bg: 'bg-purple-200 dark:bg-purple-900/40',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-400 dark:border-purple-600',
    hex: '#6D28D9',
    hexBorder: '#5B21B6',
    label: 'DD Expires',
  },
  inspection: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    hex: '#F59E0B',
    hexBorder: '#D97706',
    label: 'Inspection',
  },
  earnest_money: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    hex: '#22C55E',
    hexBorder: '#16A34A',
    label: 'Earnest Money',
  },
  contract: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-300 dark:border-slate-600',
    hex: '#94A3B8',
    hexBorder: '#64748B',
    label: 'Contract',
  },
  showing: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
    hex: '#00D2AF',
    hexBorder: '#00B89C',
    label: 'Showing',
  },
}

// All event types for filter UI
export const ALL_EVENT_TYPES: CalendarEventType[] = [
  'closing',
  'extended_closing',
  'dd_period',
  'dd_expiration',
  'inspection',
  'earnest_money',
  'contract',
  'showing',
]
