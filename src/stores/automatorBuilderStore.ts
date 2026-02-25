import { create } from 'zustand'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow'
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from 'reactflow'
import type {
  Automator,
  AutomatorNode,
  AutomatorEdge,
  AutomatorNodeType,
  AutomatorNodeData,
  AutomatorDefinition,
  Position,
  Viewport,
  ValidationResult,
  StartNodeData,
  EndNodeData,
  DecisionNodeData,
  DataCollectionNodeData,
  WaitNodeData,
} from '@/types/automator.types'
import { getEffectiveOptions } from '@/lib/decisionNodeUtils'

/** Entry in the breadcrumb navigation stack for parent-child drill-down */
export interface BreadcrumbEntry {
  automatorId: string
  automatorName: string
}

/** Source info for the [+] quick-add button on decision node handles or edges */
export interface QuickAddSource {
  nodeId: string
  handleId: string
  screenPos: { x: number; y: number }
  /** Set when [+] is on an edge — triggers splitEdgeAndInsert */
  edgeId?: string
}

interface AutomatorBuilderState {
  // Current automator being edited
  automator: Automator | null

  // React Flow state
  nodes: Node<AutomatorNodeData>[]
  edges: Edge[]
  viewport: Viewport

  // UI state
  selectedNodeId: string | null
  isDirty: boolean
  isSaving: boolean
  validationResult: ValidationResult | null

  // Quick-add from decision node [+] buttons
  quickAddSource: QuickAddSource | null

  // Breadcrumb navigation stack for parent→child drill-down
  breadcrumbStack: BreadcrumbEntry[]

