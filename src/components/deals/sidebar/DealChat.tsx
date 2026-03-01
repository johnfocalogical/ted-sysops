import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ExternalLink, MessagesSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageBubble } from '@/components/comms/MessageBubble'
import { MessageComposer } from '@/components/comms/MessageComposer'
import { useAuth } from '@/hooks/useAuth'
import * as commsService from '@/lib/commsService'
import { MESSAGES_PAGE_SIZE } from '@/lib/commsConstants'
import type { Conversation, MessageWithSender } from '@/types/comms.types'

interface DealChatProps {
  dealId: string
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

function shouldGroup(prev: MessageWithSender, curr: MessageWithSender): boolean {
  if (prev.sender_id !== curr.sender_id) return false
  if (prev.sender_type !== curr.sender_type) return false
  if (prev.sender_type !== 'user') return false
  const diff = Math.abs(
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()
  )
  return diff < 2 * 60 * 1000
}

export function DealChat({ dealId }: DealChatProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true)

  // Get or create the deal's conversation
  useEffect(() => {
    if (!teamId || !userId) return

    let cancelled = false

    const init = async () => {
      setLoading(true)
      try {
        const conv = await commsService.getDealChatConversation(dealId, teamId, userId)
        if (cancelled) return
        setConversation(conv)

        // Load messages
        const msgs = await commsService.getMessages(conv.id, {
          limit: MESSAGES_PAGE_SIZE,
        })
        if (cancelled) return
        setMessages(msgs)
        setHasMore(msgs.length >= MESSAGES_PAGE_SIZE)

        // Mark as read
        if (msgs.length > 0) {
          commsService.markConversationRead(conv.id, userId, msgs[0].id)
        }
      } catch (err) {
        console.error('Failed to load deal chat:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [dealId, teamId, userId])

  // Realtime subscription
  useEffect(() => {
    if (!conversation) return

    const unsubscribe = commsService.subscribeToMessages(
      conversation.id,
      (message: MessageWithSender) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [message, ...prev]
        })

        // Auto-mark as read
        if (userId) {
          commsService.markConversationRead(conversation.id, userId, message.id)
        }
      }
    )

    return unsubscribe
  }, [conversation?.id, userId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (wasAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
      wasAtBottomRef.current = true
    }
  }, [loading])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
      wasAtBottomRef.current = isAtBottom

      // Load more when near top
      if (el.scrollTop < 100 && hasMore && !messagesLoading && conversation) {
        loadMore()
      }
    },
    [hasMore, messagesLoading, conversation]
  )

  const loadMore = async () => {
    if (!conversation || !hasMore || messagesLoading) return

    setMessagesLoading(true)
    try {
      const oldest = messages[messages.length - 1]
      const older = await commsService.getMessages(conversation.id, {
        limit: MESSAGES_PAGE_SIZE,
        before: oldest?.id,
      })
      setMessages((prev) => [...prev, ...older])
      setHasMore(older.length >= MESSAGES_PAGE_SIZE)
    } catch (err) {
      console.error('Failed to load more messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSend = async (content: string) => {
    if (!conversation || !userId) return

    // Optimistic add
    const tempId = `temp-${Date.now()}`
    const optimistic: MessageWithSender = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: userId,
      sender_type: 'user',
      content,
      metadata: {},
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      sender_automator_id: null,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [optimistic, ...prev])

    try {
      const serverMsg = await commsService.sendMessage(conversation.id, userId, { conversation_id: conversation.id, content })
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...serverMsg, sender: optimistic.sender } : m
        )
      )
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      console.error('Failed to send message:', err)
    }
  }

  const handleEdit = async (messageId: string, content: string) => {
    if (!userId) return
    try {
      await commsService.editMessage(messageId, userId, content)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content, is_edited: true, edited_at: new Date().toISOString() }
            : m
        )
      )
    } catch (err) {
      console.error('Failed to edit message:', err)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!userId) return
    try {
      await commsService.deleteMessage(messageId, userId)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true } : m
        )
      )
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const openInComms = () => {
    if (orgId && teamId && conversation) {
      navigate(`/org/${orgId}/team/${teamId}/comms/${conversation.id}`)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No conversation yet (shouldn't happen since getDealChatConversation creates one)
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessagesSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium mb-1">Start the conversation</p>
        <p className="text-xs text-muted-foreground mb-4">
          Discuss this deal with your team in real-time.
        </p>
      </div>
    )
  }

  // Display messages chronologically (API returns newest first)
  const displayMessages = [...messages].reverse()

  const renderMessages = () => {
    if (displayMessages.length === 0 && !messagesLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessagesSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        </div>
      )
    }

    const elements: React.ReactNode[] = []
    let lastDateKey = ''

    for (let i = 0; i < displayMessages.length; i++) {
      const msg = displayMessages[i]
      const dateKey = getDateKey(msg.created_at)

      if (dateKey !== lastDateKey) {
        lastDateKey = dateKey
        elements.push(
          <div key={`date-${dateKey}`} className="flex items-center gap-2 py-2 px-3">
            <Separator className="flex-1" />
            <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0">
              {formatDateSeparator(msg.created_at)}
            </span>
            <Separator className="flex-1" />
          </div>
        )
      }

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
    <div className="flex flex-col h-full">
      {/* Header: Open in Comms link */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground">Deal Chat</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={openInComms}
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Open in Comms
        </Button>
      </div>

      {/* Message area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {messagesLoading && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {messagesLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {renderMessages()}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        placeholder="Message this deal..."
      />
    </div>
  )
}
