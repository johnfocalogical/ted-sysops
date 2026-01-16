import { Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ViewOnlyBannerProps {
  className?: string
}

export function ViewOnlyBanner({ className }: ViewOnlyBannerProps) {
  return (
    <Alert className={`bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 ${className || ''}`}>
      <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        You have view-only access to this section. Contact your team admin for edit permissions.
      </AlertDescription>
    </Alert>
  )
}
