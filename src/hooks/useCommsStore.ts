import { create } from 'zustand'
import type {
  Conversation,
  ConversationType,
  ConversationPreview,
  MessageWithSender,
  CreateConversationInput,
  SendMessageInput,
} from '@/types/comms.types'
import { MESSAGES_PAGE_SIZE } from '@/lib/commsConstants'
import * as commsService from '@/lib/commsService'

// ============================================================================
// Types
// ============================================================================

interface CommsState {
  // Context
  teamId: string | null
  userId: string | null
  userName: string | null
  userAvatarUrl: string | null

  // Conversation list
  conversations: ConversationPreview[]
  conversationsLoading: boolean
  selectedConversationId: string | null

  // Messages for selected conversation
  messages: MessageWithSender[]
  messagesLoading: boolean
  hasMoreMessages: boolean

  // Unread tracking
  totalUnreadCount: number

  // Filters
  conversationTypeFilter: ConversationType | null
  searchQuery: string

  // Actions
  setTeamId: (teamId: string) => void
  setUser: (userId: string, fullName: string | null, avatarUrl: string | null) => void

  // Conversation actions
  loadConversations: () => Promise<void>
  selectConversation: (conversationId: string | null) => void
  createConversation: (input: CreateConversationInput) => Promise<Conversation>

