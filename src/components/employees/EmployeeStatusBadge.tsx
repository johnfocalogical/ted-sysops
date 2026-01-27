import { Badge } from '@/components/ui/badge'
import type { EmployeeStatus } from '@/types/employee.types'

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus
}

const statusConfig: Record<EmployeeStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
  },
}

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
