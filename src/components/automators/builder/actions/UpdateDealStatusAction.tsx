import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UpdateDealStatusParams } from '@/types/automator.types'

interface UpdateDealStatusActionProps {
  params: UpdateDealStatusParams
  onChange: (params: UpdateDealStatusParams) => void
}

const DEAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'for_sale', label: 'For Sale' },
  { value: 'pending_sale', label: 'Pending Sale' },
  { value: 'closed', label: 'Closed' },
  { value: 'funded', label: 'Funded' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'canceled', label: 'Canceled' },
]

export function UpdateDealStatusAction({ params, onChange }: UpdateDealStatusActionProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">New Status</Label>
      <Select value={params.status} onValueChange={(status) => onChange({ status })}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select status..." />
        </SelectTrigger>
        <SelectContent>
          {DEAL_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
