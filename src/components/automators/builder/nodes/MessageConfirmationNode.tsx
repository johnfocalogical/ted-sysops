import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import { TriggerBadge } from './TriggerBadge'
import { SourceHandleWithAdd } from './SourceHandleWithAdd'
import type { MessageConfirmationNodeData } from '@/types/automator.types'

export const MessageConfirmationNode = memo(({ id, data, selected }: NodeProps<MessageConfirmationNodeData>) => {
  const colors = NODE_COLORS.messageConfirmation

  const promptPreview =
    data.prompt_message?.source === 'static'
      ? String(data.prompt_message.value)
      : data.prompt_message?.source === 'field'
        ? `{${data.prompt_message.field_id}}`
        : ''

  const assigneeLabel =
    data.assignee === 'deal_owner'
      ? 'Deal Owner'
      : data.assignee === 'any_participant'
        ? 'Any Participant'
        : 'Specific User'

  return (
    <div
      className={cn(
        NODE_BASE_STYLES.wrapper,
        colors.border,
        selected && NODE_BASE_STYLES.selected
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="default"
        className={cn(HANDLE_STYLES.base, colors.handle)}
      />

      {/* Header */}
      <div className={cn(NODE_BASE_STYLES.header, colors.bg)}>
        <MessageSquare className={cn(NODE_BASE_STYLES.headerIcon, colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content */}
      <div className={NODE_BASE_STYLES.content}>
        {promptPreview ? (
          <div className="space-y-0.5">
            <p className={cn(NODE_BASE_STYLES.contentText, 'italic')}>
              &ldquo;{promptPreview}&rdquo;
            </p>
            <p className="text-[10px] text-muted-foreground">
              Assignee: <span className="font-medium text-foreground">{assigneeLabel}</span>
            </p>
          </div>
        ) : (
          <p className={NODE_BASE_STYLES.contentText}>Configure confirmation prompt</p>
        )}
      </div>

      {/* Trigger automator badge */}
      <TriggerBadge actions={data.actions} />

      {/* Output Handle with [+] */}
      <SourceHandleWithAdd nodeId={id} handleColor={colors.handle} />
    </div>
  )
})

MessageConfirmationNode.displayName = 'MessageConfirmationNode'
