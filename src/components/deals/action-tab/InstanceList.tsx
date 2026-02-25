import { useState } from 'react'
import {
  Play,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StepHistory } from './StepHistory'
import { getInstanceSteps } from '@/lib/automatorInstanceService'
import type {
  AutomatorInstanceWithDetails,
  AutomatorInstanceStep,
} from '@/types/automator.types'

// ============================================================================
// Status Badge
// ============================================================================

function InstanceStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    running:
      'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-300 dark:border-teal-700',
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700',
    canceled:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700',
  }

  const labels: Record<string, string> = {
    running: 'Running',
    completed: 'Complete',
    canceled: 'Canceled',
  }

  return (
    <Badge className={config[status] ?? config.running}>
      {labels[status] ?? status}
    </Badge>
  )
}

// ============================================================================
// Single Instance Row
// ============================================================================

function InstanceRow({
  instance,
  isActive,
  onSelect,
  onCancel,
}: {
  instance: AutomatorInstanceWithDetails
  isActive: boolean
  onSelect: () => void
  onCancel: (instanceId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [steps, setSteps] = useState<AutomatorInstanceStep[] | null>(null)
  const [loadingSteps, setLoadingSteps] = useState(false)

  const handleToggleHistory = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (!steps) {
      setLoadingSteps(true)
      try {
        const data = await getInstanceSteps(instance.id)
        setSteps(data)
      } catch (err) {
        console.error('Error loading steps:', err)
      } finally {
        setLoadingSteps(false)
      }
    }
  }

  // Calculate progress from definition snapshot
  const totalNodes =
    instance.definition_snapshot?.nodes?.filter((n) => n.type !== 'start')
      .length ?? 0

  const isRunning = instance.status === 'running'
  const isCompleted = instance.status === 'completed'
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Status icon */}
          {isRunning && <Play className="h-4 w-4 text-primary shrink-0" />}
          {isCompleted && (
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          )}
          {instance.status === 'canceled' && (
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {instance.automator_name ?? 'Automator'}
              </span>
              <InstanceStatusBadge status={instance.status} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isRunning && (
                <span>Step progress: {totalNodes} total steps</span>
              )}
              {isCompleted && (
                <span>Completed {formatDate(instance.completed_at)}</span>
              )}
              {instance.status === 'canceled' && (
                <span>Canceled {formatDate(instance.canceled_at)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Continue / Select button */}
          {isRunning && !isActive && (
            <Button size="sm" onClick={onSelect} className="bg-primary hover:bg-primary/90">
              Continue
            </Button>
          )}
          {isRunning && isActive && (
            <Badge variant="outline" className="text-xs text-primary border-primary">
              Active
            </Badge>
          )}

          {/* Cancel button for running instances */}
          {isRunning && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Automator?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop the automator at its current step. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Running</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => onCancel(instance.id)}
                  >
                    Cancel Automator
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* History toggle for completed/canceled */}
          {!isRunning && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleHistory}
              className="text-muted-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Step History */}
      {expanded && (
        <div className="border-t px-3 py-2">
          {loadingSteps ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : steps && steps.length > 0 ? (
            <StepHistory
              steps={steps}
              definition={instance.definition_snapshot}
            />
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              No steps recorded.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Instance List
// ============================================================================

interface InstanceListProps {
  instances: AutomatorInstanceWithDetails[]
  activeInstanceId: string | null
  onSelectInstance: (id: string) => void
  onCancelInstance: (id: string) => void
}

export function InstanceList({
  instances,
  activeInstanceId,
  onSelectInstance,
  onCancelInstance,
}: InstanceListProps) {
  if (instances.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Workflow className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No automators have been run on this deal yet.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Click "Start Automator" to begin a workflow.
          </p>
        </CardContent>
      </Card>
    )
  }

  const running = instances.filter((i) => i.status === 'running')
  const completed = instances.filter((i) => i.status === 'completed')
  const canceled = instances.filter((i) => i.status === 'canceled')

  return (
    <div className="space-y-4">
      {/* Running Instances */}
      {running.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Running
          </h4>
          {running.map((instance) => (
            <InstanceRow
              key={instance.id}
              instance={instance}
              isActive={instance.id === activeInstanceId}
              onSelect={() => onSelectInstance(instance.id)}
              onCancel={onCancelInstance}
            />
          ))}
        </div>
      )}

      {/* Completed Instances */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Completed
          </h4>
          {completed.map((instance) => (
            <InstanceRow
              key={instance.id}
              instance={instance}
              isActive={false}
              onSelect={() => onSelectInstance(instance.id)}
              onCancel={onCancelInstance}
            />
          ))}
        </div>
      )}

      {/* Canceled Instances */}
      {canceled.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Canceled
          </h4>
          {canceled.map((instance) => (
            <InstanceRow
              key={instance.id}
              instance={instance}
              isActive={false}
              onSelect={() => onSelectInstance(instance.id)}
              onCancel={onCancelInstance}
            />
          ))}
        </div>
      )}
    </div>
  )
}
