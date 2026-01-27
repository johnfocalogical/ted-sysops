import { Badge } from '@/components/ui/badge'
import { TypeBadge } from '@/components/shared/TypeBadge'

interface DepartmentBadgeProps {
  name: string
  icon?: string
  color?: string
}

export function DepartmentBadge({ name, icon, color }: DepartmentBadgeProps) {
  if (icon && color) {
    return <TypeBadge name={name} icon={icon} color={color} />
  }

  return (
    <Badge
      variant="outline"
      className="text-xs bg-muted/50 text-muted-foreground border-border"
    >
      {name}
    </Badge>
  )
}