  // Message actions
  loadMessages: (conversationId: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  sendMessage: (input: SendMessageInput) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>

  // Read state
  markAsRead: (conversationId: string) => Promise<void>
  loadUnreadCount: () => Promise<void>

  // Realtime
  addRealtimeMessage: (message: MessageWithSender) => void

  // Filters
  setConversationTypeFilter: (type: ConversationType | null) => void
  setSearchQuery: (query: string) => void

  // Cleanup
  clearStore: () => void
}

// ============================================================================
// Store
// ============================================================================

export const useCommsStore = create<CommsState>((set, get) => ({
  // Initial state
  teamId: null,
  userId: null,
  userName: null,
  userAvatarUrl: null,
  conversations: [],
  conversationsLoading: false,
  selectedConversationId: null,
  messages: [],
  messagesLoading: false,
  hasMoreMessages: true,
  totalUnreadCount: 0,
  conversationTypeFilter: null,
  searchQuery: '',

  // ============================================================================
  // Context
  // ============================================================================

  setTeamId: (teamId: string) => {
    const state = get()
    if (state.teamId !== teamId) {
      set({
        teamId,
        conversations: [],
        messages: [],
        selectedConversationId: null,
        totalUnreadCount: 0,
      })
    }
  },

  setUser: (userId: string, fullName: string | null, avatarUrl: string | null) => {
    set({ userId, userName: fullName, userAvatarUrl: avatarUrl })
  },

  // ============================================================================
  // Conversation Actions
  // ============================================================================

  loadConversations: async () => {
    const { teamId, userId, conversationTypeFilter } = get()
    if (!teamId || !userId) return

    set({ conversationsLoading: true })

    try {
      const conversations = await commsService.getUserConversations(
        teamId,
        userId,
        { type: conversationTypeFilter ?? undefined }
      )

      // Apply search filter client-side
      const { searchQuery } = get()
      const filtered = searchQuery
        ? conversations.filter((c) => {
            const name = c.name?.toLowerCase() ?? ''
            const participantNames = c.participants
              .map((p) => p.full_name?.toLowerCase() ?? '')
              .join(' ')
            const query = searchQuery.toLowerCase()
            return name.includes(query) || participantNames.includes(query)
          })
        : conversations

      set({ conversations: filtered, conversationsLoading: false })
    } catch (err) {
      console.error('Failed to load conversations:', err)
      set({ conversationsLoading: false })
    }
  },

  selectConversation: (conversationId: string | null) => {
    set({
      selectedConversationId: conversationId,
      messages: [],
      hasMoreMessages: true,
    })

    if (conversationId) {
      get().loadMessages(conversationId)
    }
  },

  createConversation: async (input: CreateConversationInput) => {
    const { teamId, userId } = get()
    if (!teamId || !userId) throw new Error('Not initialized')

    const conversation = await commsService.createConversation(teamId, userId, input)

    // Reload conversations to include the new one
    get().loadConversations()

    return conversation
  },

  // ============================================================================
  // Message Actions
  // ============================================================================

  loadMessages: async (conversationId: string) => {
    set({ messagesLoading: true })

    try {
      const messages = await commsService.getMessages(conversationId, {
        limit: MESSAGES_PAGE_SIZE,
      })

      set({
        messages,
        messagesLoading: false,
        hasMoreMessages: messages.length >= MESSAGES_PAGE_SIZE,
      })

      // Mark conversation as read if there are messages
      if (messages.length > 0) {
        get().markAsRead(conversationId)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
      set({ messagesLoading: false })
    }
  },

  loadMoreMessages: async () => {
    const { selectedConversationId, messages, hasMoreMessages, messagesLoading } = get()
    if (!selectedConversationId || !hasMoreMessages || messagesLoading) return

    set({ messagesLoading: true })

    try {
      // Use the oldest message's ID as cursor
      const oldestMessage = messages[messages.length - 1]
      const olderMessages = await commsService.getMessages(selectedConversationId, {
        limit: MESSAGES_PAGE_SIZE,
        before: oldestMessage?.id,
      })

      set({
        messages: [...messages, ...olderMessages],
        messagesLoading: false,
        hasMoreMessages: olderMessages.length >= MESSAGES_PAGE_SIZE,
      })
    } catch (err) {
      console.error('Failed to load more messages:', err)
      set({ messagesLoading: false })
    }
  },

  sendMessage: async (input: SendMessageInput) => {
    const { userId, userName, userAvatarUrl, selectedConversationId, messages } = get()
    if (!userId || !selectedConversationId) return

    // Optimistic update: add message immediately with temp ID
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      conversation_id: selectedConversationId,
      sender_id: userId,
      sender_type: 'user',
      content: input.content,
      metadata: input.metadata ?? {},
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      sender_automator_id: null,
      created_at: new Date().toISOString(),
      sender: {
        id: userId,
        full_name: userName,
        avatar_url: userAvatarUrl,
      },
    }

    set({ messages: [optimisticMessage, ...messages] })

    try {
      const serverMessage = await commsService.sendMessage(
        selectedConversationId,
        userId,
        input
      )

      // Replace temp message with server response (keep sender from server if available)
      set({
        messages: get().messages.map((m) =>
          m.id === tempId ? { ...serverMessage, sender: (serverMessage as MessageWithSender).sender ?? optimisticMessage.sender } : m
        ),
      })
    } catch (err) {
      // Remove optimistic message on failure
      set({ messages: get().messages.filter((m) => m.id !== tempId) })
      throw err
    }
  },

  editMessage: async (messageId: string, content: string) => {
    const { userId } = get()
    if (!userId) return

    await commsService.editMessage(messageId, userId, content)

    // Update locally
    set({
      messages: get().messages.map((m) =>
        m.id === messageId
          ? { ...m, content, is_edited: true, edited_at: new Date().toISOString() }
          : m
      ),
    })
  },

  deleteMessage: async (messageId: string) => {
    const { userId } = get()
    if (!userId) return

    await commsService.deleteMessage(messageId, userId)

    // Update locally (soft delete)
    set({
      messages: get().messages.map((m) =>
        m.id === messageId ? { ...m, is_deleted: true } : m
      ),
    })
  },

  // ============================================================================
  // Read State
  // ============================================================================

  markAsRead: async (conversationId: string) => {
    const { userId, messages } = get()
    if (!userId || messages.length === 0) return

    // The newest message is the first one (messages ordered newest first)
    const newestMessage = messages[0]
    if (!newestMessage) return

    try {
      await commsService.markConversationRead(conversationId, userId, newestMessage.id)

      // Update unread count in conversation list
      set({
        conversations: get().conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
      })

      // Reload total unread
      get().loadUnreadCount()
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  },

  loadUnreadCount: async () => {
    const { teamId, userId } = get()
    if (!teamId || !userId) return

    try {
      const totalUnreadCount = await commsService.getTotalUnreadCount(teamId, userId)
      set({ totalUnreadCount })
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  },

  // ============================================================================
  // Realtime
  // ============================================================================

  addRealtimeMessage: (message: MessageWithSender) => {
    const { selectedConversationId, messages, conversations } = get()

    // If viewing the conversation this message belongs to, add it to the list
    if (message.conversation_id === selectedConversationId) {
      // Avoid duplicates (optimistic send may have already added it)
      const exists = messages.some((m) => m.id === message.id)
      if (!exists) {
        set({ messages: [message, ...messages] })
      }

      // Auto-mark as read since user is viewing this conversation
      get().markAsRead(message.conversation_id)
    } else {
      // Message is in a different conversation — increment unread
      set({
        totalUnreadCount: get().totalUnreadCount + 1,
        conversations: conversations.map((c) =>
          c.id === message.conversation_id
            ? { ...c, unread_count: c.unread_count + 1 }
            : c
        ),
      })
    }

    // Update conversation preview and move to top
    set({
      conversations: [
        ...get().conversations
          .map((c) =>
            c.id === message.conversation_id
              ? {
                  ...c,
                  last_message_at: message.created_at,
                  last_message: {
                    content: message.content,
                    sender_name: message.sender?.full_name ?? null,
                    created_at: message.created_at,
                  },
                }
              : c
          )
          .sort((a, b) => {
            const aTime = a.last_message_at ?? a.created_at
            const bTime = b.last_message_at ?? b.created_at
            return bTime.localeCompare(aTime)
          }),
      ],
    })
  },

  // ============================================================================
  // Filters
  // ============================================================================

  setConversationTypeFilter: (type: ConversationType | null) => {
    set({ conversationTypeFilter: type })
    get().loadConversations()
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
    get().loadConversations()
  },

  // ============================================================================
  // Cleanup
  // ============================================================================

  clearStore: () => {
    set({
      teamId: null,
      userId: null,
      userName: null,
      userAvatarUrl: null,
      conversations: [],
      conversationsLoading: false,
      selectedConversationId: null,
      messages: [],
      messagesLoading: false,
      hasMoreMessages: true,
      totalUnreadCount: 0,
      conversationTypeFilter: null,
      searchQuery: '',
    })
  },
}))
