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
} from '@/types/automator.types'

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

  // Actions
  setAutomator: (automator: Automator) => void
  setNodes: (nodes: Node<AutomatorNodeData>[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: AutomatorNodeType, position: Position) => void
  updateNodeData: (nodeId: string, data: Partial<AutomatorNodeData>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setViewport: (viewport: Viewport) => void
  setIsDirty: (isDirty: boolean) => void
  setIsSaving: (isSaving: boolean) => void
  getDefinition: () => AutomatorDefinition
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
      } as DecisionNodeData
    case 'dataCollection':
      return {
        type: 'dataCollection',
        label: 'Collect Data',
        fieldType: 'text',
        fieldName: 'field_name',
        required: true,
        description: '',
      } as DataCollectionNodeData
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
      type: edge.type || 'smoothstep',
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
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    })
  },

  onConnect: (connection) => {
    // Add label for decision node connections
    const sourceNode = get().nodes.find((n) => n.id === connection.source)
    let label: string | undefined

    if (sourceNode?.type === 'decision') {
      label = connection.sourceHandle === 'yes' ? 'Yes' : 'No'
    }

    const newEdge: Edge = {
      ...connection,
      id: `edge_${connection.source}_${connection.target}_${Date.now()}`,
      type: 'smoothstep',
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

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } as AutomatorNodeData }
          : node
      ),
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
    const automatorEdges: AutomatorEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label as string | undefined,
      type: edge.type as 'default' | 'smoothstep' | 'step' | undefined,
      animated: edge.animated,
    }))

    return {
      nodes: automatorNodes,
      edges: automatorEdges,
      viewport,
    }
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
    })
  },
}))
