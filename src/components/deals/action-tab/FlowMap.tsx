import { useMemo, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow'
import type { Node, Edge, NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'

import { FlowMapNode } from './FlowMapNode'
import type { FlowMapNodeData, FlowMapNodeState } from './FlowMapNode'
import type {
  AutomatorInstance,
  AutomatorInstanceStep,
  AutomatorDefinition,
  AutomatorEdge,
  AutomatorNode as AutomatorNodeDef,
  DecisionNodeData,
} from '@/types/automator.types'
import { getEffectiveOptions } from '@/lib/decisionNodeUtils'

// ============================================================================
// Node types — must be declared outside component for React Flow stability
// ============================================================================

const nodeTypes: NodeTypes = {
  start: FlowMapNode,
  end: FlowMapNode,
  decision: FlowMapNode,
  dataCollection: FlowMapNode,
  wait: FlowMapNode,
}

// ============================================================================
// Graph traversal — determine skipped vs pending nodes
// ============================================================================

/**
 * Walk the completed steps to determine which branches were taken at
 * decision nodes. Then compute reachability from the start node using
 * only taken branches. Nodes reachable only through untaken branches
 * are "skipped". Nodes reachable through taken branches but not yet
 * completed are "pending".
 */
function computeNodeStates(
  definition: AutomatorDefinition,
  completedSteps: AutomatorInstanceStep[],
  currentNodeId: string | null,
  instanceStatus: string
): Map<string, FlowMapNodeState> {
  const states = new Map<string, FlowMapNodeState>()
  const completedNodeIds = new Set(completedSteps.map((s) => s.node_id))

  // Build edge adjacency map
  const edges = definition.edges ?? []
  const outgoingEdges = new Map<string, AutomatorEdge[]>()
  for (const edge of edges) {
    const list = outgoingEdges.get(edge.source) ?? []
    list.push(edge)
    outgoingEdges.set(edge.source, list)
  }

  // Build a lookup from node ID → options for decision nodes
  const decisionNodeMap = new Map<string, AutomatorNodeDef>()
  for (const node of definition.nodes) {
    if (node.type === 'decision') {
      decisionNodeMap.set(node.id, node)
    }
  }

  // Determine which branch was taken at each decision node
  const branchesTaken = new Map<string, string>() // nodeId -> sourceHandle taken
  for (const step of completedSteps) {
    if (step.branch_taken && step.node_type === 'decision') {
      const decNode = decisionNodeMap.get(step.node_id)
      const options = getEffectiveOptions(
        decNode ? (decNode.data as DecisionNodeData).options : undefined
      )
      // Match branch_taken label to option ID (handle)
      const matched = options.find(
        (o) => o.label === step.branch_taken || o.id === step.branch_taken
      )
      const handle = matched?.id ?? step.branch_taken.toLowerCase()
      branchesTaken.set(step.node_id, handle)
    }
  }

  // BFS from start node following only taken branches
  const reachable = new Set<string>()
  const startNode = definition.nodes.find((n) => n.type === 'start')
  if (!startNode) {
    // No start node — mark everything as pending
    for (const node of definition.nodes) {
      states.set(node.id, 'pending')
    }
    return states
  }

  const queue: string[] = [startNode.id]
  reachable.add(startNode.id)

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const outEdges = outgoingEdges.get(nodeId) ?? []

    // If this is a decision node with a branch taken, only follow that branch
    const takenHandle = branchesTaken.get(nodeId)

    for (const edge of outEdges) {
      // For decision nodes where we know the branch taken, only follow that edge
      if (takenHandle && edge.sourceHandle) {
        if (edge.sourceHandle !== takenHandle) continue
      }

      if (!reachable.has(edge.target)) {
        reachable.add(edge.target)
        queue.push(edge.target)
      }
    }

    // If this is a decision node that hasn't been completed yet (pending),
    // we don't know which branch will be taken, so follow all edges
    if (!takenHandle && !completedNodeIds.has(nodeId)) {
      for (const edge of outEdges) {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target)
          queue.push(edge.target)
        }
      }
    }
  }

  // Assign states
  for (const node of definition.nodes) {
    if (completedNodeIds.has(node.id)) {
      states.set(node.id, 'completed')
    } else if (node.id === currentNodeId && instanceStatus === 'running') {
      states.set(node.id, 'active')
    } else if (reachable.has(node.id)) {
      states.set(node.id, 'pending')
    } else {
      states.set(node.id, 'skipped')
    }
  }

  // Start node is always completed if any steps exist, or active if none
  if (startNode) {
    if (completedSteps.length > 0 || instanceStatus !== 'running') {
      states.set(startNode.id, 'completed')
    } else {
      states.set(startNode.id, 'active')
    }
  }

  return states
}

