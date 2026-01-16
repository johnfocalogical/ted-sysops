import { Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function TeamDashboard() {
  return (
    <div>
      <PageHeader
        title="Team Dashboard"
        subtitle="Team-wide metrics and performance"
      />
      <ComingSoon
        title="Team Performance"
        description="Monitor your team's activity, track collective progress, and view team-wide deal metrics."
        icon={<Users className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}
