import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Analytics and insights"
      />
      <ComingSoon
        title="Analytics & Reporting"
        description="Gain insights into your pipeline health, lead sources, conversion rates, and team performance."
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}
