import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, Link2, Unlink, Search, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DEAL_STATUS_LABELS, DEAL_TYPE_LABELS } from '@/types/deal.types'
import type { DealStatus, DealType, DealListItem } from '@/types/deal.types'
import { supabase } from '@/lib/supabase'
import * as commsService from '@/lib/commsService'
import * as dealService from '@/lib/dealService'
import { toast } from 'sonner'

interface LinkedDeal {
  deal_id: string
  address: string
  status: string
  deal_type: string
}

interface DealLinkManagerProps {
  conversationId: string
  teamId: string
  userId: string
}

export function DealLinkManager({
  conversationId,
  teamId,
  userId,
}: DealLinkManagerProps) {
  const navigate = useNavigate()
  const { orgId } = useParams<{ orgId: string }>()

  const [linkedDeals, setLinkedDeals] = useState<LinkedDeal[]>([])
  const [loading, setLoading] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DealListItem[]>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)

  // Load linked deals
  const loadLinkedDeals = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase!
        .from('conversation_deal_links')
        .select(`
          deal_id,
          deal:deals!deal_id(id, address, status, deal_type)
        `)
        .eq('conversation_id', conversationId)

      if (error) throw error

      const deals: LinkedDeal[] = (data || []).map((row: Record<string, unknown>) => {
        const deal = row.deal as { id: string; address: string; status: string; deal_type: string }
        return {
          deal_id: deal.id,
          address: deal.address,
          status: deal.status,
          deal_type: deal.deal_type,
        }
      })

      setLinkedDeals(deals)
    } catch (err) {
      console.error('Failed to load linked deals:', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadLinkedDeals()
  }, [loadLinkedDeals])

  // Search deals when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const result = await dealService.getDeals({
          teamId,
          page: 1,
          pageSize: 10,
          search: searchQuery.trim(),
        })
        // Filter out already linked deals
        const linkedIds = new Set(linkedDeals.map((d) => d.deal_id))
        setSearchResults(result.data.filter((d) => !linkedIds.has(d.id)))
      } catch (err) {
        console.error('Failed to search deals:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery, teamId, linkedDeals])

  const handleLink = async (dealId: string) => {
    setLinking(dealId)
    try {
      await commsService.linkDealToConversation(conversationId, dealId, userId)
      await loadLinkedDeals()
      setSearchQuery('')
      setSearchResults([])
      toast.success('Deal linked to conversation')
    } catch (err) {
      console.error('Failed to link deal:', err)
      toast.error('Failed to link deal')
    } finally {
      setLinking(null)
    }
  }

  const handleUnlink = async (dealId: string) => {
    try {
      await commsService.unlinkDealFromConversation(conversationId, dealId)
      setLinkedDeals((prev) => prev.filter((d) => d.deal_id !== dealId))
      toast.success('Deal unlinked')
    } catch (err) {
      console.error('Failed to unlink deal:', err)
      toast.error('Failed to unlink deal')
    }
  }

  const handleNavigateToDeal = (dealId: string) => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/deals/${dealId}`)
    }
  }

  if (loading && linkedDeals.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Linked deal chips */}
      {linkedDeals.map((deal) => (
        <button
          key={deal.deal_id}
          onClick={() => handleNavigateToDeal(deal.deal_id)}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card hover:bg-muted/50 transition-colors text-xs max-w-[200px] group"
          title={deal.address}
        >
          <Building2 className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="truncate font-medium">{deal.address}</span>
          <Badge
            className="text-[9px] px-1 py-0 flex-shrink-0"
            variant="outline"
          >
            {DEAL_STATUS_LABELS[deal.status as DealStatus] ?? deal.status}
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleUnlink(deal.deal_id)
            }}
            className="opacity-0 group-hover:opacity-100 ml-0.5 text-muted-foreground hover:text-destructive transition-all"
            title="Unlink deal"
          >
            <X className="h-3 w-3" />
          </button>
        </button>
      ))}

      {/* Link deal button / popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="h-3.5 w-3.5 mr-1" />
            {linkedDeals.length === 0 ? 'Link Deal' : ''}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <div className="space-y-3">
            <p className="text-sm font-medium">Link a deal</p>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>

            {/* Search results */}
            {searching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {searchResults.map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => handleLink(deal.id)}
                      disabled={linking === deal.id}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    >
                      <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {deal.address}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {DEAL_STATUS_LABELS[deal.status as DealStatus] ?? deal.status}
                          {' · '}
                          {DEAL_TYPE_LABELS[deal.deal_type as DealType] ?? deal.deal_type}
                        </p>
                      </div>
                      {linking === deal.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : searchQuery.trim() ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                No deals found
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                Type to search for deals
              </p>
            )}

            {/* Currently linked */}
            {linkedDeals.length > 0 && (
              <div className="border-t border-border pt-2 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Linked
                </p>
                {linkedDeals.map((deal) => (
                  <div
                    key={deal.deal_id}
                    className="flex items-center gap-2 px-2 py-1"
                  >
                    <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm truncate flex-1">
                      {deal.address}
                    </span>
                    <button
                      onClick={() => handleUnlink(deal.deal_id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Unlink"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
