import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import {
  FileText,
  Hash,
  Calendar,
  List,
  CheckSquare,
  AlignLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import type { DataCollectionNodeData } from '@/types/automator.types'

const fieldTypeConfig = {
  text: { icon: FileText, label: 'Text' },
  number: { icon: Hash, label: 'Number' },
  date: { icon: Calendar, label: 'Date' },
  select: { icon: List, label: 'Select' },
  multiselect: { icon: CheckSquare, label: 'Multi-select' },
  textarea: { icon: AlignLeft, label: 'Text Area' },
}

export const DataCollectionNode = memo(({ data, selected }: NodeProps<DataCollectionNodeData>) => {
  const colors = NODE_COLORS.dataCollection
  const fieldConfig = fieldTypeConfig[data.fieldType] || fieldTypeConfig.text
  const FieldIcon = fieldConfig.icon

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
        <FieldIcon className={cn(NODE_BASE_STYLES.headerIcon, colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content */}
      <div className={NODE_BASE_STYLES.content}>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Field:</span>
          <code className="bg-muted px-1 rounded text-xs">{data.fieldName}</code>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <span className="text-muted-foreground">Type:</span>
          <span>{fieldConfig.label}</span>
          {data.required && (
            <span className="text-destructive text-[10px]">*Required</span>
          )}
        </div>
      </div>

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

DataCollectionNode.displayName = 'DataCollectionNode'
