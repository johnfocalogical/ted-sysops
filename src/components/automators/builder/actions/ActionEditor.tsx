import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  FileEdit,
  Calendar,
  CheckSquare,
  DollarSign,
  Users,
  UserPlus,
  Eye,
  ArrowRightLeft,
  Zap,
  MessageSquare,
} from 'lucide-react'
import { ActionTypeSelector } from './ActionTypeSelector'
import { SetDealFieldAction } from './SetDealFieldAction'
import { SetDateFieldAction } from './SetDateFieldAction'
import { CheckChecklistItemAction } from './CheckChecklistItemAction'
import { AddExpenseAction } from './AddExpenseAction'
import { AddVendorAction } from './AddVendorAction'
import { AddEmployeeAction } from './AddEmployeeAction'
import { CreateShowingAction } from './CreateShowingAction'
import { UpdateDealStatusAction } from './UpdateDealStatusAction'
import { TriggerAutomatorAction } from './TriggerAutomatorAction'
import { SendMessageAction } from './SendMessageAction'
import type {
  AutomatorAction,
  ActionType,
  DataCollectionField,
  SetDealFieldParams,
  SetDateFieldParams,
  CheckChecklistItemParams,
  AddExpenseParams,
  AddVendorParams,
  AddEmployeeParams,
  CreateShowingParams,
  UpdateDealStatusParams,
  TriggerAutomatorParams,
  SendMessageActionParams,
} from '@/types/automator.types'

interface ActionEditorProps {
  actions: AutomatorAction[]
  onChange: (actions: AutomatorAction[]) => void
  /** Available fields from data collection nodes for ValueSourcePicker */
  availableFields?: DataCollectionField[]
}

const ACTION_META: Record<ActionType, { label: string; icon: typeof FileEdit; color: string }> = {
  set_deal_field: { label: 'Set Deal Field', icon: FileEdit, color: 'border-l-primary' },
  set_date_field: { label: 'Set Date Field', icon: Calendar, color: 'border-l-primary' },
  check_checklist_item: { label: 'Check Checklist Item', icon: CheckSquare, color: 'border-l-green-500' },
  add_expense: { label: 'Add Expense', icon: DollarSign, color: 'border-l-amber-500' },
  add_vendor: { label: 'Add Vendor', icon: Users, color: 'border-l-blue-500' },
  add_employee: { label: 'Add Employee', icon: UserPlus, color: 'border-l-blue-500' },
  create_showing: { label: 'Create Showing', icon: Eye, color: 'border-l-blue-500' },
  update_deal_status: { label: 'Update Deal Status', icon: ArrowRightLeft, color: 'border-l-primary' },
  trigger_automator: { label: 'Trigger Automator', icon: Zap, color: 'border-l-purple-500' },
  send_message: { label: 'Send Message', icon: MessageSquare, color: 'border-l-purple-500' },
}

export function ActionEditor({ actions, onChange, availableFields = [] }: ActionEditorProps) {
  const handleAdd = useCallback(
    (action: AutomatorAction) => {
      onChange([...actions, action])
    },
    [actions, onChange]
  )

  const handleRemove = useCallback(
    (index: number) => {
      onChange(actions.filter((_, i) => i !== index))
    },
    [actions, onChange]
  )

  const handleUpdate = useCallback(
    (index: number, params: AutomatorAction['params']) => {
      const updated = [...actions]
      updated[index] = { ...updated[index], params }
      onChange(updated)
    },
    [actions, onChange]
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const updated = [...actions]
      ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
      onChange(updated)
    },
    [actions, onChange]
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === actions.length - 1) return
      const updated = [...actions]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
      onChange(updated)
    },
    [actions, onChange]
  )

  return (
    <div className="space-y-2">
      {actions.map((action, index) => {
        const meta = ACTION_META[action.action_type]
        const Icon = meta.icon

        return (
          <Card
            key={index}
            className={`border-l-2 ${meta.color} p-2 space-y-2`}
          >
            {/* Action header */}
            <div className="flex items-center gap-1">
              <div className="flex flex-col -space-y-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0"
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === actions.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0"
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <Icon className={`h-3.5 w-3.5 shrink-0 ${
                action.action_type === 'trigger_automator' || action.action_type === 'send_message'
                  ? 'text-purple-500'
                  : 'text-primary'
              }`} />
              <span className="text-xs font-medium flex-1">{meta.label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>

            <Separator />

            {/* Action-specific config form */}
            {action.action_type === 'set_deal_field' && (
              <SetDealFieldAction
                params={action.params as SetDealFieldParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
            {action.action_type === 'set_date_field' && (
              <SetDateFieldAction
                params={action.params as SetDateFieldParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
            {action.action_type === 'check_checklist_item' && (
              <CheckChecklistItemAction
                params={action.params as CheckChecklistItemParams}
                onChange={(params) => handleUpdate(index, params)}
              />
            )}
            {action.action_type === 'add_expense' && (
              <AddExpenseAction
                params={action.params as AddExpenseParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
            {action.action_type === 'add_vendor' && (
              <AddVendorAction
                params={action.params as AddVendorParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
            {action.action_type === 'add_employee' && (
              <AddEmployeeAction
                params={action.params as AddEmployeeParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
            {action.action_type === 'create_showing' && (
              <CreateShowingAction
                params={action.params as CreateShowingParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
            {action.action_type === 'update_deal_status' && (
              <UpdateDealStatusAction
                params={action.params as UpdateDealStatusParams}
                onChange={(params) => handleUpdate(index, params)}
              />
            )}
            {action.action_type === 'trigger_automator' && (
              <TriggerAutomatorAction
                params={action.params as TriggerAutomatorParams}
                onChange={(params) => handleUpdate(index, params)}
              />
            )}
            {action.action_type === 'send_message' && (
              <SendMessageAction
                params={action.params as SendMessageActionParams}
                onChange={(params) => handleUpdate(index, params)}
                availableFields={availableFields}
              />
            )}
          </Card>
        )
      })}

      <ActionTypeSelector onSelect={handleAdd} />
    </div>
  )
}
