import { supabase } from './supabase'
import type {
  AutomatorInstance,
  AutomatorInstanceStep,
  AutomatorInstanceWithDetails,
  AutomatorNode,
  AutomatorDefinition,
  ExecuteStepResult,
  InstanceProgress,
  Automator,
} from '@/types/automator.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================================================
// Instance Lifecycle
// ============================================================================

/**
 * Start a new automator instance on a deal by calling the
 * `start_automator_instance` Postgres RPC function.
 */
export async function startAutomatorInstance(
  teamId: string,
  dealId: string,
  automatorId: string
): Promise<ExecuteStepResult> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('start_automator_instance', {
    p_team_id: teamId,
    p_deal_id: dealId,
    p_automator_id: automatorId,
    p_started_by: user.id,
  })

  if (error) throw error
  return data as ExecuteStepResult
}

/**
 * Execute (advance) a step in a running automator instance by calling the
 * `execute_automator_step` Postgres RPC function.
 */
export async function executeStep(
  instanceId: string,
  nodeId: string,
  response?: Record<string, unknown>,
  branchTaken?: string
): Promise<ExecuteStepResult> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('execute_automator_step', {
    p_instance_id: instanceId,
    p_node_id: nodeId,
    p_user_id: user.id,
    p_response: response ?? null,
    p_branch_taken: branchTaken ?? null,
  })

  if (error) throw error
  return data as ExecuteStepResult
}

/**
 * Cancel a running automator instance.
 */
export async function cancelInstance(instanceId: string): Promise<AutomatorInstance> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instances')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      current_node_id: null,
    })
    .eq('id', instanceId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// Instance Queries
// ============================================================================

/**
 * Get all automator instances for a deal, with automator name joined.
 * Orders: running first, then completed, then canceled.
 */
export async function getInstancesForDeal(
  dealId: string
): Promise<AutomatorInstanceWithDetails[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instances')
    .select(`
      *,
      automator:automators!automator_id(name, description)
    `)
    .eq('deal_id', dealId)
    .order('status', { ascending: true }) // canceled, completed, running — we re-sort below

  if (error) throw error

  const instances: AutomatorInstanceWithDetails[] = (data || []).map((row: Record<string, unknown>) => {
    const automator = row.automator as { name: string; description: string | null } | null
    return {
      ...row,
      automator_name: automator?.name,
      automator_description: automator?.description ?? null,
    } as AutomatorInstanceWithDetails
  })

  // Custom sort: running first, then completed, then canceled
  const statusOrder: Record<string, number> = { running: 0, completed: 1, canceled: 2 }
  instances.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))

  return instances
}

/**
 * Fetch a single automator instance with its definition_snapshot and
 * completed steps (joined from automator_instance_steps).
 */
export async function getInstance(instanceId: string): Promise<
  (AutomatorInstance & { steps: AutomatorInstanceStep[] }) | null
> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instances')
    .select(`
      *,
      steps:automator_instance_steps(*)
    `)
    .eq('id', instanceId)
    .order('completed_at', { referencedTable: 'automator_instance_steps', ascending: true })
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data as AutomatorInstance & { steps: AutomatorInstanceStep[] }
}

/**
 * Fetch all steps for an automator instance, ordered by completed_at ascending.
 */
export async function getInstanceSteps(
  instanceId: string
): Promise<AutomatorInstanceStep[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instance_steps')
    .select('*')
    .eq('instance_id', instanceId)
    .order('completed_at', { ascending: true })

  if (error) throw error
  return data || []
}

// ============================================================================
// Wait / Scheduled Task Queries (Transaction Guardian)
// ============================================================================

/** Task info returned for Transaction Guardian views */
export interface WaitingTask extends AutomatorInstanceWithDetails {
  deal_address?: string
  deal_status?: string
}

/**
 * Get instances paused on wait nodes where show_at has passed (visible tasks).
 * These are "active" tasks the user should act on.
 */
export async function getTeamWaitingTasks(
  teamId: string
): Promise<WaitingTask[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instances')
    .select(`
      *,
      automator:automators!automator_id(name, description),
      deal:deals!deal_id(address, status)
    `)
    .eq('team_id', teamId)
    .eq('status', 'running')
    .not('wait_show_at', 'is', null)
    .lte('wait_show_at', new Date().toISOString())
    .order('wait_due_at', { ascending: true })

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => {
    const automator = row.automator as { name: string; description: string | null } | null
    const deal = row.deal as { address: string; status: string } | null
    return {
      ...row,
      automator_name: automator?.name,
      automator_description: automator?.description ?? null,
      deal_address: deal?.address,
      deal_status: deal?.status,
    } as WaitingTask
  })
}

