import { ValueSourcePicker } from './ValueSourcePicker'
import type { CreateShowingParams, DataCollectionField } from '@/types/automator.types'

interface CreateShowingActionProps {
  params: CreateShowingParams
  onChange: (params: CreateShowingParams) => void
  availableFields?: DataCollectionField[]
}

export function CreateShowingAction({ params, onChange, availableFields }: CreateShowingActionProps) {
  return (
    <div className="space-y-2">
      <ValueSourcePicker
        label="Showing Date"
        value={params.date_source}
        onChange={(date_source) => onChange({ ...params, date_source })}
        availableFields={availableFields}
        inputType="date"
      />
      <ValueSourcePicker
        label="Showing Time"
        value={params.time_source}
        onChange={(time_source) => onChange({ ...params, time_source })}
        availableFields={availableFields}
      />
      <ValueSourcePicker
        label="Buyer Contact"
        value={params.buyer_contact_id_source}
        onChange={(buyer_contact_id_source) => onChange({ ...params, buyer_contact_id_source })}
        availableFields={availableFields}
      />
    </div>
  )
}
