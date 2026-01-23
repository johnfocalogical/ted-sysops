import * as LucideIcons from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getTypeColorClasses } from '@/types/type-system.types'

interface TypeBadgeProps {
  name: string
  icon?: string
  color: string
  size?: 'sm' | 'default'
  showIcon?: boolean
  className?: string
}

export function TypeBadge({
  name,
  icon = 'User',
  color,
  size = 'default',
  showIcon = true,
  className,
}: TypeBadgeProps) {
  const colorClasses = getTypeColorClasses(color)

  // Get the icon component
  const IconComponent = (LucideIcons[icon as keyof typeof LucideIcons] ||
    LucideIcons.User) as LucideIcons.LucideIcon

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClasses.bg,
        colorClasses.text,
        colorClasses.border,
        'font-medium',
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5',
        className
      )}
    >
      {showIcon && (
        <IconComponent
          className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
        />
      )}
      {name}
    </Badge>
  )
}
