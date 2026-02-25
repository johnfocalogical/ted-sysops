import { useNavigate, useParams } from 'react-router-dom'
import { Clock, MapPin, ArrowRight, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { WaitingTask } from '@/lib/automatorInstanceService'

type TaskStatus = 'scheduled' | 'active' | 'due_soon' | 'overdue'

function getTaskStatus(task: WaitingTask): TaskStatus {
  const now = new Date()
  const showAt = task.wait_show_at ? new Date(task.wait_show_at) : null
  const dueAt = task.wait_due_at ? new Date(task.wait_due_at) : null

  if (showAt && now < showAt) return 'scheduled'
  if (dueAt && now > dueAt) return 'overdue'
  if (dueAt) {
    const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntilDue < 24) return 'due_soon'
  }
  return 'active'
}

const statusConfig: Record<TaskStatus, {
  label: string
  badge: string
}> = {
  scheduled: {
    label: 'Scheduled',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
  },
  active: {
    label: 'Active',
    badge: 'bg-primary/10 text-primary border border-primary/30',
  },
  due_soon: {
    label: 'Due Soon',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700',
  },
  overdue: {
    label: 'Overdue',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
  },
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = date.getTime() - now.getTime()
  const absDiffMs = Math.abs(diffMs)
  const isPast = diffMs < 0

  const hours = Math.floor(absDiffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  let label: string
  if (days > 0) {
    label = `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    label = `${hours}h`
  } else {
    label = 'now'
  }

  return isPast ? `${label} ago` : `in ${label}`
}

interface TaskCardProps {
  task: WaitingTask
}

export function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate()
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const status = getTaskStatus(task)
  const config = statusConfig[status]

  // Find the next node after the wait node in the definition
  const nextNodeLabel = (() => {
    if (!task.definition_snapshot || !task.current_node_id) return null
    const edges = task.definition_snapshot.edges ?? []
    const nextEdge = edges.find((e) => e.source === task.current_node_id)
    if (!nextEdge) return null
    const nextNode = (task.definition_snapshot.nodes ?? []).find((n) => n.id === nextEdge.target)
    return nextNode?.data?.label ?? null
  })()

  const handleGoToDeal = () => {
    if (orgId && teamId && task.deal_id) {
      navigate(`/org/${orgId}/team/${teamId}/deals/${task.deal_id}`)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Deal + Automator */}
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">
                {task.deal_address ?? 'Unknown deal'}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {task.automator_name ?? 'Automator'}
              </Badge>
            </div>

            {/* Next step */}
            {nextNodeLabel && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
                <span>Next: <span className="font-medium text-foreground">{nextNodeLabel}</span></span>
              </div>
            )}

            {/* Timing info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {task.wait_show_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Show: {formatRelativeDate(task.wait_show_at)}</span>
                </div>
              )}
              {task.wait_due_at && (
                <div className="flex items-center gap-1">
                  {status === 'overdue' ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  <span>Due: {formatRelativeDate(task.wait_due_at)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={config.badge}>{config.label}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={handleGoToDeal}
            >
              Go to Deal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
