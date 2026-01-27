import { ACTIVITY_TYPE_LABELS } from '@/types/activity.types'
import type { ActivityLogWithUser, ActivityType } from '@/types/activity.types'

// ============================================================================
// Activity Export Utilities
// CSV export for activity logs
// ============================================================================

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatActivityType(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type] || type
}

/**
 * Export activity logs to CSV and trigger browser download.
 */
export function exportActivitiesToCSV(
  activities: ActivityLogWithUser[],
  employeeName: string
): void {
  const headers = ['Date', 'Time', 'User', 'Activity Type', 'Description', 'Details']
  const rows = activities.map((a) => {
    const date = new Date(a.created_at)
    const dateStr = date.toLocaleDateString()
    const timeStr = date.toLocaleTimeString()
    const userName = a.user.full_name || a.user.email
    const activityType = formatActivityType(a.activity_type)
    const description = a.content || ''
    const details = a.metadata ? JSON.stringify(a.metadata) : ''

    return [dateStr, timeStr, userName, activityType, description, details]
      .map(escapeCSV)
      .join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const safeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_')
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `activity_${safeName}_${dateStr}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
