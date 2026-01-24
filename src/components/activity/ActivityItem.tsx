import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ActivityLogWithUser } from '@/types/activity.types'

interface ActivityItemProps {
  activity: ActivityLogWithUser
  currentUserId?: string
  onDelete?: (activityId: string) => Promise<void>
  compact?: boolean
}

export function ActivityItem({
  activity,
  currentUserId,
  onDelete,
  compact = false,
}: ActivityItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const userName = activity.user?.full_name || activity.user?.email || 'Unknown user'
  const userInitials = userName.slice(0, 2).toUpperCase()
  const isOwnComment = currentUserId === activity.user_id
  const canDelete = isOwnComment && activity.activity_type === 'comment' && onDelete

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(activity.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })

  if (compact) {
    return (
      <div className="flex items-start gap-2 text-sm">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-medium truncate">{userName.split(' ')[0]}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {activity.content && (
            <p className="text-muted-foreground line-clamp-2">{activity.content}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
        {activity.activity_type === 'comment' ? (
          userInitials
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {activity.activity_type === 'comment' && (
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{userName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          {/* Delete button */}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this comment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Comment content */}
        {activity.content && (
          <p className="text-sm mt-1 whitespace-pre-wrap">{activity.content}</p>
        )}
      </div>
    </div>
  )
}
