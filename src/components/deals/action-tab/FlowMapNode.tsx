import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import {
  Play,
  HelpCircle,
  Zap,
  Flag,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getEffectiveOptions, getOptionHandleColor } from '@/lib/decisionNodeUtils'
import type { DecisionOption } from '@/types/automator.types'

// ============================================================================
// Node State Types
// ============================================================================

export type FlowMapNodeState = 'completed' | 'active' | 'pending' | 'skipped'

export interface FlowMapNodeData {
  label: string
  description?: string
  type: 'start' | 'end' | 'decision' | 'dataCollection' | 'wait'
  /** Progress state for this node in the flow map */
  nodeState: FlowMapNodeState
  /** Completed step info (for tooltip) */
  stepInfo?: {
    completedBy?: string
    completedAt?: string
    responseSummary?: string
  }
  /** For decision nodes */
  question?: string
  /** Decision branch options (passed through for dynamic handles) */
  options?: DecisionOption[]
  /** For end nodes */
  outcome?: string
}

// ============================================================================
// Node Icons
// ============================================================================

const nodeTypeIcons: Record<string, typeof Play> = {
  start: Play,
  end: Flag,
  decision: HelpCircle,
  dataCollection: Zap,
  wait: Clock,
}

// ============================================================================
// Style Config
// ============================================================================

const stateStyles: Record<FlowMapNodeState, {
  wrapper: string
  opacity: string
  border: string
}> = {
  completed: {
    wrapper: 'bg-green-50 dark:bg-green-950/30',
    opacity: 'opacity-85',
    border: 'border-green-500',
  },
  active: {
    wrapper: 'bg-card',
    opacity: '',
    border: 'border-primary animate-pulse',
  },
  pending: {
    wrapper: 'bg-card',
    opacity: 'opacity-60',
    border: 'border-border',
  },
  skipped: {
    wrapper: 'bg-card',
    opacity: 'opacity-30',
    border: 'border-dashed border-border',
  },
}

const nodeTypeColors: Record<string, string> = {
  start: 'bg-green-500/10',
  end: 'bg-red-500/10',
  decision: 'bg-accent/10',
  dataCollection: 'bg-primary/10',
  wait: 'bg-amber-500/10',
}

const nodeTypeIconColors: Record<string, string> = {
  start: 'text-green-500',
  end: 'text-red-500',
  decision: 'text-accent',
  dataCollection: 'text-primary',
  wait: 'text-amber-500',
}

const handleColors: Record<string, string> = {
  start: 'bg-green-500',
  end: 'bg-red-500',
  decision: 'bg-accent',
  dataCollection: 'bg-primary',
  wait: 'bg-amber-500',
}

// ============================================================================
// Node Content
// ============================================================================

function NodeContent({ data }: { data: FlowMapNodeData }) {
  if (data.type === 'decision' && data.question) {
    return <p className="text-xs text-muted-foreground line-clamp-2">{data.question}</p>
  }
  if (data.description) {
    return <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
  }
  return null
}

// ============================================================================
// Completed Step Tooltip
// ============================================================================

function CompletedTooltipContent({ stepInfo }: { stepInfo: FlowMapNodeData['stepInfo'] }) {
  if (!stepInfo) return null

  return (
    <div className="text-xs space-y-1 max-w-[200px]">
      {stepInfo.completedAt && (
        <p className="text-muted-foreground">
          {new Date(stepInfo.completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
      {stepInfo.responseSummary && (
        <p className="font-medium">{stepInfo.responseSummary}</p>
      )}
    </div>
  )
}

// ============================================================================
// Main FlowMapNode
// ============================================================================

export const FlowMapNode = memo(({ data }: NodeProps<FlowMapNodeData>) => {
  const Icon = nodeTypeIcons[data.type] ?? Zap
  const state = data.nodeState ?? 'pending'
  const styles = stateStyles[state]
  const headerBg = nodeTypeColors[data.type] ?? 'bg-muted'
  const iconColor = nodeTypeIconColors[data.type] ?? 'text-muted-foreground'
  const handleColor = handleColors[data.type] ?? 'bg-muted-foreground'

  const isDecision = data.type === 'decision'
  const isStart = data.type === 'start'

  const nodeContent = (
    <div
      className={cn(
        'rounded-lg border-2 bg-card shadow-sm min-w-[160px] max-w-[220px] cursor-default',
        styles.border,
        styles.opacity,
        styles.wrapper
      )}
    >
      {/* Target Handle (not on start) */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          id="default"
          className={cn('w-2.5 h-2.5 rounded-full border-2 border-background', handleColor)}
        />
      )}

      {/* Header */}
      <div className={cn('flex items-center gap-2 px-2.5 py-1.5 border-b', headerBg)}>
        <Icon className={cn('w-4 h-4', iconColor)} />
        <span className="font-medium text-xs truncate">{data.label}</span>
        {/* Completed checkmark overlay */}
        {state === 'completed' && (
          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 ml-auto" />
        )}
        {/* Active indicator */}
        {state === 'active' && (
          <span className="h-2 w-2 rounded-full bg-primary shrink-0 ml-auto animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="px-2.5 py-1.5">
        <NodeContent data={data} />
      </div>

      {/* Source Handle(s) */}
      {isDecision ? (
        <div className="flex items-end justify-evenly px-1.5 pb-1.5 pt-0.5 gap-0.5">
          {getEffectiveOptions(data.options).map((opt, idx, arr) => {
            const color = getOptionHandleColor(idx, arr.length)
            return (
              <div key={opt.id} className="flex flex-col items-center gap-0 relative">
                <span className={cn('text-[8px] font-medium leading-tight', color.text)}>
                  {opt.label}
                </span>
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={opt.id}
                  className={cn('w-2.5 h-2.5 rounded-full border-2 border-background', color.dot)}
                  style={{ position: 'relative', transform: 'none' }}
                />
              </div>
            )
          })}
        </div>
      ) : data.type !== 'end' ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className={cn('w-2.5 h-2.5 rounded-full border-2 border-background', handleColor)}
        />
      ) : null}
    </div>
  )

  // Wrap completed nodes with tooltip
  if (state === 'completed' && data.stepInfo) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
          <TooltipContent>
            <CompletedTooltipContent stepInfo={data.stepInfo} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Wrap skipped/pending with tooltip
  if (state === 'skipped') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Path not taken</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return nodeContent
})

FlowMapNode.displayName = 'FlowMapNode'
