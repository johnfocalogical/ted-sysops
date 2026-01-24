import { useState, useEffect, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommentInput } from './CommentInput'
import { ActivityTimeline } from './ActivityTimeline'
import { useAuth } from '@/hooks/useAuth'
import {
  getActivityLogsForEntity,
  addComment,
  deleteActivityLog,
} from '@/lib/activityLogService'
import { toast } from 'sonner'
import type { ActivityEntityType, ActivityLogWithUser } from '@/types/activity.types'

interface ActivityCardProps {
  entityType: ActivityEntityType
  entityId: string
  teamId: string
  compact?: boolean
  maxItems?: number
  showHeader?: boolean
}

export function ActivityCard({
  entityType,
  entityId,
  teamId,
  compact = false,
  maxItems,
  showHeader = true,
}: ActivityCardProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityLogWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const loadActivities = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset
      const result = await getActivityLogsForEntity(entityType, entityId, {
        limit: 20,
        offset: currentOffset,
      })

      if (reset) {
        setActivities(result.data)
        setOffset(20)
      } else {
        setActivities((prev) => [...prev, ...result.data])
        setOffset((prev) => prev + 20)
      }
      setHasMore(result.hasMore)
    } catch (err) {
      console.error('Error loading activities:', err)
      toast.error('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, offset])

  // Load activities on mount and when entity changes
  useEffect(() => {
    setLoading(true)
    setActivities([])
    setOffset(0)
    loadActivities(true)
  }, [entityType, entityId])

  const handleAddComment = async (content: string) => {
    if (!user) return

    try {
      const newActivity = await addComment(
        entityType,
        entityId,
        content,
        user.id,
        teamId
      )
      // Add to top of list
      setActivities((prev) => [newActivity, ...prev])
      toast.success('Comment added')
    } catch (err) {
      console.error('Error adding comment:', err)
      toast.error('Failed to add comment')
      throw err // Re-throw to let CommentInput know
    }
  }

  const handleDeleteComment = async (activityId: string) => {
    try {
      await deleteActivityLog(activityId)
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
      toast.success('Comment deleted')
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Failed to delete comment')
    }
  }

  const handleLoadMore = () => {
    loadActivities(false)
  }

  const content = (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <CommentInput
        onSubmit={handleAddComment}
        compact={compact}
        placeholder="Add a comment..."
      />
      <ActivityTimeline
        activities={activities}
        currentUserId={user?.id}
        onDelete={handleDeleteComment}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
        compact={compact}
        maxItems={maxItems}
      />
    </div>
  )

  if (!showHeader) {
    return content
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Activity
          {activities.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({activities.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
