import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import type { StartNodeData } from '@/types/automator.types'

export const StartNode = memo(({ data, selected }: NodeProps<StartNodeData>) => {
  const colors = NODE_COLORS.start

  return (
    <div
      className={cn(
        NODE_BASE_STYLES.wrapper,
        colors.border,
        selected && NODE_BASE_STYLES.selected
      )}
    >
      {/* Header */}
      <div className={cn(NODE_BASE_STYLES.header, colors.bg)}>
        <Play className={cn(NODE_BASE_STYLES.headerIcon, colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content */}
      {data.description && (
        <div className={NODE_BASE_STYLES.content}>
          <p className={NODE_BASE_STYLES.contentText}>{data.description}</p>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className={cn(HANDLE_STYLES.base, colors.handle)}
      />
    </div>
  )
})

StartNode.displayName = 'StartNode'
