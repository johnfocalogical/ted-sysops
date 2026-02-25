import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DealCard } from './DealCard'
import type { DealListItem, DealStatus } from '@/types/deal.types'
import { DEAL_STATUS_LABELS } from '@/types/deal.types'

interface DealKanbanViewProps {
  deals: DealListItem[]
  loading: boolean
  onStatusChange: (dealId: string, newStatus: DealStatus) => void
  orgId: string
  teamId: string
}

const ACTIVE_COLUMNS: DealStatus[] = ['active', 'for_sale', 'pending_sale', 'on_hold']
const COLLAPSED_STATUSES: DealStatus[] = ['closed', 'funded', 'canceled']

const COLUMN_HEADER_COLORS: Record<DealStatus, string> = {
  active: 'border-t-primary',
  for_sale: 'border-t-blue-500',
  pending_sale: 'border-t-amber-500',
  closed: 'border-t-green-500',
  funded: 'border-t-green-600',
  on_hold: 'border-t-orange-500',
  canceled: 'border-t-red-500',
}

interface KanbanColumnProps {
  status: DealStatus
  deals: DealListItem[]
  orgId: string
  teamId: string
}

function KanbanColumn({ status, deals, orgId, teamId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[260px] w-[260px] bg-muted/30 rounded-lg border-t-2',
        COLUMN_HEADER_COLORS[status],
        isOver && 'ring-2 ring-primary/40 bg-primary/5'
      )}
    >
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold">{DEAL_STATUS_LABELS[status]}</span>
        <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
          {deals.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[100px]">
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} orgId={orgId} teamId={teamId} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-6 italic">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  )
}

export function DealKanbanView({
  deals,
  loading,
  onStatusChange,
  orgId,
  teamId,
}: DealKanbanViewProps) {
  const [activeDeal, setActiveDeal] = useState<DealListItem | null>(null)
  const [showCollapsed, setShowCollapsed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // Group deals by status
  const dealsByStatus = new Map<DealStatus, DealListItem[]>()
  for (const status of [...ACTIVE_COLUMNS, ...COLLAPSED_STATUSES]) {
    dealsByStatus.set(status, [])
  }
  for (const deal of deals) {
    const list = dealsByStatus.get(deal.status)
    if (list) list.push(deal)
  }

  const collapsedCount = COLLAPSED_STATUSES.reduce(
    (sum, s) => sum + (dealsByStatus.get(s)?.length || 0),
    0
  )

  function handleDragStart(event: DragStartEvent) {
    const deal = event.active.data.current?.deal as DealListItem | undefined
    setActiveDeal(deal || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const dealId = active.id as string
    const deal = deals.find((d) => d.id === dealId)
    if (!deal) return

    // Determine the target status — "over" could be a column id (status) or another deal card
    let targetStatus: DealStatus | null = null

    // Check if we dropped on a column directly
    if ([...ACTIVE_COLUMNS, ...COLLAPSED_STATUSES].includes(over.id as DealStatus)) {
      targetStatus = over.id as DealStatus
    } else {
      // Dropped on another deal card — find which column it belongs to
      const targetDeal = deals.find((d) => d.id === over.id)
      if (targetDeal) {
        targetStatus = targetDeal.status
      }
    }

    if (targetStatus && targetStatus !== deal.status) {
      onStatusChange(dealId, targetStatus)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ACTIVE_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            deals={dealsByStatus.get(status) || []}
            orgId={orgId}
            teamId={teamId}
          />
        ))}
      </div>

      {/* Collapsed Statuses Section */}
      {collapsedCount > 0 && (
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCollapsed(!showCollapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showCollapsed ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            Closed / Funded / Canceled ({collapsedCount})
          </Button>

          {showCollapsed && (
            <div className="flex gap-4 overflow-x-auto pb-4 mt-2">
              {COLLAPSED_STATUSES.map((status) => {
                const statusDeals = dealsByStatus.get(status) || []
                if (statusDeals.length === 0) return null
                return (
                  <KanbanColumn
                    key={status}
                    status={status}
                    deals={statusDeals}
                    orgId={orgId}
                    teamId={teamId}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      <DragOverlay>
        {activeDeal && (
          <Card className="w-[260px] shadow-lg rotate-2">
            <CardContent className="p-3">
              <p className="font-medium text-sm truncate">{activeDeal.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeDeal.owner?.full_name || ''}
              </p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  )
}
