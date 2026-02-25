import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Shield, Clock, AlertTriangle, Calendar, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskCard } from '@/components/transactions/TaskCard'
import {
  getTeamWaitingTasks,
  getTeamScheduledTasks,
} from '@/lib/automatorInstanceService'
import type { WaitingTask } from '@/lib/automatorInstanceService'

export function Transactions() {
  const { teamId } = useParams<{ orgId: string; teamId: string }>()
  const [activeTasks, setActiveTasks] = useState<WaitingTask[]>([])
  const [scheduledTasks, setScheduledTasks] = useState<WaitingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    if (!teamId) return
    setLoading(true)
    setError(null)
    try {
      const [active, scheduled] = await Promise.all([
        getTeamWaitingTasks(teamId),
        getTeamScheduledTasks(teamId),
      ])
      setActiveTasks(active)
      setScheduledTasks(scheduled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Split active tasks into overdue and non-overdue
  const now = new Date()
  const overdueTasks = activeTasks.filter(
    (t) => t.wait_due_at && new Date(t.wait_due_at) < now
  )
  const nonOverdueTasks = activeTasks.filter(
    (t) => !t.wait_due_at || new Date(t.wait_due_at) >= now
  )

  return (
    <div>
      <PageHeader
        title="Transaction Guardian"
        subtitle="Monitor tasks across all deals"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadTasks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" />
            Active
            {nonOverdueTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {nonOverdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled
            {scheduledTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {scheduledTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overdue
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                {overdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="active">
              {nonOverdueTasks.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-8 w-8 text-muted-foreground" />}
                  title="No active tasks"
                  description="Tasks will appear here when they become visible based on their wait schedule."
                />
              ) : (
                <div className="space-y-3">
                  {nonOverdueTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduled">
              {scheduledTasks.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
                  title="No scheduled tasks"
                  description="Upcoming tasks will appear here before their show date arrives."
                />
              ) : (
                <div className="space-y-3">
                  {scheduledTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="overdue">
              {overdueTasks.length === 0 ? (
                <EmptyState
                  icon={<Shield className="h-8 w-8 text-primary" />}
                  title="No overdue tasks"
                  description="All clear. No tasks have passed their due date."
                />
              ) : (
                <div className="space-y-3">
                  {overdueTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  )
}
