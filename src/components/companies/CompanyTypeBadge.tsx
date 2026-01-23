import { TypeBadge } from '@/components/shared/TypeBadge'
import type { CompanyType } from '@/types/company.types'

interface CompanyTypeBadgeProps {
  type: CompanyType
  size?: 'sm' | 'default'
  showIcon?: boolean
}

export function CompanyTypeBadge({ type, size = 'default', showIcon = true }: CompanyTypeBadgeProps) {
  return (
    <TypeBadge
      name={type.name}
      icon={type.icon}
      color={type.color}
      size={size}
      showIcon={showIcon}
    />
  )
}
