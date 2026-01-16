import { UserCog } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function Employees() {
  return (
    <div>
      <PageHeader
        title="Employee Sentinel"
        subtitle="Manage your team members"
      />
      <ComingSoon
        title="Employee Management"
        description="Add team members, assign roles, manage permissions, and track employee performance."
        icon={<UserCog className="h-8 w-8 text-primary" />}
      />
    </div>
  )
}
