import { Badge } from '@/components/ui/badge'

interface DepartmentBadgeProps {
  name: string
}

export function DepartmentBadge({ name }: DepartmentBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="text-xs bg-muted/50 text-muted-foreground border-border"
    >
      {name}
    </Badge>
  )
}
