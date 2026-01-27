import { useState, useEffect, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommentInput } from './CommentInput'
import { ActivityTimeline } from './ActivityTimeline'
import { ActivityExportButton } from './ActivityExportButton'
import { useAuth } from '@/hooks/useAuth'
import {
  getActivityLogsForEntity,
  addCommentWithMentions,
  getTeamMembersForMentions,
} from '@/lib/activityLogService'
import { toast } from 'sonner'
import type {
  ActivityEntityType,
  ActivityFilterCategory,
  ActivityLogWithUser,
  ActivityType,
  MentionedUser,
} from '@/types/activity.types'
import { ACTIVITY_FILTER_MAP } from '@/types/activity.types'

interface ActivityCardProps {
  entityType: ActivityEntityType
  entityId: string
  teamId: string
  compact?: boolean
  maxItems?: number
  showHeader?: boolean
  employeeName?: string
}

export function ActivityCard({
  entityType,
  entityId,
  teamId,
  compact = false,
  maxItems,
  showHeader = true,
  employeeName,
}: ActivityCardProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityLogWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  // Filter state
  const [filterCategory, setFilterCategory] = useState<ActivityFilterCategory>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Team members for @mentions
  const [teamMembers, setTeamMembers] = useState<MentionedUser[]>([])

  // Resolve filter category to activity types
  const resolvedActivityTypes: ActivityType[] | undefined =
    ACTIVITY_FILTER_MAP[filterCategory] ?? undefined

  const loadActivities = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset
      const result = await getActivityLogsForEntity(entityType, entityId, {
        limit: 20,
        offset: currentOffset,
        activityTypes: resolvedActivityTypes,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
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
  }, [entityType, entityId, offset, resolvedActivityTypes, dateFrom, dateTo])

  // Load activities on mount and when entity or filters change
  useEffect(() => {
    setLoading(true)
    setActivities([])
    setOffset(0)
    loadActivities(true)
  }, [entityType, entityId, filterCategory, dateFrom, dateTo])

  // Load team members for @mentions
  useEffect(() => {
    if (!teamId) return
    getTeamMembersForMentions(teamId)
      .then(setTeamMembers)
      .catch((err) => console.error('Error loading team members for mentions:', err))
  }, [teamId])

  const handleAddComment = async (content: string, mentionedUserIds: string[]) => {
    if (!user) return

    try {
      const newActivity = await addCommentWithMentions(
        entityType,
        entityId,
        content,
        user.id,
        teamId,
        mentionedUserIds
      )
      // Add to top of list
      setActivities((prev) => [newActivity, ...prev])
      toast.success('Comment added')
    } catch (err) {
      console.error('Error adding comment:', err)
      toast.error('Failed to add comment')
      throw err
    }
  }

  const handleLoadMore = () => {
    loadActivities(false)
  }

  // Filter bar (only when showHeader is true and not compact)
  const filterBar = showHeader && !compact && (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={filterCategory}
        onValueChange={(v) => setFilterCategory(v as ActivityFilterCategory)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Activity</SelectItem>
          <SelectItem value="comments">Comments</SelectItem>
          <SelectItem value="profile_changes">Profile Changes</SelectItem>
          <SelectItem value="commission">Commission</SelectItem>
          <SelectItem value="permissions">Permissions</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="w-[130px] h-8 text-xs"
        placeholder="From"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="w-[130px] h-8 text-xs"
        placeholder="To"
      />
      {entityType === 'employee' && employeeName && (
        <ActivityExportButton
          entityType={entityType}
          entityId={entityId}
          employeeName={employeeName}
          activityTypes={resolvedActivityTypes}
          dateFrom={dateFrom || undefined}
          dateTo={dateTo || undefined}
        />
      )}
    </div>
  )

  // Compact mode with fixed header/input and scrollable timeline
  if (compact) {
    return (
      <div className="flex flex-col h-full">
        {/* Header - Fixed */}
        {showHeader && (
          <div className="flex items-center justify-between shrink-0 pb-2">
            <div className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="h-4 w-4" />
              Activity
              {activities.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({activities.length})
                </span>
              )}
            </div>
            {entityType === 'employee' && employeeName && (
              <ActivityExportButton
                entityType={entityType}
                entityId={entityId}
                employeeName={employeeName}
              />
            )}
          </div>
        )}

        {/* Timeline - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ActivityTimeline
            activities={activities}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loading={loading}
            compact={compact}
            maxItems={maxItems}
          />
        </div>

        {/* Comment Input - Fixed at bottom */}
        <div className="shrink-0 pt-2 border-t mt-2">
          <CommentInput
            onSubmit={handleAddComment}
            teamMembers={teamMembers}
            compact={compact}
            placeholder="Add a comment..."
          />
        </div>
      </div>
    )
  }

  // Full mode with Card wrapper
  const content = (
    <div className="space-y-4">
      {filterBar}
      <CommentInput
        onSubmit={handleAddComment}
        teamMembers={teamMembers}
        compact={compact}
        placeholder="Add a comment..."
      />
      <ActivityTimeline
        activities={activities}
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
