import { memo, useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { HelpCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_COLORS, NODE_BASE_STYLES, HANDLE_STYLES } from './nodeStyles'
import { TriggerBadge } from './TriggerBadge'
import { getEffectiveOptions, getOptionHandleColor } from '@/lib/decisionNodeUtils'
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import type { DecisionNodeData } from '@/types/automator.types'

export const DecisionNode = memo(({ id, data, selected }: NodeProps<DecisionNodeData>) => {
  const colors = NODE_COLORS.decision
  const options = getEffectiveOptions(data.options)

  // Subscribe to the raw edges array (referentially stable from Zustand)
  // and derive connected handles via useMemo to avoid infinite re-render loops
  const edges = useAutomatorBuilderStore((state) => state.edges)
  const connectedHandles = useMemo(() => {
    const set = new Set<string>()
    for (const e of edges) {
      if (e.source === id && e.sourceHandle) set.add(e.sourceHandle)
    }
    return set
  }, [edges, id])

  const setQuickAddSource = useAutomatorBuilderStore((s) => s.setQuickAddSource)

  const handlePlusClick = (
    e: React.MouseEvent,
    handleId: string
  ) => {
    e.stopPropagation()
    setQuickAddSource({
      nodeId: id,
      handleId,
      screenPos: { x: e.clientX, y: e.clientY },
    })
  }

  return (
    <div
      className={cn(
        NODE_BASE_STYLES.wrapper,
        colors.border,
        selected && NODE_BASE_STYLES.selected
      )}
      style={{ minWidth: Math.max(180, options.length * 60) }}
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

      {/* Trigger automator badge */}
      <TriggerBadge actions={data.actions} />

      {/* Output Handles - dynamic options along the bottom */}
      <div className="flex items-end justify-evenly px-2 pb-2 pt-1 gap-1">
        {options.map((opt, idx) => {
          const color = getOptionHandleColor(idx, options.length)
          const isConnected = connectedHandles.has(opt.id)
          return (
            <div key={opt.id} className="flex flex-col items-center gap-0.5 relative">
              <span className={cn('text-[10px] font-medium leading-tight', color.text)}>
                {opt.label}
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={opt.id}
                className={cn(HANDLE_STYLES.base, color.dot)}
                style={{ position: 'relative', transform: 'none' }}
              />
              {/* Quick-add [+] button for unconnected handles */}
              {!isConnected && (
                <button
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-sm z-10"
                  onClick={(e) => handlePlusClick(e, opt.id)}
                  title={`Add node to "${opt.label}"`}
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

DecisionNode.displayName = 'DecisionNode'
