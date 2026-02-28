import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getActivityLogsForEntity } from '@/lib/activityLogService'
import type { ActivityLogWithUser } from '@/types/activity.types'

interface DealActivityFeedProps {
  dealId: string
  isVisible?: boolean
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
    case 'created':
      return '+'
    case 'updated':
      return '~'
    case 'deleted':
      return '-'
    case 'status_change':
      return '>'
    case 'comment':
      return '#'
    default:
      return '*'
  }
}

const PAGE_SIZE = 20

export function DealActivityFeed({ dealId, isVisible }: DealActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLogWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Load / refresh when dealId changes or tab becomes visible
  useEffect(() => {
    let cancelled = false
    getActivityLogsForEntity('deal', dealId, { limit: PAGE_SIZE, offset: 0 })
      .then((result) => {
        if (!cancelled) {
          setLogs(result.data)
          setHasMore(result.hasMore)
        }
      })
      .catch((err) => console.error('Error loading activity feed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [dealId, isVisible])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const result = await getActivityLogsForEntity('deal', dealId, {
        limit: PAGE_SIZE,
        offset: logs.length,
      })
      setLogs((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Error loading more activity:', err)
    }
    setLoadingMore(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-xs text-muted-foreground">
          No activity recorded yet for this deal.
        </p>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
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
            {loadingMore ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
