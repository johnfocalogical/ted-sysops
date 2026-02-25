import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ValueSourcePicker } from './ValueSourcePicker'
import type { AddEmployeeParams, DataCollectionField } from '@/types/automator.types'

interface AddEmployeeActionProps {
  params: AddEmployeeParams
  onChange: (params: AddEmployeeParams) => void
  availableFields?: DataCollectionField[]
}

export function AddEmployeeAction({ params, onChange, availableFields }: AddEmployeeActionProps) {
  return (
    <div className="space-y-2">
      <ValueSourcePicker
        label="Employee/User"
        value={params.user_id_source}
        onChange={(user_id_source) => onChange({ ...params, user_id_source })}
        availableFields={availableFields}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Role (optional)</Label>
        <Input
          className="h-8 text-xs"
          value={params.role ?? ''}
          onChange={(e) => onChange({ ...params, role: e.target.value || undefined })}
          placeholder="e.g., acquisitions, runner"
        />
      </div>
    </div>
  )
}
