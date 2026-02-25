import { Zap } from 'lucide-react'
import type { AutomatorAction, TriggerAutomatorParams } from '@/types/automator.types'

/**
 * Small badge shown on builder nodes that have a trigger_automator action.
 * Indicates this node will spawn a child automator when executed.
 */
export function TriggerBadge({ actions }: { actions?: AutomatorAction[] }) {
  if (!actions || actions.length === 0) return null

  const triggerActions = actions.filter((a) => a.action_type === 'trigger_automator')
  if (triggerActions.length === 0) return null

  const firstTrigger = triggerActions[0].params as TriggerAutomatorParams
  const hasTarget = !!firstTrigger.automator_id

  return (
    <div className="px-3 py-1 border-t border-border/50">
      <div
        className={`flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 ${
          hasTarget
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}
      >
        <Zap className="h-2.5 w-2.5" />
        <span className="truncate">
          {hasTarget ? 'Triggers child automator' : 'Trigger not configured'}
        </span>
      </div>
    </div>
  )
}
