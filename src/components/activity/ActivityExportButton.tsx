import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActivityLogsForExport } from '@/lib/activityLogService'
import { exportActivitiesToCSV } from '@/lib/activityExportUtils'
import { toast } from 'sonner'
import type { ActivityEntityType, ActivityType } from '@/types/activity.types'

interface ActivityExportButtonProps {
  entityType: ActivityEntityType
  entityId: string
  employeeName: string
  activityTypes?: ActivityType[]
  dateFrom?: string
  dateTo?: string
}

export function ActivityExportButton({
  entityType,
  entityId,
  employeeName,
  activityTypes,
  dateFrom,
  dateTo,
}: ActivityExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const activities = await getActivityLogsForExport({
        entityType,
        entityId,
        activityTypes,
        dateFrom,
        dateTo,
      })

      if (activities.length === 0) {
        toast.info('No activity to export')
        return
      }

      exportActivitiesToCSV(activities, employeeName)
      toast.success(`Exported ${activities.length} activity entries`)
    } catch (err) {
      console.error('Error exporting activities:', err)
      toast.error('Failed to export activity log')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="h-8"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  )
}
