import { Play, StopCircle, HelpCircle, FileInput } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AutomatorNodeType } from '@/types/automator.types'

interface NodeTypeConfig {
  type: AutomatorNodeType
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const nodeTypes: NodeTypeConfig[] = [
  {
    type: 'start',
    label: 'Start',
    description: 'Entry point',
    icon: Play,
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
  },
  {
    type: 'end',
    label: 'End',
    description: 'Exit point',
    icon: StopCircle,
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
  },
  {
    type: 'decision',
    label: 'Decision',
    description: 'Yes/No question',
    icon: HelpCircle,
    color: 'text-accent bg-accent/10 border-accent/30',
  },
  {
    type: 'dataCollection',
    label: 'Collect Data',
    description: 'User input',
    icon: FileInput,
    color: 'text-primary bg-primary/10 border-primary/30',
  },
]

export function NodePalette() {
  const handleDragStart = (event: React.DragEvent, nodeType: AutomatorNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Drag to add</h3>
      {nodeTypes.map((config) => {
        const Icon = config.icon
        return (
          <div
            key={config.type}
            draggable
            onDragStart={(e) => handleDragStart(e, config.type)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-grab',
              'hover:shadow-md transition-shadow',
              'active:cursor-grabbing',
              config.color
            )}
          >
            <div className="shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm">{config.label}</div>
              <div className="text-xs text-muted-foreground">{config.description}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
