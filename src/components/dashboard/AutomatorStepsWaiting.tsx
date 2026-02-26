import { useState, useEffect } from 'react'
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

interface WaitingStep {
  instance_id: string
  deal_id: string
  deal_address: string
  automator_name: string
  current_step_label: string
  waiting_since: string
}

interface AutomatorStepsWaitingProps {
  teamId: string
  userId: string
  onDealClick: (dealId: string) => void
  onContinueClick: (dealId: string, instanceId: string) => void
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return `${days}d`
}

export function AutomatorStepsWaiting({
  teamId,
  userId,
  onDealClick,
  onContinueClick,
}: AutomatorStepsWaitingProps) {
  const [steps, setSteps] = useState<WaitingStep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // Get running automator instances on user's deals
        const { data, error } = await supabase
          .from('automator_instances')
          .select(`
            id,
            deal_id,
            current_node_id,
            definition_snapshot,
            created_at,
            deal:deals!inner (
              id,
              address,
              owner_id,
              transaction_coordinator_id
            )
          `)
          .eq('team_id', teamId)
          .eq('status', 'running')
          .not('current_node_id', 'is', null)
          .order('created_at', { ascending: true })

        if (error) throw error
        if (cancelled) return

        const waiting: WaitingStep[] = []
        for (const instance of data || []) {
          const deal = instance.deal as unknown as {
            id: string
            address: string
            owner_id: string
            transaction_coordinator_id: string | null
          }

          // Only show for user's deals
          if (deal.owner_id !== userId && deal.transaction_coordinator_id !== userId) continue

          // Extract step label from definition snapshot
          const snapshot = instance.definition_snapshot as { nodes?: Array<{ id: string; data?: { label?: string } }>; name?: string } | null
          const nodes = snapshot?.nodes ?? []
          const currentNode = nodes.find((n) => n.id === instance.current_node_id)
          const stepLabel = currentNode?.data?.label ?? 'Current Step'
          const automatorName = snapshot?.name ?? 'Automator'

          waiting.push({
            instance_id: instance.id,
            deal_id: deal.id,
            deal_address: deal.address,
            automator_name: automatorName,
            current_step_label: stepLabel,
            waiting_since: instance.created_at,
          })
        }

        if (!cancelled) setSteps(waiting)
      } catch {
        // Graceful degradation — table might not exist or query might fail
        if (!cancelled) setSteps([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [teamId, userId])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-500" />
          <CardTitle className="text-base">Waiting For You</CardTitle>
          {!loading && steps.length > 0 && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700">
              {steps.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto text-purple-400 mb-2" />
            <p className="text-sm text-muted-foreground">No steps waiting — all caught up.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {steps.map((step) => (
              <div
                key={step.instance_id}
                className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onDealClick(step.deal_id)}
                    className="text-sm font-medium text-primary hover:underline truncate block"
                  >
                    {step.deal_address}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.automator_name} — {step.current_step_label}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {relativeTime(step.waiting_since)}
                </span>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs shrink-0"
                  onClick={() => onContinueClick(step.deal_id, step.instance_id)}
                >
                  Continue
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
