import {
  GitBranch,
  Flag,
  Play,
  CheckCircle,
  Zap,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type {
  AutomatorInstanceStep,
  AutomatorDefinition,
  ActionExecutionLog,
} from '@/types/automator.types'

// ============================================================================
// Helpers
// ============================================================================

function getNodeLabel(
  nodeId: string,
  definition: AutomatorDefinition | null
): string {
  if (!definition) return nodeId
  const node = definition.nodes.find((n) => n.id === nodeId)
  return node?.data?.label ?? nodeId
}

function getNodeTypeIcon(nodeType: string) {
  switch (nodeType) {
    case 'start':
      return Play
    case 'decision':
      return GitBranch
    case 'dataCollection':
      return Zap
    case 'wait':
      return Clock
    case 'end':
      return Flag
    default:
      return CheckCircle
  }
}

function formatStepTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatResponseSummary(
  step: AutomatorInstanceStep
): string | null {
  if (step.branch_taken) return `Chose: ${step.branch_taken}`
  if (step.user_response) {
    const entries = Object.entries(step.user_response)
    if (entries.length === 0) return null
    if (entries.length === 1) {
      const [, value] = entries[0]
      return String(value)
    }
    return `${entries.length} fields submitted`
  }
  return null
}

function ActionResultBadge({ log }: { log: ActionExecutionLog }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs ${
              log.success
                ? 'text-green-600 border-green-300 dark:text-green-400 dark:border-green-700'
                : 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-700'
            }`}
          >
            <Zap className="h-3 w-3 mr-1" />
            {log.action_type.replace(/_/g, ' ')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {log.success ? 'Succeeded' : `Failed: ${log.error ?? 'Unknown error'}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// StepHistory
// ============================================================================

interface StepHistoryProps {
  steps: AutomatorInstanceStep[]
  definition: AutomatorDefinition | null
}

export function StepHistory({ steps, definition }: StepHistoryProps) {
  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = getNodeTypeIcon(step.node_type)
          const label = getNodeLabel(step.node_id, definition)
          const responseSummary = formatResponseSummary(step)
          const actions = step.actions_executed ?? []

          return (
            <div key={step.id} className="relative flex gap-3 pl-1">
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shrink-0">
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatStepTime(step.completed_at)}
                  </span>
                </div>

                {responseSummary && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {responseSummary}
                  </p>
                )}

                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {actions.map((action, actionIdx) => (
                      <ActionResultBadge key={actionIdx} log={action} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
