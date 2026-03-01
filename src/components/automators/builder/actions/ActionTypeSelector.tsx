import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
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
import { useState } from 'react'
import type { ActionType, AutomatorAction } from '@/types/automator.types'

interface ActionTypeSelectorProps {
  onSelect: (action: AutomatorAction) => void
}

interface ActionOption {
  type: ActionType
  label: string
  description: string
  icon: typeof FileEdit
  defaultParams: AutomatorAction['params']
}

const ACTION_GROUPS: { label: string; actions: ActionOption[] }[] = [
  {
    label: 'Deal Updates',
    actions: [
      {
        type: 'set_deal_field',
        label: 'Set Deal Field',
        description: 'Update a field on the deal',
        icon: FileEdit,
        defaultParams: { target_table: 'deals', target_field: '', value: { source: 'static', value: '' } },
      },
      {
        type: 'set_date_field',
        label: 'Set Date Field',
        description: 'Update a date field',
        icon: Calendar,
        defaultParams: { target_table: 'deals', target_field: '', value: { source: 'today' } },
      },
      {
        type: 'update_deal_status',
        label: 'Update Deal Status',
        description: 'Change the deal pipeline status',
        icon: ArrowRightLeft,
        defaultParams: { status: 'active' },
      },
    ],
  },
  {
    label: 'Records',
    actions: [
      {
        type: 'add_expense',
        label: 'Add Expense',
        description: 'Add an expense record',
        icon: DollarSign,
        defaultParams: {
          category: { source: 'static', value: 'other' },
          amount: { source: 'static', value: 0 },
          description: { source: 'static', value: '' },
        },
      },
      {
        type: 'add_vendor',
        label: 'Add Vendor',
        description: 'Link a vendor to the deal',
        icon: Users,
        defaultParams: { contact_id_source: { source: 'static', value: '' } },
      },
      {
        type: 'add_employee',
        label: 'Add Employee',
        description: 'Link an employee to the deal',
        icon: UserPlus,
        defaultParams: { user_id_source: { source: 'static', value: '' } },
      },
      {
        type: 'create_showing',
        label: 'Create Showing',
        description: 'Schedule a property showing',
        icon: Eye,
        defaultParams: {
          date_source: { source: 'today' },
          time_source: { source: 'static', value: '12:00' },
          buyer_contact_id_source: { source: 'static', value: '' },
        },
      },
    ],
  },
  {
    label: 'Checklist',
    actions: [
      {
        type: 'check_checklist_item',
        label: 'Check Checklist Item',
        description: 'Mark a checklist item complete',
        icon: CheckSquare,
        defaultParams: { checklist_item_key: '' },
      },
    ],
  },
  {
    label: 'Automation',
    actions: [
      {
        type: 'trigger_automator',
        label: 'Trigger Automator',
        description: 'Start a child automator',
        icon: Zap,
        defaultParams: { automator_id: '' },
      },
    ],
  },
  {
    label: 'Communication',
    actions: [
      {
        type: 'send_message',
        label: 'Send Message',
        description: 'Send a message to a conversation',
        icon: MessageSquare,
        defaultParams: {
          target: 'deal_chat',
          message_content: { source: 'static', value: '' },
          include_deal_link: true,
        },
      },
    ],
  },
]

export function ActionTypeSelector({ onSelect }: ActionTypeSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (action: ActionOption) => {
    onSelect({
      action_type: action.type,
      params: action.defaultParams,
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add Action
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {ACTION_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <Separator className="my-1" />}
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </div>
            {group.actions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.type}
                  onClick={() => handleSelect(action)}
                  className="w-full flex items-start gap-2 px-2 py-1.5 rounded-sm hover:bg-accent text-left text-xs"
                >
                  <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                    action.type === 'trigger_automator' || action.type === 'send_message'
                      ? 'text-purple-500'
                      : 'text-primary'
                  }`} />
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-[10px] text-muted-foreground">{action.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
