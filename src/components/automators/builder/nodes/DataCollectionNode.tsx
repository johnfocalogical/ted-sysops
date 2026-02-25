import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import { TriggerBadge } from './TriggerBadge'
import { SourceHandleWithAdd } from './SourceHandleWithAdd'
import type { DataCollectionNodeData } from '@/types/automator.types'

export const DataCollectionNode = memo(({ id, data, selected }: NodeProps<DataCollectionNodeData>) => {
  const colors = NODE_COLORS.dataCollection

  // Compute action summary content
  const fields = data.fields && data.fields.length > 0 ? data.fields : null
  const legacyField = !fields && data.fieldName ? data.fieldName : null
  const backendActionCount = data.actions?.length ?? 0
  const hasContent = fields || legacyField || backendActionCount > 0

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
        <Zap className={cn(NODE_BASE_STYLES.headerIcon, colors.icon)} />
        <span className={NODE_BASE_STYLES.headerLabel}>{data.label}</span>
      </div>

      {/* Content - Action summary */}
      <div className={NODE_BASE_STYLES.content}>
        {!hasContent && (
          <p className="text-xs text-muted-foreground italic">Not configured</p>
        )}

        {/* Input fields summary */}
        {fields && (
          <div className="space-y-0.5">
            {fields.map((f) => (
              <div key={f.field_id} className="flex items-center gap-1.5 text-xs">
                <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                <span className="truncate">{f.label}</span>
                {f.required && (
                  <span className="text-destructive text-[10px]">*</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy single-field fallback */}
        {legacyField && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Field:</span>
            <code className="bg-muted px-1 rounded text-xs">{legacyField}</code>
          </div>
        )}

        {/* Backend actions count */}
        {backendActionCount > 0 && (
          <div className={cn('flex items-center gap-1.5 text-xs mt-1', fields && 'mt-1.5')}>
            <Zap className="h-3 w-3 text-accent" />
            <span className="text-accent font-medium">
              {backendActionCount} backend action{backendActionCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Trigger automator badge */}
      <TriggerBadge actions={data.actions} />

      {/* Output Handle with [+] */}
      <SourceHandleWithAdd nodeId={id} handleColor={colors.handle} />
    </div>
  )
})

DataCollectionNode.displayName = 'DataCollectionNode'
