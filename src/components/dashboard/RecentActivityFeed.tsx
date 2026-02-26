import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import type { ActivityLogWithUser } from '@/types/activity.types'

interface RecentActivityFeedProps {
  teamId: string
  userId?: string
  limit?: number
  onDealClick: (dealId: string) => void
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
  return email[0].toUpperCase()
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function activityIcon(activityType: string): string {
  switch (activityType) {
    case 'created': return '+'
    case 'updated': return '~'
    case 'deleted': return '-'
    case 'status_change': return '>'
    case 'comment': return '#'
    default: return '*'
  }
}

interface ActivityWithDeal extends ActivityLogWithUser {
  deal_address?: string
  deal_id: string | null
}

const PAGE_SIZE = 15

export function RecentActivityFeed({
  teamId,
  userId,
  limit = PAGE_SIZE,
  onDealClick,
}: RecentActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityWithDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const fetchActivity = useCallback(async (offset: number) => {
    if (!supabase) return { data: [], hasMore: false }

    const query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:users!activity_logs_user_id_fkey (
          id,
          full_name,
          email
        ),
        deal:deals (
          id,
          address
        )
      `, { count: 'exact' })
      .eq('team_id', teamId)
      .eq('entity_type', 'deal')
      .not('deal_id', 'is', null)

    if (userId) {
      // For My Dashboard: get activity on deals the user owns or is TC on
      // We'll filter by user_id on the activity for simplicity
      // (this gets activity the user performed)
      // A more sophisticated approach would filter by deal ownership
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const total = count || 0
    const items: ActivityWithDeal[] = (data || []).map((row) => {
      const deal = row.deal as unknown as { id: string; address: string } | null
      return {
        ...row,
        deal_address: deal?.address,
        user: row.user as unknown as { id: string; full_name: string | null; email: string },
      } as ActivityWithDeal
    })

    return { data: items, hasMore: offset + limit < total }
  }, [teamId, userId, limit])

  useEffect(() => {
    let cancelled = false
    fetchActivity(0)
      .then((result) => {
        if (!cancelled) {
          setLogs(result.data)
          setHasMore(result.hasMore)
        }
      })
      .catch((err) => console.error('Error loading activity feed:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fetchActivity])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const result = await fetchActivity(logs.length)
      setLogs((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Error loading more activity:', err)
    }
    setLoadingMore(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2.5 py-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-40 mb-2" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-2.5 py-2 border-b border-border/50 last:border-0"
                >
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-muted">
                      {getInitials(log.user.full_name, log.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium truncate">
                        {log.user.full_name || log.user.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {relativeTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      <span className="font-mono text-[10px] mr-1 opacity-50">
                        {activityIcon(log.activity_type)}
                      </span>
                      {log.deal_address && log.deal_id && (
                        <button
                          onClick={() => onDealClick(log.deal_id!)}
                          className="text-primary hover:underline mr-1"
                        >
                          {log.deal_address}
                        </button>
                      )}
                      {log.content || `${log.activity_type} deal`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="pt-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-xs"
                >
                  {loadingMore && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
