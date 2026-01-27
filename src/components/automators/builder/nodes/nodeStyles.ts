// Node styling constants for the Automator Builder
// Following Space Force design system with purple accent for automators

export const NODE_COLORS = {
  // Node type colors
  start: {
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    icon: 'text-green-500',
    handle: 'bg-green-500',
  },
  end: {
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    icon: 'text-red-500',
    handle: 'bg-red-500',
  },
  decision: {
    bg: 'bg-accent/10',
    border: 'border-accent',
    icon: 'text-accent',
    handle: 'bg-accent',
  },
  dataCollection: {
    bg: 'bg-primary/10',
    border: 'border-primary',
    icon: 'text-primary',
    handle: 'bg-primary',
  },
} as const

export const NODE_BASE_STYLES = {
  wrapper: 'rounded-lg border-2 bg-card shadow-md min-w-[180px] max-w-[250px]',
  selected: 'ring-2 ring-accent ring-offset-2 ring-offset-background',
  header: 'flex items-center gap-2 px-3 py-2 border-b',
  headerIcon: 'w-5 h-5',
  headerLabel: 'font-medium text-sm truncate',
  content: 'px-3 py-2',
  contentText: 'text-xs text-muted-foreground line-clamp-2',
}

export const HANDLE_STYLES = {
  base: 'w-3 h-3 rounded-full border-2 border-background',
  source: 'bottom-0 translate-y-1/2',
  target: 'top-0 -translate-y-1/2',
  left: 'left-0 -translate-x-1/2',
  right: 'right-0 translate-x-1/2',
}
