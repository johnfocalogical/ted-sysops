import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow'
import type { ReactFlowInstance, Connection, NodeTypes, EdgeTypes, Node, OnConnectStartParams } from 'reactflow'
import 'reactflow/dist/style.css'

import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import { StartNode } from './nodes/StartNode'
import { EndNode } from './nodes/EndNode'
import { DecisionNode } from './nodes/DecisionNode'
import { DataCollectionNode } from './nodes/DataCollectionNode'
import { WaitNode } from './nodes/WaitNode'
import { MessageConfirmationNode } from './nodes/MessageConfirmationNode'
import { BuilderEdge } from './edges/BuilderEdge'
import { QuickAddMenu } from './QuickAddMenu'
import type { AutomatorNodeType } from '@/types/automator.types'

// Register custom node types - MUST be outside component to prevent re-renders
const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  dataCollection: DataCollectionNode,
  wait: WaitNode,
  messageConfirmation: MessageConfirmationNode,
}

// Register custom edge types - MUST be outside component to prevent re-renders
const edgeTypes: EdgeTypes = {
  builderEdge: BuilderEdge,
}

// Static config objects - MUST be outside component
const defaultEdgeOptions = {
  type: 'builderEdge' as const,
  animated: false,
}
const fitViewOptions = { padding: 0.2 }
const snapGrid: [number, number] = [15, 15]
const deleteKeyCode = ['Backspace', 'Delete']
const multiSelectionKeyCode = ['Control', 'Meta']

interface AutomatorCanvasProps {
  onNodeSelect?: (nodeId: string | null) => void
}

/** Shared shape for the quick-add menu state across all trigger sources */
interface QuickAddState {
  screenPos: { x: number; y: number }
  flowPos: { x: number; y: number }
  sourceNodeId: string
  sourceHandleId: string
  /** When set, the menu was triggered from an edge [+] button */
  edgeId?: string
}