/**
 * Format a step response for tooltip display.
 */
function getStepResponseSummary(step: AutomatorInstanceStep): string | undefined {
  if (step.branch_taken) return `Chose: ${step.branch_taken}`
  if (step.user_response) {
    const entries = Object.entries(step.user_response)
    if (entries.length === 0) return undefined
    if (entries.length === 1) return String(entries[0][1])
    return `${entries.length} fields submitted`
  }
  return undefined
}

// ============================================================================
// FlowMap Component
// ============================================================================

interface FlowMapProps {
  instance: AutomatorInstance
  completedSteps: AutomatorInstanceStep[]
  onNodeClick?: (nodeId: string, state: FlowMapNodeState) => void
}

function FlowMapInner({ instance, completedSteps, onNodeClick }: FlowMapProps) {
  const definition = instance.definition_snapshot

  // Compute node states
  const nodeStates = useMemo(
    () =>
      computeNodeStates(
        definition,
        completedSteps,
        instance.current_node_id,
        instance.status
      ),
    [definition, completedSteps, instance.current_node_id, instance.status]
  )

  // Build step lookup for tooltips
  const stepByNodeId = useMemo(() => {
    const map = new Map<string, AutomatorInstanceStep>()
    for (const step of completedSteps) {
      map.set(step.node_id, step)
    }
    return map
  }, [completedSteps])

  // Convert definition nodes to React Flow nodes with state data
  const flowNodes: Node<FlowMapNodeData>[] = useMemo(() => {
    return definition.nodes.map((node) => {
      const state = nodeStates.get(node.id) ?? 'pending'
      const step = stepByNodeId.get(node.id)

      const flowData: FlowMapNodeData = {
        label: node.data.label,
        description: node.data.description,
        type: node.type,
        nodeState: state,
        stepInfo: step
          ? {
              completedAt: step.completed_at,
              responseSummary: getStepResponseSummary(step),
            }
          : undefined,
        question: node.type === 'decision' ? (node.data as DecisionNodeData).question : undefined,
        options: node.type === 'decision' ? (node.data as DecisionNodeData).options : undefined,
        outcome: node.type === 'end' ? (node.data as { outcome?: string }).outcome : undefined,
      }

      return {
        id: node.id,
        type: node.type, // All types map to FlowMapNode via nodeTypes
        position: node.position,
        data: flowData,
        selectable: false,
        draggable: false,
      }
    })
  }, [definition.nodes, nodeStates, stepByNodeId])

  // Convert edges
  const flowEdges: Edge[] = useMemo(() => {
    return definition.edges.map((edge) => {
      const sourceState = nodeStates.get(edge.source) ?? 'pending'
      const targetState = nodeStates.get(edge.target) ?? 'pending'
      const isCompleted = sourceState === 'completed' && targetState === 'completed'
      const isActive = sourceState === 'completed' && targetState === 'active'
      const isSkipped = sourceState === 'skipped' || targetState === 'skipped'

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        type: 'smoothstep' as const,
        animated: isActive,
        style: {
          stroke: isCompleted
            ? '#22c55e'
            : isActive
            ? '#00d2af'
            : isSkipped
            ? '#d1d5db'
            : '#9ca3af',
          strokeWidth: isActive ? 2.5 : isCompleted ? 2 : 1.5,
          opacity: isSkipped ? 0.3 : 1,
          strokeDasharray: isSkipped ? '5 5' : undefined,
        },
      }
    })
  }, [definition.edges, nodeStates])

  // Handle node clicks
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<FlowMapNodeData>) => {
      if (onNodeClick) {
        onNodeClick(node.id, node.data.nodeState)
      }
    },
    [onNodeClick]
  )

  return (
    <div className="h-[300px] border rounded-lg bg-muted/20 overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnDoubleClick={false}
        preventScrolling={false}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls
          showInteractiveButton={false}
          className="!bg-card !border-border !shadow-sm"
        />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const state = (node.data as FlowMapNodeData)?.nodeState
            if (state === 'completed') return '#22c55e'
            if (state === 'active') return '#00d2af'
            if (state === 'skipped') return '#d1d5db'
            return '#9ca3af'
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="!bg-card !border-border"
        />
      </ReactFlow>
    </div>
  )
}

// Wrap in provider for independent React Flow context
export function FlowMap(props: FlowMapProps) {
  return (
    <ReactFlowProvider>
      <FlowMapInner {...props} />
    </ReactFlowProvider>
  )
}
