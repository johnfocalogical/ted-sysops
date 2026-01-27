import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  MessageSquare,
  Shield,
  Tag,
  User,
} from 'lucide-react'
import type { ActivityLogWithUser, ActivityType } from '@/types/activity.types'
import { ACTIVITY_TYPE_LABELS } from '@/types/activity.types'

interface ActivityItemProps {
  activity: ActivityLogWithUser
  compact?: boolean
}

// Icon mapping for each activity type
function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'comment':
      return <MessageSquare className="h-4 w-4" />
    case 'type_assigned':
    case 'type_unassigned':
      return <Tag className="h-4 w-4" />
    case 'department_changed':
      return <Building2 className="h-4 w-4" />
    case 'commission_rule_created':
    case 'commission_rule_updated':
    case 'commission_rule_deleted':
      return <DollarSign className="h-4 w-4" />
    case 'role_changed':
      return <Shield className="h-4 w-4" />
    case 'status_change':
      return <Activity className="h-4 w-4" />
    case 'created':
    case 'updated':
    case 'deleted':
    default:
      return <User className="h-4 w-4" />
  }
}

// Render content with @mention highlighting
function renderContentWithMentions(content: string): React.ReactNode {
  // Match @Name patterns (@ followed by 2+ word chars, optionally more words)
  const parts = content.split(/(@[\w][\w\s]*[\w])/g)

  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="bg-primary/10 text-primary font-medium px-0.5 rounded">
          {part}
        </span>
      )
    }
    return part
  })
}

export function ActivityItem({
  activity,
  compact = false,
}: ActivityItemProps) {
  const [showDetails, setShowDetails] = useState(false)

  const userName = activity.user?.full_name || activity.user?.email || 'Unknown user'
  const userInitials = userName.slice(0, 2).toUpperCase()
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })

  // Check if metadata has field-level diffs to show
  const hasDiffs = activity.metadata &&
    (Array.isArray(activity.metadata.changes) ||
     activity.metadata.from_department_name !== undefined ||
     activity.metadata.previous_rule !== undefined ||
     activity.metadata.before_roles !== undefined)

  if (compact) {
    return (
      <div className="flex items-start gap-2 text-sm">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 text-muted-foreground">
          {getActivityIcon(activity.activity_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-medium truncate">{userName.split(' ')[0]}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {activity.content && (
            <p className="text-muted-foreground line-clamp-2">
              {renderContentWithMentions(activity.content)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 group">
      {/* Avatar / Icon */}
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
        {activity.activity_type === 'comment' ? (
          userInitials
        ) : (
          getActivityIcon(activity.activity_type)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {activity.activity_type === 'comment' && (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{userName}</span>
          {activity.activity_type !== 'comment' && (
            <span className="text-xs text-muted-foreground">
              {ACTIVITY_TYPE_LABELS[activity.activity_type]}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Content text */}
        {activity.content && (
          <p className="text-sm mt-1 whitespace-pre-wrap">
            {renderContentWithMentions(activity.content)}
          </p>
        )}

        {/* Expandable diff details */}
        {hasDiffs && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
          >
            {showDetails ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}

        {showDetails && activity.metadata && (
          <div className="mt-2 rounded border bg-muted/30 p-2 text-xs space-y-1">
            {/* Field-level changes */}
            {Array.isArray(activity.metadata.changes) &&
              (activity.metadata.changes as Array<{ label: string; from: string | null; to: string | null }>).map(
                (change, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-medium min-w-[120px]">{change.label}:</span>
                    <span className="text-red-500 line-through">{change.from || '(empty)'}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="text-green-600">{change.to || '(empty)'}</span>
                  </div>
                )
              )}

            {/* Department change */}
            {activity.metadata.from_department_name !== undefined && (
              <div className="flex gap-2">
                <span className="font-medium min-w-[120px]">Department:</span>
                <span className="text-red-500 line-through">
                  {(activity.metadata.from_department_name as string) || '(none)'}
                </span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="text-green-600">
                  {(activity.metadata.to_department_name as string) || '(none)'}
                </span>
              </div>
            )}

            {/* Role changes */}
            {activity.metadata.before_roles !== undefined && (
              <>
                {activity.metadata.before_permission_level !== activity.metadata.after_permission_level && (
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[120px]">Permission:</span>
                    <span className="text-red-500 line-through">
                      {activity.metadata.before_permission_level as string}
                    </span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="text-green-600">
                      {activity.metadata.after_permission_level as string}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="font-medium min-w-[120px]">Roles:</span>
                  <span className="text-muted-foreground">
                    {(activity.metadata.before_roles as string[]).join(', ') || '(none)'}
                    {' → '}
                    {(activity.metadata.after_roles as string[]).join(', ') || '(none)'}
                  </span>
                </div>
              </>
            )}

            {/* Commission rule before/after */}
            {activity.metadata.previous_rule && (
              <div>
                <span className="font-medium">Previous values:</span>
                <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto">
                  {JSON.stringify(activity.metadata.previous_rule, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
