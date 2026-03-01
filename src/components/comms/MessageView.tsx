import { useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Loader2, Users, Hash, User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { DealLinkManager } from './DealLinkManager'
import { ConversationSettings } from './ConversationSettings'
import { useCommsStore } from '@/hooks/useCommsStore'
import * as commsService from '@/lib/commsService'
import type { MessageWithSender, ConversationPreview } from '@/types/comms.types'

interface MessageViewProps {
  userId: string
  teamId: string
  readOnly?: boolean
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (msgDate.getTime() === today.getTime()) return 'Today'
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function getConversationTitle(
  conversation: ConversationPreview | undefined,
  userId: string
): string {
  if (!conversation) return 'Conversation'

  if (conversation.type === 'dm') {
    const other = conversation.participants.find((p) => p.id !== userId)
    return other?.full_name ?? 'Direct Message'
  }

  return conversation.name ?? conversation.participants.map((p) => p.full_name ?? '?').join(', ')
}

/** Check if two messages should be grouped (same sender within 2 minutes) */
function shouldGroup(prev: MessageWithSender, curr: MessageWithSender): boolean {
  if (prev.sender_id !== curr.sender_id) return false
  if (prev.sender_type !== curr.sender_type) return false
  if (prev.sender_type !== 'user') return false
  const diff = Math.abs(
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()
  )
  return diff < 2 * 60 * 1000
}

export function MessageView({ userId, teamId, readOnly = false }: MessageViewProps) {
  const {
    selectedConversationId,
    conversations,
    messages,
    messagesLoading,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useCommsStore()

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  )
  const conversationTitle = getConversationTitle(selectedConversation, userId)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true)

  // Auto-scroll to bottom on new messages (if already at bottom)
  useEffect(() => {
    if (wasAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Scroll to bottom when selecting a new conversation
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
    wasAtBottomRef.current = true
  }, [selectedConversationId])

  // Track scroll position to know if user is at bottom
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
      wasAtBottomRef.current = isAtBottom

      // Infinite scroll: load more when near top
      if (el.scrollTop < 100 && hasMoreMessages && !messagesLoading) {
        loadMoreMessages()
      }
    },
    [hasMoreMessages, messagesLoading, loadMoreMessages]
  )

  // Setup realtime subscription
  useEffect(() => {
    if (!selectedConversationId) return

    const unsubscribe = commsService.subscribeToMessages(
      selectedConversationId,
      (message: MessageWithSender) => {
        useCommsStore.getState().addRealtimeMessage(message)
      }
    )

    return unsubscribe
  }, [selectedConversationId])

  const handleSend = async (content: string, attachments?: File[]) => {
    if (!selectedConversationId) return

    try {
      await sendMessage({
        conversation_id: selectedConversationId,
        content,
        attachments,
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleEdit = async (messageId: string, content: string) => {
    try {
      await editMessage(messageId, content)
    } catch (err) {
      console.error('Failed to edit message:', err)
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  // No conversation selected
  if (!selectedConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the list or start a new one.
          </p>
        </div>
      </div>
    )
  }

  // Messages are ordered newest first from the API, reverse for display
  const displayMessages = [...messages].reverse()

  // Group messages by date and consecutive sender
  const renderMessages = () => {
    if (displayMessages.length === 0 && !messagesLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium mb-1">No messages yet</p>
            <p className="text-xs text-muted-foreground">Say hello!</p>
          </div>
        </div>
      )
    }

    const elements: React.ReactNode[] = []
    let lastDateKey = ''

    for (let i = 0; i < displayMessages.length; i++) {
      const msg = displayMessages[i]
      const dateKey = getDateKey(msg.created_at)

      // Date separator
      if (dateKey !== lastDateKey) {
        lastDateKey = dateKey
        elements.push(
          <div key={`date-${dateKey}`} className="flex items-center gap-3 py-3 px-4">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
              {formatDateSeparator(msg.created_at)}
            </span>
            <Separator className="flex-1" />
          </div>
        )
      }

      // Check grouping with previous message
      const prevMsg = i > 0 ? displayMessages[i - 1] : null
      const showSenderInfo =
        !prevMsg ||
        getDateKey(prevMsg.created_at) !== dateKey ||
        !shouldGroup(prevMsg, msg)

      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwnMessage={msg.sender_id === userId}
          showSenderInfo={showSenderInfo}
          currentUserId={userId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )
    }

    return elements
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {selectedConversation?.type === 'channel' ? (
            <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          ) : selectedConversation?.type === 'dm' ? (
            <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
          <h3 className="text-sm font-semibold truncate">{conversationTitle}</h3>
          {selectedConversation?.type === 'channel' && selectedConversation.description && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              — {selectedConversation.description}
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Deal links */}
        <DealLinkManager
          conversationId={selectedConversationId!}
          teamId={teamId}
          userId={userId}
        />

        {/* Settings */}
        {selectedConversation && (
          <ConversationSettings
            conversation={selectedConversation}
            userId={userId}
          />
        )}
      </div>

      {/* Message area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* Loading older messages */}
        {messagesLoading && messages.length > 0 && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Initial loading */}
        {messagesLoading && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {renderMessages()}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        disabled={readOnly}
      />
    </div>
  )
}
