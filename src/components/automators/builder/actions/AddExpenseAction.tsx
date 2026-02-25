import { ValueSourcePicker } from './ValueSourcePicker'
import type { AddExpenseParams, DataCollectionField } from '@/types/automator.types'

interface AddExpenseActionProps {
  params: AddExpenseParams
  onChange: (params: AddExpenseParams) => void
  availableFields?: DataCollectionField[]
}

export function AddExpenseAction({ params, onChange, availableFields }: AddExpenseActionProps) {
  return (
    <div className="space-y-2">
      <ValueSourcePicker
        label="Category"
        value={params.category}
        onChange={(category) => onChange({ ...params, category })}
        availableFields={availableFields}
      />
      <ValueSourcePicker
        label="Amount"
        value={params.amount}
        onChange={(amount) => onChange({ ...params, amount })}
        availableFields={availableFields}
        inputType="number"
      />
      <ValueSourcePicker
        label="Description"
        value={params.description}
        onChange={(description) => onChange({ ...params, description })}
        availableFields={availableFields}
      />
    </div>
  )
}
