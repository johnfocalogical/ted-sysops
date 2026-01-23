import { TypeBadge } from '@/components/shared/TypeBadge'
import type { ContactType } from '@/types/contact.types'

interface ContactTypeBadgeProps {
  type: ContactType
  size?: 'sm' | 'default'
  showIcon?: boolean
}

export function ContactTypeBadge({ type, size = 'default', showIcon = true }: ContactTypeBadgeProps) {
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
