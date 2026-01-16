import { Construction } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ComingSoonProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is currently under development.',
  icon,
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        {icon || <Construction className="h-8 w-8 text-primary" />}
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <Badge className="bg-warning/10 text-warning border border-warning/20">
        <Construction className="h-3 w-3 mr-1" />
        Coming Soon
      </Badge>
    </div>
  )
}
