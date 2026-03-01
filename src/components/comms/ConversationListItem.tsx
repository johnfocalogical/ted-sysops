import { Hash } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ConversationPreview } from '@/types/comms.types'

interface ConversationListItemProps {
  conversation: ConversationPreview
  isSelected: boolean
  currentUserId: string
  onClick: () => void
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHr < 24) return `${diffHr}h`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getConversationTitle(
  conversation: ConversationPreview,
  currentUserId: string
): string {
  if (conversation.type === 'channel') {
    return `# ${conversation.name ?? 'Unnamed Channel'}`
  }

  if (conversation.name) return conversation.name

  // For DMs/groups without a name, show participant names
  const otherParticipants = conversation.participants.filter(
    (p) => p.id !== currentUserId
  )
  if (otherParticipants.length === 0) return 'You'
  return otherParticipants
    .map((p) => p.full_name ?? 'Unknown')
    .join(', ')
}

export function ConversationListItem({
  conversation,
  isSelected,
  currentUserId,
  onClick,
}: ConversationListItemProps) {
  const hasUnread = conversation.unread_count > 0
  const title = getConversationTitle(conversation, currentUserId)
  const lastMessage = conversation.last_message

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        !isSelected && 'border-l-2 border-l-transparent'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {conversation.type === 'channel' ? (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Hash className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : conversation.type === 'dm' ? (
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(
                conversation.participants.find((p) => p.id !== currentUserId)?.full_name ??
                  conversation.participants[0]?.full_name
              )}
            </AvatarFallback>
          </Avatar>
        ) : (
          /* Group: stacked initials */
          <div className="relative h-10 w-10">
            <Avatar className="h-7 w-7 absolute top-0 left-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getInitials(conversation.participants[0]?.full_name)}
              </AvatarFallback>
            </Avatar>
            <Avatar className="h-7 w-7 absolute bottom-0 right-0 ring-2 ring-background">
              <AvatarFallback className="bg-accent/10 text-accent text-xs font-medium">
                {getInitials(conversation.participants[1]?.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm truncate',
              hasUnread ? 'font-semibold' : 'font-medium'
            )}
          >
            {title}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatRelativeTime(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {lastMessage
              ? conversation.type !== 'dm' && lastMessage.sender_name
                ? `${lastMessage.sender_name}: ${lastMessage.content}`
                : lastMessage.content
              : 'No messages yet'}
          </span>

          <div className="flex items-center gap-1 flex-shrink-0">
            {hasUnread && (
              <Badge
                variant="default"
                className="h-5 min-w-[20px] px-1.5 text-xs bg-primary hover:bg-primary"
              >
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
