import { Shield } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function Transactions() {
  return (
    <div>
      <PageHeader
        title="Transaction Guardian"
        subtitle="Oversee all transactions"
      />
      <ComingSoon
        title="Transaction Oversight"
        description="Monitor all deal transactions, track payments, and ensure compliance across your pipeline."
        icon={<Shield className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}
