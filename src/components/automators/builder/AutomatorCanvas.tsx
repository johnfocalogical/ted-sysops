import { useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow'
import type { ReactFlowInstance, Connection, NodeTypes, Node } from 'reactflow'
import 'reactflow/dist/style.css'

import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'
import { StartNode } from './nodes/StartNode'
import { EndNode } from './nodes/EndNode'
import { DecisionNode } from './nodes/DecisionNode'
import { DataCollectionNode } from './nodes/DataCollectionNode'
import type { AutomatorNodeType } from '@/types/automator.types'

// Register custom node types - MUST be outside component to prevent re-renders
const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  dataCollection: DataCollectionNode,
}

// Static config objects - MUST be outside component
const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: false,
}
const fitViewOptions = { padding: 0.2 }
const snapGrid: [number, number] = [15, 15]
const deleteKeyCode = ['Backspace', 'Delete']
const multiSelectionKeyCode = ['Control', 'Meta']

interface AutomatorCanvasProps {
  onNodeSelect?: (nodeId: string | null) => void
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
  const selectNode = useAutomatorBuilderStore((state) => state.selectNode)

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance
  }, [])

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection)
    },
    [onConnect]
  )

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
  }, [selectNode, onNodeSelect])

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
      default:
        return '#6b7280'
    }
  }, [])

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onInit={handleInit}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType="smoothstep"
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
