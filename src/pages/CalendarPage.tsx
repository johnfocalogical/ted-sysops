import { Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function CalendarPage() {
  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Schedule and important dates"
      />
      <ComingSoon
        title="Calendar & Scheduling"
        description="View closing dates, schedule appointments, and manage your deal timeline all in one place."
        icon={<Calendar className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}
