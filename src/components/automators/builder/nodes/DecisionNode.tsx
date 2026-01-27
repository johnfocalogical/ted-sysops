import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import type { DecisionNodeData } from '@/types/automator.types'

export const DecisionNode = memo(({ data, selected }: NodeProps<DecisionNodeData>) => {
  const colors = NODE_COLORS.decision

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
        <HelpCircle className={cn(NODE_BASE_STYLES.headerIcon, colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content - Question */}
      <div className={NODE_BASE_STYLES.content}>
        <p className="text-sm font-medium line-clamp-2">{data.question}</p>
      </div>

      {/* Output Handles - Yes (right) and No (bottom) */}
      <div className="relative h-6">
        {/* Yes Handle - Right side */}
        <Handle
          type="source"
          position={Position.Right}
          id="yes"
          className={cn(HANDLE_STYLES.base, 'bg-green-500', 'absolute top-1/2 -translate-y-1/2')}
        />
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-medium text-green-600">
          Yes
        </span>

        {/* No Handle - Bottom side */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="no"
          className={cn(HANDLE_STYLES.base, 'bg-red-500')}
        />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-[10px] font-medium text-red-600">
          No
        </span>
      </div>
    </div>
  )
})

DecisionNode.displayName = 'DecisionNode'
