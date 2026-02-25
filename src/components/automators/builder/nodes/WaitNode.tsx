import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import { TriggerBadge } from './TriggerBadge'
import { SourceHandleWithAdd } from './SourceHandleWithAdd'
import type { WaitNodeData } from '@/types/automator.types'
import { formatDuration } from '@/types/automator.types'

export const WaitNode = memo(({ id, data, selected }: NodeProps<WaitNodeData>) => {
  const colors = NODE_COLORS.wait
  const showAfter = data.showAfter ?? { days: 0, hours: 0 }
  const dueIn = data.dueIn ?? { days: 0, hours: 0 }
  const hasDelay = showAfter.days > 0 || showAfter.hours > 0 || dueIn.days > 0 || dueIn.hours > 0

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
        <Clock className={cn(NODE_BASE_STYLES.headerIcon, colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content */}
      <div className={NODE_BASE_STYLES.content}>
        {hasDelay ? (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              Show after: <span className="font-medium text-foreground">{formatDuration(showAfter)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Due in: <span className="font-medium text-foreground">{formatDuration(dueIn)}</span>
            </p>
          </div>
        ) : (
          <p className={NODE_BASE_STYLES.contentText}>No delay configured</p>
        )}
      </div>

      {/* Trigger automator badge */}
      <TriggerBadge actions={data.actions} />

      {/* Output Handle with [+] */}
      <SourceHandleWithAdd nodeId={id} handleColor={colors.handle} />
    </div>
  )
})

WaitNode.displayName = 'WaitNode'
