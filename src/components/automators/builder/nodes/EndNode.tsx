import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { StopCircle, CheckCircle, XCircle, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import type { EndNodeData } from '@/types/automator.types'

const outcomeConfig = {
  success: {
    icon: CheckCircle,
    label: 'Success',
    colors: {
      bg: 'bg-green-500/10',
      border: 'border-green-500',
      icon: 'text-green-500',
      handle: 'bg-green-500',
    },
  },
  failure: {
    icon: XCircle,
    label: 'Failure',
    colors: NODE_COLORS.end,
  },
  cancelled: {
    icon: Ban,
    label: 'Cancelled',
    colors: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500',
      icon: 'text-gray-500',
      handle: 'bg-gray-500',
    },
  },
}

export const EndNode = memo(({ data, selected }: NodeProps<EndNodeData>) => {
  const outcome = data.outcome || 'success'
  const config = outcomeConfig[outcome]
  const Icon = config.icon

  return (
    <div
      className={cn(
        NODE_BASE_STYLES.wrapper,
        config.colors.border,
        selected && NODE_BASE_STYLES.selected
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="default"
        className={cn(HANDLE_STYLES.base, config.colors.handle)}
      />

      {/* Header */}
      <div className={cn(NODE_BASE_STYLES.header, config.colors.bg)}>
        <Icon className={cn(NODE_BASE_STYLES.headerIcon, config.colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content */}
      <div className={NODE_BASE_STYLES.content}>
        <p className={NODE_BASE_STYLES.contentText}>
          {data.description || `Outcome: ${config.label}`}
        </p>
      </div>
    </div>
  )
})

EndNode.displayName = 'EndNode'
