import { useState, useEffect, useCallback } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  getDealChecklistItems,
  updateDealChecklistItem,
} from '@/lib/dealService'
import { createActivityLog } from '@/lib/activityLogService'
import type { DealChecklistItem } from '@/types/deal.types'

interface DealChecklistProps {
  dealId: string
  onTptChange?: (tpt: number) => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return ''
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function isAutoChecked(item: DealChecklistItem): boolean {
  if (item.checked_by_source?.source === 'automator') return true
  // Fallback: if process_instance_id is set but no checked_by_source (legacy data)
  if (item.process_instance_id && !item.checked_by_source) return true
  return false
}

function getAutoCheckLabel(item: DealChecklistItem): string {
  if (item.checked_by_source?.source === 'automator') {
    const name = item.checked_by_source.automator_name ?? 'Automator'
    const date = formatDate(item.date_completed)
    return date ? `Checked by ${name} on ${date}` : `Checked by ${name}`
  }
  return 'Auto-checked by automator'
}

export function DealChecklist({ dealId, onTptChange }: DealChecklistProps) {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()

  const [items, setItems] = useState<DealChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const calcTpt = useCallback(
    (checkItems: DealChecklistItem[]) => {
      if (checkItems.length === 0) return 0
      const checked = checkItems.filter((i) => i.is_checked).length
      return Math.round((checked / checkItems.length) * 100)
    },
    []
  )

  // Load checklist items
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getDealChecklistItems(dealId)
        if (!cancelled) {
          setItems(data)
          onTptChange?.(calcTpt(data))
        }
      } catch (err) {
        console.error('Error loading checklist:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [dealId, calcTpt, onTptChange])

  const handleToggle = async (item: DealChecklistItem) => {
    if (!teamId || !user?.id) return

    const newChecked = !item.is_checked
    const now = new Date().toISOString().substring(0, 10)

    setUpdatingId(item.id)

    // Optimistic update
    const updatedItems = items.map((i) =>
      i.id === item.id
        ? {
            ...i,
            is_checked: newChecked,
            date_completed: newChecked ? now : null,
          }
        : i
    )
    setItems(updatedItems)
    onTptChange?.(calcTpt(updatedItems))

    try {
      await updateDealChecklistItem(item.id, {
        is_checked: newChecked,
        date_completed: newChecked ? now : null,
      })

      await createActivityLog(
        {
          team_id: teamId,
          deal_id: dealId,
          entity_type: 'deal',
          activity_type: 'updated',
          content: `${newChecked ? 'Checked' : 'Unchecked'} checklist item: ${item.label}`,
          metadata: {
            checklist_item_id: item.id,
            checklist_label: item.label,
            checked: newChecked,
          },
        },
        user.id
      )
    } catch (err) {
      console.error('Error updating checklist item:', err)
      toast.error('Failed to update checklist item')
      // Revert
      setItems(items)
      onTptChange?.(calcTpt(items))
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-xs text-muted-foreground">
          No checklist items yet. Items are created when the deal is set up.
        </p>
      </div>
    )
  }

  const tpt = calcTpt(items)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="px-3 py-2">
        {/* TPT Progress */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Progress
          </span>
          <span className="text-xs font-bold tabular-nums text-primary">
            {tpt}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${tpt}%` }}
          />
        </div>

        {/* Items */}
        <div className="space-y-1">
          {items.map((item) => {
            const autoChecked = item.is_checked && isAutoChecked(item)

            return (
              <div
                key={item.id}
                className="flex items-start gap-2.5 py-1.5 px-1 rounded hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={() => handleToggle(item)}
                  disabled={updatingId === item.id}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm leading-tight ${
                        item.is_checked ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    {autoChecked && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Zap className="h-3 w-3 shrink-0 text-accent fill-accent/20" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                          <p className="text-xs">{getAutoCheckLabel(item)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.date_completed && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(item.date_completed)}
                      </span>
                    )}
                    {item.price != null && (
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