  // Actions
  setAutomator: (automator: Automator) => void
  setNodes: (nodes: Node<AutomatorNodeData>[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: AutomatorNodeType, position: Position) => void
  addNodeAndConnect: (type: AutomatorNodeType, position: Position, sourceNodeId: string, sourceHandleId: string) => void
  splitEdgeAndInsert: (edgeId: string, type: AutomatorNodeType) => void
  updateNodeData: (nodeId: string, data: Partial<AutomatorNodeData>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setViewport: (viewport: Viewport) => void
  setIsDirty: (isDirty: boolean) => void
  setIsSaving: (isSaving: boolean) => void
  setQuickAddSource: (source: QuickAddSource | null) => void
  getDefinition: () => AutomatorDefinition
  pushBreadcrumb: (entry: BreadcrumbEntry) => void
  popBreadcrumb: () => BreadcrumbEntry | undefined
  clearBreadcrumbs: () => void
  reset: () => void
}

// Helper to generate unique IDs
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Default data for each node type
const getDefaultNodeData = (type: AutomatorNodeType): AutomatorNodeData => {
  switch (type) {
    case 'start':
      return {
        type: 'start',
        label: 'Start',
        description: 'Workflow entry point',
      } as StartNodeData
    case 'end':
      return {
        type: 'end',
        label: 'End',
        description: 'Workflow exit point',
        outcome: 'success',
      } as EndNodeData
    case 'decision':
      return {
        type: 'decision',
        label: 'Decision',
        question: 'Enter your question here',
        description: '',
        options: [
          { id: 'option_0', label: 'Yes' },
          { id: 'option_1', label: 'No' },
        ],
      } as DecisionNodeData
    case 'dataCollection':
      return {
        type: 'dataCollection',
        label: 'Action',
        fieldType: 'text',
        fieldName: '',
        required: false,
        description: '',
        fields: [],
      } as DataCollectionNodeData
    case 'wait':
      return {
        type: 'wait',
        label: 'Wait',
        description: '',
        showAfter: { days: 0, hours: 0 },
        dueIn: { days: 0, hours: 0 },
      } as WaitNodeData
    default:
      throw new Error(`Unknown node type: ${type}`)
  }
}

export const useAutomatorBuilderStore = create<AutomatorBuilderState>((set, get) => ({
  // Initial state
  automator: null,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  isDirty: false,
  isSaving: false,
  validationResult: null,
  quickAddSource: null,
  breadcrumbStack: [],

  // Actions
  setAutomator: (automator) => {
    const definition = automator.definition || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }

    // Convert AutomatorNode[] to React Flow Node[]
    const nodes: Node<AutomatorNodeData>[] = definition.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: node.selected,
      dragging: node.dragging,
    }))

    // Convert AutomatorEdge[] to React Flow Edge[]
    const edges: Edge[] = definition.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      type: 'builderEdge',
      animated: edge.animated,
    }))

    set({
      automator,
      nodes,
      edges,
      viewport: definition.viewport,
      isDirty: false,
      selectedNodeId: null,
      validationResult: null,
    })
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    // Filter: only user-initiated changes mark dirty (position, remove, add, reset).
    // Dimension measurements and select toggles from React Flow internals don't count.
    const hasMeaningfulChange = changes.some(
      (c) => c.type !== 'dimensions' && c.type !== 'select'
    )
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      ...(hasMeaningfulChange ? { isDirty: true } : {}),
    })
  },

  onEdgesChange: (changes) => {
    const hasMeaningfulChange = changes.some(
      (c) => c.type !== 'select'
    )
    set({
      edges: applyEdgeChanges(changes, get().edges),
      ...(hasMeaningfulChange ? { isDirty: true } : {}),
    })
  },

  onConnect: (connection) => {
    // Add label for decision node connections by reading options
    const sourceNode = get().nodes.find((n) => n.id === connection.source)
    let label: string | undefined

    if (sourceNode?.type === 'decision') {
      const decData = sourceNode.data as DecisionNodeData
      const options = getEffectiveOptions(decData.options)
      const matched = options.find((o) => o.id === connection.sourceHandle)
      label = matched?.label
    }

    const newEdge: Edge = {
      ...connection,
      id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
      type: 'builderEdge',
      label,
    } as Edge

    set({
      edges: addEdge(newEdge, get().edges),
      isDirty: true,
    })
  },

  addNode: (type, position) => {
    const id = generateId()
    const data = getDefaultNodeData(type)

    const newNode: Node<AutomatorNodeData> = {
      id,
      type,
      position,
      data,
    }

    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
      selectedNodeId: id,
    })
  },

  addNodeAndConnect: (type, position, sourceNodeId, sourceHandleId) => {
    const id = generateId()
    const data = getDefaultNodeData(type)

    const newNode: Node<AutomatorNodeData> = {
      id,
      type,
      position,
      data,
    }

    // Derive edge label from source node options (for decision handles)
    const sourceNode = get().nodes.find((n) => n.id === sourceNodeId)
    let label: string | undefined
    if (sourceNode?.type === 'decision') {
      const decData = sourceNode.data as DecisionNodeData
      const options = getEffectiveOptions(decData.options)
      label = options.find((o) => o.id === sourceHandleId)?.label
    }

    const newEdge: Edge = {
      id: `edge_${sourceNodeId}_${id}_${Date.now()}`,
      source: sourceNodeId,
      target: id,
      sourceHandle: sourceHandleId,
      targetHandle: 'default',
      type: 'builderEdge',
      label,
    }

    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges, newEdge],
      isDirty: true,
      selectedNodeId: id,
    })
  },

  splitEdgeAndInsert: (edgeId, type) => {
    const { nodes, edges } = get()
    const edge = edges.find((e) => e.id === edgeId)
    if (!edge) return

    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)
    if (!sourceNode || !targetNode) return

    // Place new node where the target was; shift target + downstream down
    const NODE_SPACING = 150
    const newX = targetNode.position.x
    const newY = targetNode.position.y

    // Walk downstream from the target to find all nodes that need to shift
    const downstreamIds = new Set<string>()
    const queue = [targetNode.id]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (downstreamIds.has(current)) continue
      downstreamIds.add(current)
      for (const e of edges) {
        if (e.source === current && !downstreamIds.has(e.target)) {
          queue.push(e.target)
        }
      }
    }

    // Shift all downstream nodes (including the target) down
    const shiftedNodes = nodes.map((n) => {
      if (downstreamIds.has(n.id)) {
        return { ...n, position: { x: n.position.x, y: n.position.y + NODE_SPACING } }
      }
      return n
    })

    const newId = generateId()
    const data = getDefaultNodeData(type)

    const newNode: Node<AutomatorNodeData> = {
      id: newId,
      type,
      position: { x: newX, y: newY },
      data,
    }

    // Remove original edge, create two new ones
    const newEdges = edges.filter((e) => e.id !== edgeId)

    // Source → new node (preserve original label on this edge)
    newEdges.push({
      id: `edge_${edge.source}_${newId}_${Date.now()}`,
      source: edge.source,
      target: newId,
      sourceHandle: edge.sourceHandle,
      targetHandle: 'default',
      type: 'builderEdge',
      label: edge.label,
    } as Edge)

    // New node → target
    newEdges.push({
      id: `edge_${newId}_${edge.target}_${Date.now()}`,
      source: newId,
      target: edge.target,
      sourceHandle: 'default',
      targetHandle: edge.targetHandle ?? 'default',
      type: 'builderEdge',
    } as Edge)

    set({
      nodes: [...shiftedNodes, newNode],
      edges: newEdges,
      isDirty: true,
      selectedNodeId: newId,
    })
  },

  updateNodeData: (nodeId, data) => {
    const updatedNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } as AutomatorNodeData }
        : node
    )

    // If decision options changed, sync edge labels & remove orphaned edges
    let updatedEdges = get().edges
    if ('options' in data) {
      const node = updatedNodes.find((n) => n.id === nodeId)
      if (node?.type === 'decision') {
        const decData = node.data as DecisionNodeData
        const options = getEffectiveOptions(decData.options)
        const validHandleIds = new Set(options.map((o) => o.id))

        updatedEdges = updatedEdges
          // Remove edges whose sourceHandle no longer exists on this node
          .filter(
            (e) =>
              e.source !== nodeId || !e.sourceHandle || validHandleIds.has(e.sourceHandle)
          )
          // Update labels on remaining edges to match new option labels
          .map((e) => {
            if (e.source !== nodeId || !e.sourceHandle) return e
            const opt = options.find((o) => o.id === e.sourceHandle)
            if (opt && e.label !== opt.label) {
              return { ...e, label: opt.label }
            }
            return e
          })
      }
    }

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      isDirty: true,
    })
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      isDirty: true,
    })
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setViewport: (viewport) => set({ viewport }),

  setIsDirty: (isDirty) => set({ isDirty }),

  setIsSaving: (isSaving) => set({ isSaving }),

  setQuickAddSource: (source) => set({ quickAddSource: source }),

  getDefinition: (): AutomatorDefinition => {
    const { nodes, edges, viewport } = get()

    // Convert React Flow nodes back to AutomatorNode[]
    const automatorNodes: AutomatorNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type as AutomatorNodeType,
      position: node.position,
      data: node.data,
    }))

    // Convert React Flow edges back to AutomatorEdge[]
    // Normalize 'builderEdge' back to 'smoothstep' for storage
    const automatorEdges: AutomatorEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label as string | undefined,
      type: (edge.type === 'builderEdge' ? 'smoothstep' : edge.type) as 'default' | 'smoothstep' | 'step' | undefined,
      animated: edge.animated,
    }))

    return {
      nodes: automatorNodes,
      edges: automatorEdges,
      viewport,
    }
  },

  pushBreadcrumb: (entry) => {
    set({ breadcrumbStack: [...get().breadcrumbStack, entry] })
  },

  popBreadcrumb: () => {
    const stack = [...get().breadcrumbStack]
    const popped = stack.pop()
    set({ breadcrumbStack: stack })
    return popped
  },

  clearBreadcrumbs: () => {
    set({ breadcrumbStack: [] })
  },

  reset: () => {
    set({
      automator: null,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeId: null,
      isDirty: false,
      isSaving: false,
      validationResult: null,
      quickAddSource: null,
      breadcrumbStack: [],
    })
  },
}))
