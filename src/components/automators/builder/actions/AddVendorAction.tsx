import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ValueSourcePicker } from './ValueSourcePicker'
import type { AddVendorParams, DataCollectionField } from '@/types/automator.types'

interface AddVendorActionProps {
  params: AddVendorParams
  onChange: (params: AddVendorParams) => void
  availableFields?: DataCollectionField[]
}

export function AddVendorAction({ params, onChange, availableFields }: AddVendorActionProps) {
  return (
    <div className="space-y-2">
      <ValueSourcePicker
        label="Contact"
        value={params.contact_id_source}
        onChange={(contact_id_source) => onChange({ ...params, contact_id_source })}
        availableFields={availableFields}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Role (optional)</Label>
        <Input
          className="h-8 text-xs"
          value={params.role ?? ''}
          onChange={(e) => onChange({ ...params, role: e.target.value || undefined })}
          placeholder="e.g., title_company, inspector"
        />
      </div>
    </div>
  )
}
