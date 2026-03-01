import { useState } from 'react'
import { Pencil, Trash2, Zap, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MESSAGE_EDIT_WINDOW_MINUTES, MESSAGE_DELETE_WINDOW_MINUTES } from '@/lib/commsConstants'
import { DealReferenceCards } from './DealReferenceCard'
import { ContactReferenceCards } from './ContactReferenceCard'
import { FinancialReferenceCards } from './FinancialReferenceCard'
import { DealSnapshotCard } from './DealSnapshotCard'
import { MessageAttachments } from './MessageAttachment'
import { ConfirmationButton } from './ConfirmationButton'
import type { MessageWithSender } from '@/types/comms.types'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwnMessage: boolean
  showSenderInfo: boolean // false when grouping consecutive messages
  currentUserId?: string
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function isWithinWindow(createdAt: string, windowMinutes: number): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMin = (now.getTime() - created.getTime()) / (1000 * 60)
  return diffMin <= windowMinutes
}

export function MessageBubble({
  message,
  isOwnMessage,
  showSenderInfo,
  currentUserId,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  // Deleted tombstone
  if (message.is_deleted) {
    return (
      <div className="flex items-center gap-2 py-1 px-4">
        {showSenderInfo && <div className="w-8" />}
        <p className="text-sm italic text-muted-foreground">
          [This message was deleted]
        </p>
      </div>
    )
  }

  // System message
  if (message.sender_type === 'system') {
    return (
      <div className="flex justify-center py-2 px-4">
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    )
  }

  // Automator message
  if (message.sender_type === 'automator') {
    return (
      <div className="flex gap-3 py-2 px-4">
        <div className="flex-shrink-0">
          {showSenderInfo ? (
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent" />
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {showSenderInfo && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-accent">
                {message.automator?.name ?? 'Automator'}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/30 text-accent">
                Bot
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.metadata?.confirmation && currentUserId && (
              <ConfirmationButton
                metadata={message.metadata.confirmation}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // User message
  const canEdit = isOwnMessage && isWithinWindow(message.created_at, MESSAGE_EDIT_WINDOW_MINUTES)
  const canDelete = isOwnMessage && isWithinWindow(message.created_at, MESSAGE_DELETE_WINDOW_MINUTES)
  const senderName = message.sender?.full_name ?? message.sender?.email ?? 'Unknown'

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim())
    }
    setEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSubmit()
    }
    if (e.key === 'Escape') {
      setEditContent(message.content)
      setEditing(false)
    }
  }

  // Rich reference cards
  const dealRefs = message.metadata?.deal_references ?? []
  const contactRefs = message.metadata?.contact_references ?? []
  const financialRefs = message.metadata?.financial_references ?? []
  const dealSnapshot = message.metadata?.deal_snapshot

  return (
    <div
      className={cn(
        'group flex gap-3 py-1 px-4 hover:bg-muted/30 transition-colors',
        isOwnMessage && 'bg-primary/[0.03]'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showSenderInfo ? (
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className={cn(
                'text-xs font-medium',
                isOwnMessage
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showSenderInfo && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold">{senderName}</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full min-h-[60px] p-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditContent(message.content)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEditSubmit}
                className="bg-primary hover:bg-primary/90"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
              {message.is_edited && (
                <span className="text-xs text-muted-foreground ml-1">(edited)</span>
              )}
            </p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <MessageAttachments attachments={message.attachments} />
            )}

            {/* Rich reference cards */}
            <DealReferenceCards references={dealRefs} />
            <ContactReferenceCards references={contactRefs} />
            <FinancialReferenceCards references={financialRefs} />
            {dealSnapshot && <DealSnapshotCard snapshot={dealSnapshot} />}
          </>
        )}
      </div>

      {/* Actions (hover) */}
      {(canEdit || canDelete) && !editing && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete?.(message.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