function AutomatorCanvasInner({ onNodeSelect }: AutomatorCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  const nodes = useAutomatorBuilderStore((state) => state.nodes)
  const edges = useAutomatorBuilderStore((state) => state.edges)
  const onNodesChange = useAutomatorBuilderStore((state) => state.onNodesChange)
  const onEdgesChange = useAutomatorBuilderStore((state) => state.onEdgesChange)
  const onConnect = useAutomatorBuilderStore((state) => state.onConnect)
  const addNode = useAutomatorBuilderStore((state) => state.addNode)
  const addNodeAndConnect = useAutomatorBuilderStore((state) => state.addNodeAndConnect)
  const splitEdgeAndInsert = useAutomatorBuilderStore((state) => state.splitEdgeAndInsert)
  const selectNode = useAutomatorBuilderStore((state) => state.selectNode)

  // Store-driven quick-add (from node [+] buttons)
  const quickAddSource = useAutomatorBuilderStore((state) => state.quickAddSource)
  const setQuickAddSource = useAutomatorBuilderStore((state) => state.setQuickAddSource)

  // Local quick-add state — unified for drag-from-handle and edge [+] button
  const [localQuickAdd, setLocalQuickAdd] = useState<QuickAddState | null>(null)

  // Track the in-progress connection start info
  const connectStartRef = useRef<OnConnectStartParams | null>(null)

  // Listen for custom event from BuilderEdge [+] buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const { edgeId, clientX, clientY } = (e as CustomEvent).detail
      if (!reactFlowWrapper.current || !reactFlowInstance.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const screenPos = { x: clientX - bounds.left, y: clientY - bounds.top }
      const flowPos = reactFlowInstance.current.screenToFlowPosition(screenPos)

      setLocalQuickAdd({
        screenPos,
        flowPos,
        sourceNodeId: '',
        sourceHandleId: '',
        edgeId,
      })
    }
    window.addEventListener('builder-edge-add', handler)
    return () => window.removeEventListener('builder-edge-add', handler)
  }, [])

  // Merge all quick-add sources into a single active value
  const activeQuickAdd = useMemo((): QuickAddState | null => {
    // Local state (drag-from-handle or edge [+]) takes priority
    if (localQuickAdd) return localQuickAdd

    // Store-driven (node [+] buttons)
    if (quickAddSource && reactFlowWrapper.current && reactFlowInstance.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const screenPos = {
        x: quickAddSource.screenPos.x - bounds.left,
        y: quickAddSource.screenPos.y - bounds.top,
      }

      const sourceNode = nodes.find((n) => n.id === quickAddSource.nodeId)
      let flowPos: { x: number; y: number }
      if (sourceNode) {
        flowPos = {
          x: sourceNode.position.x,
          y: sourceNode.position.y + 200,
        }
      } else {
        flowPos = reactFlowInstance.current.screenToFlowPosition(screenPos)
      }

      return {
        screenPos,
        flowPos,
        sourceNodeId: quickAddSource.nodeId,
        sourceHandleId: quickAddSource.handleId,
      }
    }

    return null
  }, [localQuickAdd, quickAddSource, nodes])

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance
  }, [])

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection)
    },
    [onConnect]
  )

  const handleConnectStart = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
      connectStartRef.current = params
    },
    []
  )

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const startParams = connectStartRef.current
      connectStartRef.current = null

      // Only trigger quick-add when dragging FROM a source handle
      if (!startParams || startParams.handleType !== 'source') return
      if (!startParams.nodeId || !startParams.handleId) return
      if (!reactFlowInstance.current || !reactFlowWrapper.current) return

      // Check if the connection ended on a node (React Flow would have called onConnect)
      const target = event.target as HTMLElement
      const isPane = target.classList.contains('react-flow__pane')
      if (!isPane) return

      const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX
      const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const screenPos = { x: clientX - bounds.left, y: clientY - bounds.top }
      const flowPos = reactFlowInstance.current.screenToFlowPosition(screenPos)

      setLocalQuickAdd({
        screenPos,
        flowPos,
        sourceNodeId: startParams.nodeId,
        sourceHandleId: startParams.handleId,
      })
    },
    []
  )

  const handleQuickAddSelect = useCallback(
    (type: AutomatorNodeType) => {
      if (!activeQuickAdd) return

      if (activeQuickAdd.edgeId) {
        splitEdgeAndInsert(activeQuickAdd.edgeId, type)
      } else {
        addNodeAndConnect(type, activeQuickAdd.flowPos, activeQuickAdd.sourceNodeId, activeQuickAdd.sourceHandleId)
      }

      onNodeSelect?.(null)
      setLocalQuickAdd(null)
      setQuickAddSource(null)
    },
    [activeQuickAdd, addNodeAndConnect, splitEdgeAndInsert, onNodeSelect, setQuickAddSource]
  )

  const clearAllQuickAdd = useCallback(() => {
    setLocalQuickAdd(null)
    setQuickAddSource(null)
  }, [setQuickAddSource])

  // Use onNodeClick instead of onSelectionChange to avoid infinite loops
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id)
      onNodeSelect?.(node.id)
    },
    [selectNode, onNodeSelect]
  )

  // Handle click on canvas (deselect)
  const handlePaneClick = useCallback(() => {
    selectNode(null)
    onNodeSelect?.(null)
    clearAllQuickAdd()
  }, [selectNode, onNodeSelect, clearAllQuickAdd])

  // Handle drop from palette
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as AutomatorNodeType
      if (!type || !reactFlowInstance.current || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(type, position)
    },
    [addNode]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const nodeColor = useCallback((node: { type?: string }) => {
    switch (node.type) {
      case 'start':
        return '#22c55e'
      case 'end':
        return '#ef4444'
      case 'decision':
        return '#7c3aed'
      case 'dataCollection':
        return '#00d2af'
      case 'wait':
        return '#f59e0b'
      case 'messageConfirmation':
        return '#7c3aed'
      default:
        return '#6b7280'
    }
  }, [])

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onInit={handleInit}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={"smoothstep" as any}
        snapToGrid
        snapGrid={snapGrid}
        deleteKeyCode={deleteKeyCode}
        selectionKeyCode={null}
        multiSelectionKeyCode={multiSelectionKeyCode}
        className="bg-muted/30"
      >
        <Background gap={15} size={1} color="hsl(var(--border))" />
        <Controls className="bg-card border rounded-lg shadow-sm" />
        <MiniMap
          className="bg-card border rounded-lg shadow-sm"
          nodeColor={nodeColor}
        />
      </ReactFlow>

      {/* Quick-add menu (from drag, node [+], or edge [+]) */}
      {activeQuickAdd && (
        <QuickAddMenu
          position={activeQuickAdd.screenPos}
          onSelect={handleQuickAddSelect}
          onClose={clearAllQuickAdd}
        />
      )}
    </div>
  )
}

export function AutomatorCanvas(props: AutomatorCanvasProps) {
  return (
    <ReactFlowProvider>
      <AutomatorCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
