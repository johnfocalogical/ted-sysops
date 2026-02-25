import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { CheckChecklistItemParams } from '@/types/automator.types'

interface CheckChecklistItemActionProps {
  params: CheckChecklistItemParams
  onChange: (params: CheckChecklistItemParams) => void
}

export function CheckChecklistItemAction({ params, onChange }: CheckChecklistItemActionProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Checklist Item Key</Label>
      <Input
        className="h-8 text-xs"
        value={params.checklist_item_key}
        onChange={(e) => onChange({ ...params, checklist_item_key: e.target.value })}
        placeholder="e.g., title_ordered"
      />
      <p className="text-[10px] text-muted-foreground">
        Machine-readable key matching the checklist item
      </p>
    </div>
  )
}
