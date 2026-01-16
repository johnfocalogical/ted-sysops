import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function PayTime() {
  return (
    <div>
      <PageHeader
        title="My Pay & Time"
        subtitle="Track your compensation and time"
      />
      <ComingSoon
        title="Pay & Time Tracking"
        description="View your commissions, track time spent on deals, and manage your earnings all in one place."
        icon={<Wallet className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}