/**
 * Get instances paused on wait nodes where show_at is in the future (scheduled tasks).
 * These are "upcoming" tasks not yet visible to the user.
 */
export async function getTeamScheduledTasks(
  teamId: string
): Promise<WaitingTask[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instances')
    .select(`
      *,
      automator:automators!automator_id(name, description),
      deal:deals!deal_id(address, status)
    `)
    .eq('team_id', teamId)
    .eq('status', 'running')
    .not('wait_show_at', 'is', null)
    .gt('wait_show_at', new Date().toISOString())
    .order('wait_show_at', { ascending: true })

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => {
    const automator = row.automator as { name: string; description: string | null } | null
    const deal = row.deal as { address: string; status: string } | null
    return {
      ...row,
      automator_name: automator?.name,
      automator_description: automator?.description ?? null,
      deal_address: deal?.address,
      deal_status: deal?.status,
    } as WaitingTask
  })
}

// ============================================================================
// Published Automators (for "Start Automator" selector)
// ============================================================================

/**
 * Get all published automators for a team. Returns basic info for the
 * "Start Automator" selector including node count.
 */
export async function getPublishedAutomators(
  teamId: string
): Promise<Array<Pick<Automator, 'id' | 'name' | 'description'> & { node_count: number }>> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automators')
    .select('id, name, description, definition')
    .eq('team_id', teamId)
    .eq('status', 'published')
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []).map((row: { id: string; name: string; description: string | null; definition: AutomatorDefinition }) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    node_count: row.definition?.nodes?.length ?? 0,
  }))
}

// ============================================================================
// Progress Calculations
// ============================================================================

/**
 * Calculate progress for a single automator instance.
 * Completed steps / total interactive nodes (all nodes minus start nodes).
 * Uses the definition_snapshot frozen at instance start time.
 */
export async function getInstanceProgress(
  instanceId: string
): Promise<InstanceProgress> {
  if (!supabase) throw new Error('Supabase not configured')

  const instance = await getInstance(instanceId)
  if (!instance) throw new Error('Instance not found')

  const definition = instance.definition_snapshot
  // Total interactive nodes = all nodes minus start nodes
  const totalInteractiveNodes = (definition?.nodes ?? []).filter(
    (node: AutomatorNode) => node.type !== 'start'
  ).length

  const completedSteps = instance.steps?.length ?? 0

  const total = Math.max(totalInteractiveNodes, 1)
  const completed = Math.min(completedSteps, total)
  const percentage = Math.round((completed / total) * 100)

  return { completed, total, percentage }
}

/**
 * Aggregate progress across ALL active (non-canceled) instances on a deal.
 * Returns overall TPT (Total Process Throughput) percentage.
 */
export async function getDealTPT(dealId: string): Promise<number> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automator_instances')
    .select(`
      id,
      status,
      definition_snapshot,
      steps:automator_instance_steps(id)
    `)
    .eq('deal_id', dealId)
    .neq('status', 'canceled')

  if (error) throw error

  if (!data || data.length === 0) return 0

  let totalNodes = 0
  let totalCompleted = 0

  for (const instance of data) {
    const definition = instance.definition_snapshot as AutomatorDefinition | null
    const interactiveNodes = (definition?.nodes ?? []).filter(
      (node: AutomatorNode) => node.type !== 'start'
    ).length

    const completedSteps = (instance.steps as unknown[] | null)?.length ?? 0

    totalNodes += interactiveNodes
    totalCompleted += Math.min(completedSteps, interactiveNodes)
  }

  if (totalNodes === 0) return 0
  return Math.round((totalCompleted / totalNodes) * 100)
}

// ============================================================================
// Realtime Subscriptions
// ============================================================================

/**
 * Subscribe to realtime updates for automator instances on a specific deal.
 * Fires callback on INSERT and UPDATE events.
 * Returns an unsubscribe function.
 */
export function subscribeToInstanceUpdates(
  dealId: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE'
    new: AutomatorInstance
    old: Partial<AutomatorInstance>
  }) => void
): () => void {
  if (!supabase) throw new Error('Supabase not configured')

  const channel: RealtimeChannel = supabase
    .channel(`automator-instances-deal-${dealId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'automator_instances',
        filter: `deal_id=eq.${dealId}`,
      },
      (payload) => {
        callback({
          eventType: 'INSERT',
          new: payload.new as AutomatorInstance,
          old: payload.old as Partial<AutomatorInstance>,
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'automator_instances',
        filter: `deal_id=eq.${dealId}`,
      },
      (payload) => {
        callback({
          eventType: 'UPDATE',
          new: payload.new as AutomatorInstance,
          old: payload.old as Partial<AutomatorInstance>,
        })
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase!.removeChannel(channel)
  }
}
