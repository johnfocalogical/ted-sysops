import { Play, CheckCircle, XCircle, Workflow } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AutomatorInstanceWithDetails } from '@/types/automator.types'

interface FlowMapInstanceSelectorProps {
  instances: AutomatorInstanceWithDetails[]
  selectedInstanceId: string | null
  onSelect: (instanceId: string) => void
}

const statusConfig: Record<string, {
  icon: typeof Play
  badge: string
  label: string
}> = {
  running: {
    icon: Play,
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700',
    label: 'Running',
  },
  completed: {
    icon: CheckCircle,
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    label: 'Complete',
  },
  canceled: {
    icon: XCircle,
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
    label: 'Canceled',
  },
}

export function FlowMapInstanceSelector({
  instances,
  selectedInstanceId,
  onSelect,
}: FlowMapInstanceSelectorProps) {
  if (instances.length <= 1) return null

  // Group by parent/child relationships
  const parentInstances = instances.filter((i) => !i.parent_instance_id)
  const childrenByParent = new Map<string, AutomatorInstanceWithDetails[]>()
  for (const inst of instances) {
    if (inst.parent_instance_id) {
      const children = childrenByParent.get(inst.parent_instance_id) ?? []
      children.push(inst)
      childrenByParent.set(inst.parent_instance_id, children)
    }
  }

  const renderInstance = (
    instance: AutomatorInstanceWithDetails,
    indent: boolean
  ) => {
    const config = statusConfig[instance.status] ?? statusConfig.running
    const StatusIcon = config.icon
    const isSelected = instance.id === selectedInstanceId

    // Calculate progress
    const totalNodes = instance.definition_snapshot?.nodes?.filter(
      (n) => n.type !== 'start'
    ).length ?? 0
    const children = childrenByParent.get(instance.id)

    return (
      <div key={instance.id}>
        <button
          type="button"
          onClick={() => onSelect(instance.id)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors text-sm',
            indent && 'pl-8',
            isSelected
              ? 'bg-primary/10 border border-primary/30'
              : 'hover:bg-muted/50 border border-transparent'
          )}
        >
          <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', {
            'text-primary': instance.status === 'running',
            'text-green-500': instance.status === 'completed',
            'text-red-500': instance.status === 'canceled',
          })} />
          <span className="truncate flex-1 font-medium text-xs">
            {instance.automator_name ?? 'Automator'}
          </span>
          <Badge className={cn(config.badge, 'text-[10px] h-4 px-1.5')}>
            {config.label}
          </Badge>
          {totalNodes > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {totalNodes} steps
            </span>
          )}
        </button>

        {/* Render children indented */}
        {children?.map((child) => renderInstance(child, true))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <Workflow className="h-3.5 w-3.5" />
        <span className="font-medium uppercase tracking-wider">
          Active Workflows
        </span>
      </div>
      {parentInstances.map((inst) => renderInstance(inst, false))}
      {/* Orphan children (parent not in current list) */}
      {instances
        .filter(
          (i) =>
            i.parent_instance_id &&
            !instances.some((p) => p.id === i.parent_instance_id)
        )
        .map((inst) => renderInstance(inst, false))}
    </div>
  )
}
