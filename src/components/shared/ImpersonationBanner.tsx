import { useSearchParams, useNavigate } from 'react-router-dom'
import { ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isImpersonating = searchParams.get('impersonate') === 'true'

  if (!isImpersonating) {
    return null
  }

  const handleExit = () => {
    navigate('/admin')
  }

  return (
    <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        <span className="text-sm font-medium">
          Admin View — You are viewing this team as a superadmin
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="text-white hover:text-white hover:bg-purple-700 h-7 px-2"
      >
        <X className="h-4 w-4 mr-1" />
        Exit
      </Button>
    </div>
  )
}
