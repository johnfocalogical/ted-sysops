import { Zap, HelpCircle, Flag, Clock } from 'lucide-react'
import type { AutomatorNodeType } from '@/types/automator.types'

const QUICK_ADD_ITEMS: { type: AutomatorNodeType; label: string; icon: typeof HelpCircle }[] = [
  { type: 'dataCollection', label: 'Action', icon: Zap },
  { type: 'decision', label: 'Decision', icon: HelpCircle },
  { type: 'wait', label: 'Wait', icon: Clock },
  { type: 'end', label: 'End', icon: Flag },
]

interface QuickAddMenuProps {
  position: { x: number; y: number }
  onSelect: (type: AutomatorNodeType) => void
  onClose: () => void
}

export function QuickAddMenu({ position, onSelect, onClose }: QuickAddMenuProps) {
  return (
    <>
      {/* Invisible backdrop to close on click-away */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute z-50 bg-card border rounded-lg shadow-lg py-1 min-w-[140px]"
        style={{ left: position.x, top: position.y }}
      >
        <p className="px-3 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Add node
        </p>
        {QUICK_ADD_ITEMS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors text-left"
            onClick={() => onSelect(type)}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>
    </>
  )
}
