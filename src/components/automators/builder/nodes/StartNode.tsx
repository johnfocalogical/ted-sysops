import { memo } from 'react'
import type { NodeProps } from 'reactflow'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES } from './nodeStyles'
import { SourceHandleWithAdd } from './SourceHandleWithAdd'
import type { StartNodeData } from '@/types/automator.types'

export const StartNode = memo(({ id, data, selected }: NodeProps<StartNodeData>) => {
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

      {/* Output Handle with [+] */}
      <SourceHandleWithAdd nodeId={id} handleColor={colors.handle} />
    </div>
  )
})

StartNode.displayName = 'StartNode'
