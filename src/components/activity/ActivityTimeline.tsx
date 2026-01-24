import { Loader2, MessageSquareOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityItem } from './ActivityItem'
import type { ActivityLogWithUser } from '@/types/activity.types'

interface ActivityTimelineProps {
  activities: ActivityLogWithUser[]
  currentUserId?: string
  onDelete?: (activityId: string) => Promise<void>
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  compact?: boolean
  maxItems?: number
}

export function ActivityTimeline({
  activities,
  currentUserId,
  onDelete,
  onLoadMore,
  hasMore = false,
  loading = false,
  compact = false,
  maxItems,
}: ActivityTimelineProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities
  const hasMoreToShow = maxItems ? activities.length > maxItems || hasMore : hasMore

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquareOff className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add a comment to start the conversation
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {displayActivities.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          currentUserId={currentUserId}
          onDelete={onDelete}
          compact={compact}
        />
      ))}

      {hasMoreToShow && onLoadMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full text-muted-foreground"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Load more'
          )}
        </Button>
      )}
    </div>
  )
}
