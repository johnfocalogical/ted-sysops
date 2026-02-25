import { useState, useEffect, useCallback } from 'react'
import { Zap, Loader2, Map, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { StartAutomatorDialog } from './StartAutomatorDialog'
import { InstanceList } from './InstanceList'
import { StepInteractionPanel } from './StepInteractionPanel'
import { FlowMap } from './FlowMap'
import { FlowMapInstanceSelector } from './FlowMapInstanceSelector'
import type { FlowMapNodeState } from './FlowMapNode'
import {
  getInstancesForDeal,
  getInstance,
  executeStep,
  startAutomatorInstance,
  cancelInstance,
  subscribeToInstanceUpdates,
} from '@/lib/automatorInstanceService'
import type {
  AutomatorInstanceWithDetails,
  AutomatorInstance,
  AutomatorInstanceStep,
  AutomatorNode,
  ExecuteStepResult,
} from '@/types/automator.types'

type ViewMode = 'flow' | 'list'

interface ActionTabProps {
  dealId: string
  teamId: string
}

export function ActionTab({ dealId, teamId }: ActionTabProps) {
  const [instances, setInstances] = useState<AutomatorInstanceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [startingInstance, setStartingInstance] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('flow')

  // Active instance state
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null)
  const [activeInstance, setActiveInstance] = useState<
    (AutomatorInstance & { steps: AutomatorInstanceStep[] }) | null
  >(null)
  const [currentNode, setCurrentNode] = useState<AutomatorNode | null>(null)
  const [executingStep, setExecutingStep] = useState(false)

  // Load instances for this deal
  const loadInstances = useCallback(async () => {
    try {
      const data = await getInstancesForDeal(dealId)
      setInstances(data)
    } catch (err) {
      console.error('Error loading automator instances:', err)
      toast.error('Failed to load automator instances')
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    loadInstances()
  }, [loadInstances])

  // Subscribe to realtime instance updates
  useEffect(() => {
    const unsubscribe = subscribeToInstanceUpdates(dealId, () => {
      loadInstances()
    })
    return unsubscribe
  }, [dealId, loadInstances])

  // Load active instance details when selected
  useEffect(() => {
    if (!activeInstanceId) {
      setActiveInstance(null)
      setCurrentNode(null)
      return
    }

    const loadInstance = async () => {
      try {
        const data = await getInstance(activeInstanceId)
        if (data) {
          setActiveInstance(data)
          // Find the current node in the definition snapshot
          if (data.current_node_id && data.definition_snapshot) {
            const node = data.definition_snapshot.nodes.find(
              (n) => n.id === data.current_node_id
            )
            setCurrentNode(node ?? null)
          } else {
            setCurrentNode(null)
          }
        }
      } catch (err) {
        console.error('Error loading instance details:', err)
      }
    }

    loadInstance()
  }, [activeInstanceId])

  // Auto-select the first running instance
  useEffect(() => {
    if (!activeInstanceId && instances.length > 0) {
      const running = instances.find((i) => i.status === 'running')
      if (running) {
        setActiveInstanceId(running.id)
      }
    }
  }, [instances, activeInstanceId])

  // Start a new automator instance
  const handleStartAutomator = useCallback(
    async (automatorId: string) => {
      setStartingInstance(true)
      try {
        const result: ExecuteStepResult = await startAutomatorInstance(
          teamId,
          dealId,
          automatorId
        )
        toast.success('Automator started')
        setShowStartDialog(false)
        setActiveInstanceId(result.instance.id)
        await loadInstances()
      } catch (err) {
        console.error('Error starting automator:', err)
        toast.error(
          err instanceof Error ? err.message : 'Failed to start automator'
        )
      } finally {
        setStartingInstance(false)
      }
    },
    [teamId, dealId, loadInstances]
  )

  // Execute a step (advance the workflow)
  const handleExecuteStep = useCallback(
    async (
      nodeId: string,
      response?: Record<string, unknown>,
      branchTaken?: string
    ) => {
      if (!activeInstanceId) return

      setExecutingStep(true)
      try {
        const result = await executeStep(
          activeInstanceId,
          nodeId,
          response,
          branchTaken
        )

        // Update local state with the result
        if (result.next_node) {
          setCurrentNode(result.next_node)
        } else {
          setCurrentNode(null)
        }

        // Reload instance to get updated steps
        const updatedInstance = await getInstance(activeInstanceId)
        if (updatedInstance) {
          setActiveInstance(updatedInstance)
        }

        // Reload instances list (status may have changed)
        await loadInstances()

        if (result.instance.status === 'completed') {
          toast.success('Automator completed')
          setActiveInstanceId(null)
        }
      } catch (err) {
        console.error('Error executing step:', err)
        toast.error(
          err instanceof Error ? err.message : 'Failed to execute step'
        )
      } finally {
        setExecutingStep(false)
      }
    },
    [activeInstanceId, loadInstances]
  )

  // Cancel an instance
  const handleCancelInstance = useCallback(
    async (instanceId: string) => {
      try {
        await cancelInstance(instanceId)
        toast.success('Automator canceled')
        if (activeInstanceId === instanceId) {
          setActiveInstanceId(null)
        }
        await loadInstances()
      } catch (err) {
        console.error('Error canceling instance:', err)
        toast.error('Failed to cancel automator')
      }
    },
    [activeInstanceId, loadInstances]
  )

  // Handle flow map node click — navigate to step interaction for active node
  const handleFlowMapNodeClick = useCallback(
    (_nodeId: string, state: FlowMapNodeState) => {
      if (state === 'active') {
        // Scroll to the step interaction panel (it's rendered below the flow map)
        const panel = document.getElementById('step-interaction-panel')
        if (panel) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    },
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasInstances = instances.length > 0

  return (
    <div className="space-y-6">
      {/* Header: Start Automator + View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Automators</h3>
          <p className="text-sm text-muted-foreground">
            Run automated workflows on this deal
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle (only shown when instances exist) */}
          {hasInstances && (
            <div className="flex items-center border rounded-md">
              <button
                type="button"
                className={`px-2.5 py-1.5 text-xs flex items-center gap-1 rounded-l-md transition-colors ${
                  viewMode === 'flow'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setViewMode('flow')}
              >
                <Map className="h-3.5 w-3.5" />
                Flow
              </button>
              <button
                type="button"
                className={`px-2.5 py-1.5 text-xs flex items-center gap-1 rounded-r-md border-l transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
            </div>
          )}
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => setShowStartDialog(true)}
          >
            <Zap className="mr-2 h-4 w-4" />
            Start Automator
          </Button>
        </div>
      </div>

      {/* Flow Map View */}
      {viewMode === 'flow' && hasInstances && (
        <div className="space-y-3">
          {/* Instance selector (when multiple instances) */}
          <FlowMapInstanceSelector
            instances={instances}
            selectedInstanceId={activeInstanceId}
            onSelect={setActiveInstanceId}
          />

          {/* Flow map canvas */}
          {activeInstance && (
            <FlowMap
              instance={activeInstance}
              completedSteps={activeInstance.steps ?? []}
              onNodeClick={handleFlowMapNodeClick}
            />
          )}
        </div>
      )}

      {/* Active Step Interaction */}
      {activeInstance && currentNode && (
        <div id="step-interaction-panel">
          <StepInteractionPanel
            instance={activeInstance}
            currentNode={currentNode}
            completedSteps={activeInstance.steps ?? []}
            onExecuteStep={handleExecuteStep}
            isExecuting={executingStep}
          />
        </div>
      )}

      {/* Instance List (always in list view, or when flow view selected as secondary) */}
      {(viewMode === 'list' || !hasInstances) && (
        <InstanceList
          instances={instances}
          activeInstanceId={activeInstanceId}
          onSelectInstance={setActiveInstanceId}
          onCancelInstance={handleCancelInstance}
        />
      )}

      {/* Start Automator Dialog */}
      <StartAutomatorDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        teamId={teamId}
        onStart={handleStartAutomator}
        isStarting={startingInstance}
      />
    </div>
  )
}
