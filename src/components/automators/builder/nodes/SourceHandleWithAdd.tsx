import { useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HANDLE_STYLES } from './nodeStyles'
import { useAutomatorBuilderStore } from '@/stores/automatorBuilderStore'

interface SourceHandleWithAddProps {
  nodeId: string
  handleId?: string
  handleColor: string
}

/**
 * Source handle with a [+] quick-add button shown when unconnected.
 * Reusable across all node types with a single default output.
 */
export function SourceHandleWithAdd({
  nodeId,
  handleId = 'default',
  handleColor,
}: SourceHandleWithAddProps) {
  const edges = useAutomatorBuilderStore((s) => s.edges)
  const setQuickAddSource = useAutomatorBuilderStore((s) => s.setQuickAddSource)

  const isConnected = useMemo(
    () => edges.some((e) => e.source === nodeId && (e.sourceHandle ?? 'default') === handleId),
    [edges, nodeId, handleId]
  )

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setQuickAddSource({
      nodeId,
      handleId,
      screenPos: { x: e.clientX, y: e.clientY },
    })
  }

  return (
    <div className="relative">
      <Handle
        type="source"
        position={Position.Bottom}
        id={handleId}
        className={cn(HANDLE_STYLES.base, handleColor)}
      />
      {!isConnected && (
        <button
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-sm z-10"
          onClick={handlePlusClick}
          title="Add node"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  )
}
