import { useState, useCallback } from 'react'
import {
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
} from 'reactflow'
import type { EdgeProps } from 'reactflow'
import { Plus } from 'lucide-react'

export function BuilderEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  // Position the [+] button below the label if label exists, otherwise at midpoint
  const buttonY = label ? labelY + 20 : labelY

  const handlePlusClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      // Dispatch a custom event that the canvas listens for
      window.dispatchEvent(
        new CustomEvent('builder-edge-add', {
          detail: { edgeId: id, clientX: e.clientX, clientY: e.clientY },
        })
      )
    },
    [id]
  )

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {/* Invisible wider hit area for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={30}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Edge label (branch name) */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none text-[10px] font-medium text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/50 shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* [+] button at midpoint — always rendered, visibility toggled */}
      <EdgeLabelRenderer>
        <div
          className="absolute nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${buttonY}px)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 150ms ease',
            pointerEvents: 'all',
            padding: '8px',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform cursor-pointer"
            onMouseDown={(e) => {
              // Prevent React Flow from interpreting this as a pane interaction
              e.stopPropagation()
            }}
            onClick={handlePlusClick}
            title="Insert node"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
