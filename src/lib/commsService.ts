import { supabase } from './supabase'
import { MESSAGES_PAGE_SIZE, CONVERSATIONS_PAGE_SIZE, MESSAGE_EDIT_WINDOW_MINUTES, MESSAGE_DELETE_WINDOW_MINUTES } from './commsConstants'
import { uploadMessageAttachment } from './commsStorageService'
import type {
  Conversation,
  ConversationParticipant,
  ConversationType,
  Message,
  MessageWithSender,
  ConversationPreview,
  CreateConversationInput,
  SendMessageInput,
} from '@/types/comms.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================================================
// Conversation Operations
// ============================================================================

/**
 * Get user's conversations with previews (last message, unread count, participants).
 * Uses the get_user_conversations RPC function.
 */
export async function getUserConversations(
  teamId: string,
  userId: string,
  options?: { limit?: number; offset?: number; type?: ConversationType }
): Promise<ConversationPreview[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.rpc('get_user_conversations', {
    p_user_id: userId,
    p_team_id: teamId,
    p_limit: options?.limit ?? CONVERSATIONS_PAGE_SIZE,
    p_offset: options?.offset ?? 0,
  })

  if (error) throw error

  let results = (data || []) as Array<{
    conversation_id: string
    conversation_type: ConversationType
    conversation_name: string | null
    is_default: boolean
    last_message_at: string | null
    last_message_content: string | null
    last_message_sender_id: string | null
    last_message_sender_name: string | null
    unread_count: number
    participant_count: number
    participant_names: string[] | null
  }>

  // Filter by type if specified
  if (options?.type) {
    results = results.filter((r) => r.conversation_type === options.type)
  }

  return results.map((row) => ({
    id: row.conversation_id,
    team_id: teamId,
    type: row.conversation_type,
    name: row.conversation_name,
    description: null,
    is_default: row.is_default,
    created_by: '',
    created_at: '',
    updated_at: '',
    last_message_at: row.last_message_at,
    last_message: row.last_message_content
      ? {
          content: row.last_message_content,
          sender_name: row.last_message_sender_name,
          created_at: row.last_message_at ?? '',
        }
      : undefined,
    unread_count: Number(row.unread_count) || 0,
    participants: (row.participant_names || []).map((name) => ({
      id: '',
      full_name: name,
      avatar_url: null,
    })),
  }))
}

/**
 * Get a single conversation with full details and participants.
 */
export async function getConversation(
  conversationId: string
): Promise<(Conversation & { participants: ConversationParticipant[] }) | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(*)
    `)
    .eq('id', conversationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as Conversation & { participants: ConversationParticipant[] }
}

/**
 * Create a new conversation (DM, group, or channel).
 * For DMs: checks if a DM already exists between the two users and returns it.
 */
export async function createConversation(
  teamId: string,
  userId: string,
  input: CreateConversationInput
): Promise<Conversation> {
  if (!supabase) throw new Error('Supabase not configured')

  // DM deduplication: check if DM already exists between these two users
  if (input.type === 'dm' && input.participant_ids.length === 1) {
    const otherUserId = input.participant_ids[0]
    const existing = await findExistingDM(userId, otherUserId)
    if (existing) return existing
  }

  // Create the conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      team_id: teamId,
      type: input.type,
      name: input.name ?? null,
      description: input.description ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (convError) throw convError

  // Add participants (include the creator)
  const allParticipantIds = [userId, ...input.participant_ids.filter((id) => id !== userId)]
  const participantRows = allParticipantIds.map((uid) => ({
    conversation_id: conversation.id,
    user_id: uid,
    role: uid === userId ? 'admin' : 'member',
  }))

  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(participantRows)

  if (partError) throw partError

  // Link deals if provided
  if (input.deal_ids && input.deal_ids.length > 0) {
    const dealLinkRows = input.deal_ids.map((dealId) => ({
      conversation_id: conversation.id,
      deal_id: dealId,
      linked_by: userId,
    }))

    const { error: dealError } = await supabase
      .from('conversation_deal_links')
      .insert(dealLinkRows)

    if (dealError) throw dealError
  }

  // Send initial message if provided
  if (input.initial_message) {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: userId,
      sender_type: 'user',
      content: input.initial_message,
    })
  }

  return conversation as Conversation
}

/**
 * Find an existing DM between two users.
 */
async function findExistingDM(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  if (!supabase) return null

  // Find conversations where both users are participants and type is 'dm'
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(user_id)
    `)
    .eq('type', 'dm')

  if (error || !data) return null

  // Find the DM that has exactly these two participants
  const match = data.find((conv: { participants: Array<{ user_id: string }> }) => {
    const participantIds = conv.participants.map((p: { user_id: string }) => p.user_id)
    return (
      participantIds.length === 2 &&
      participantIds.includes(userId1) &&
      participantIds.includes(userId2)
    )
  })

  if (!match) return null
  const { participants: _, ...conversation } = match
  return conversation as Conversation
}

/**
 * Update conversation metadata (name, description).
 */
export async function updateConversation(
  conversationId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) throw error
}

/**
 * Add a participant to a conversation.
 */
export async function addParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member',
    })

  if (error) throw error
}

/**
 * Remove a participant (leave conversation).
 */
export async function removeParticipant(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Get messages for a conversation (paginated, newest first).
 * Uses cursor-based pagination via `before` message ID.
 */
export async function getMessages(
  conversationId: string,
  options?: { limit?: number; before?: string }
): Promise<MessageWithSender[]> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(id, email, full_name, avatar_url),
      automator:automators!sender_automator_id(id, name),
      attachments:message_attachments(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? MESSAGES_PAGE_SIZE)

  // Cursor pagination: get messages before this message's created_at
  if (options?.before) {
    const { data: cursorMsg } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', options.before)
      .single()

    if (cursorMsg) {
      query = query.lt('created_at', cursorMsg.created_at)
    }
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => {
    const sender = row.sender as { id: string; email: string; full_name: string | null; avatar_url: string | null } | null
    const automator = row.automator as { id: string; name: string } | null
    const attachments = row.attachments as MessageWithSender['attachments']
    return {
      ...row,
      sender: sender ?? undefined,
      automator: automator ?? undefined,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    } as MessageWithSender
  })
}

/**
 * Send a message to a conversation.
 * If attachments are provided, uploads them to storage and creates message_attachments rows.
 */
export async function sendMessage(
  conversationId: string,
  userId: string,
  input: SendMessageInput
): Promise<Message> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      sender_type: 'user',
      content: input.content,
      metadata: input.metadata ?? {},
    })
    .select()
    .single()

  if (error) throw error

  const message = data as Message

  // Upload attachments if provided
  if (input.attachments && input.attachments.length > 0) {
    // Get teamId from conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('team_id')
      .eq('id', conversationId)
      .single()

    const teamId = conv?.team_id ?? 'unknown'

    for (const file of input.attachments) {
      try {
        const uploaded = await uploadMessageAttachment(teamId, conversationId, file)
        await supabase.from('message_attachments').insert({
          message_id: message.id,
          file_name: uploaded.fileName,
          storage_path: uploaded.path,
          mime_type: uploaded.mimeType,
          file_size: uploaded.fileSize,
        })
      } catch (err) {
        console.error('Failed to upload attachment:', err)
      }
    }
  }

  return message
}

/**
 * Edit a message (only within edit window, only own messages).
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Fetch the message to check ownership and time window
  const { data: msg, error: fetchError } = await supabase
    .from('messages')
    .select('sender_id, created_at')
    .eq('id', messageId)
    .single()

  if (fetchError) throw fetchError
  if (!msg) throw new Error('Message not found')

  if (msg.sender_id !== userId) {
    throw new Error('You can only edit your own messages')
  }

  const createdAt = new Date(msg.created_at)
  const now = new Date()
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

  if (diffMinutes > MESSAGE_EDIT_WINDOW_MINUTES) {
    throw new Error(`Messages can only be edited within ${MESSAGE_EDIT_WINDOW_MINUTES} minutes`)
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content: newContent,
      is_edited: true,
      edited_at: now.toISOString(),
    })
    .eq('id', messageId)

  if (error) throw error
}

/**
 * Delete a message (soft delete — only within window, only own messages).
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Fetch the message to check ownership and time window
  const { data: msg, error: fetchError } = await supabase
    .from('messages')
    .select('sender_id, created_at')
    .eq('id', messageId)
    .single()

  if (fetchError) throw fetchError
  if (!msg) throw new Error('Message not found')

  if (msg.sender_id !== userId) {
    throw new Error('You can only delete your own messages')
  }

  const createdAt = new Date(msg.created_at)
  const now = new Date()
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

  if (diffMinutes > MESSAGE_DELETE_WINDOW_MINUTES) {
    throw new Error(`Messages can only be deleted within ${MESSAGE_DELETE_WINDOW_MINUTES} minutes`)
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId)

  if (error) throw error
}

// ============================================================================
// Read State Operations
// ============================================================================

/**
 * Mark a conversation as read by updating last_read_message_id.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string,
  messageId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_message_id: messageId })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Get total unread count across all conversations (for nav badge).
 */
export async function getTotalUnreadCount(
  teamId: string,
  userId: string
): Promise<number> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.rpc('get_unread_counts', {
    p_user_id: userId,
    p_team_id: teamId,
  })

  if (error) throw error

  return (data || []).reduce(
    (sum: number, row: { unread_count: number }) => sum + Number(row.unread_count),
    0
  )
}

// ============================================================================
// Deal Link Operations
// ============================================================================

/**
 * Link a deal to a conversation.
 */
export async function linkDealToConversation(
  conversationId: string,
  dealId: string,
  userId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_deal_links')
    .insert({
      conversation_id: conversationId,
      deal_id: dealId,
      linked_by: userId,
    })

  if (error) throw error
}

/**
 * Unlink a deal from a conversation.
 */
export async function unlinkDealFromConversation(
  conversationId: string,
  dealId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_deal_links')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('deal_id', dealId)

  if (error) throw error
}

/**
 * Get conversations linked to a specific deal.
 */
export async function getConversationsForDeal(
  dealId: string
): Promise<ConversationPreview[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('conversation_deal_links')
    .select(`
      conversation:conversations!conversation_id(
        *,
        participants:conversation_participants(
          user:users!user_id(id, full_name, avatar_url)
        )
      )
    `)
    .eq('deal_id', dealId)

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => {
    const conv = row.conversation as Record<string, unknown>
    const participants = (conv.participants as Array<{ user: { id: string; full_name: string | null; avatar_url: string | null } }>) || []
    return {
      ...conv,
      unread_count: 0,
      participants: participants.map((p) => p.user),
    } as ConversationPreview
  })
}

/**
 * Get or create a deal's primary chat conversation.
 */
export async function getDealChatConversation(
  dealId: string,
  teamId: string,
  userId: string
): Promise<Conversation> {
  if (!supabase) throw new Error('Supabase not configured')

  // Check if a conversation already exists for this deal
  const { data: existing } = await supabase
    .from('conversation_deal_links')
    .select('conversation:conversations!conversation_id(*)')
    .eq('deal_id', dealId)
    .limit(1)

  if (existing && existing.length > 0) {
    return (existing[0] as unknown as { conversation: Conversation }).conversation
  }

  // Create a new conversation linked to this deal
  return createConversation(teamId, userId, {
    type: 'group',
    name: 'Deal Chat',
    participant_ids: [userId],
    deal_ids: [dealId],
  })
}

// ============================================================================
// Realtime Subscriptions
// ============================================================================

/**
 * Subscribe to new messages in a conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: MessageWithSender) => void
): () => void {
  if (!supabase) throw new Error('Supabase not configured')

  const channel: RealtimeChannel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch the full message with sender data and attachments
        const { data } = await supabase!
          .from('messages')
          .select(`
            *,
            sender:users!sender_id(id, email, full_name, avatar_url),
            automator:automators!sender_automator_id(id, name),
            attachments:message_attachments(*)
          `)
          .eq('id', (payload.new as { id: string }).id)
          .single()

        if (data) {
          const sender = data.sender as { id: string; email: string; full_name: string | null; avatar_url: string | null } | null
          const automator = data.automator as { id: string; name: string } | null
          const attachments = (data as Record<string, unknown>).attachments as MessageWithSender['attachments']
          onMessage({
            ...data,
            sender: sender ?? undefined,
            automator: automator ?? undefined,
            attachments: attachments && attachments.length > 0 ? attachments : undefined,
          } as MessageWithSender)
        }
      }
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}

/**
 * Subscribe to conversation list updates (new conversations, updated last_message_at).
 * Returns an unsubscribe function.
 */
export function subscribeToConversations(
  teamId: string,
  userId: string,
  onUpdate: () => void
): () => void {
  if (!supabase) throw new Error('Supabase not configured')

  const channel: RealtimeChannel = supabase
    .channel(`conversations-${teamId}-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${userId}`,
      },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
      },
      () => onUpdate()
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}

/**
 * Lightweight realtime subscription for unread badge updates.
 * Listens for new messages in the team and triggers a callback to refresh counts.
 * Designed for use in the Sidebar (always mounted) so the badge updates
 * even when the user is not on the Comms page.
 */
export function subscribeToUnreadUpdates(
  teamId: string,
  onUpdate: () => void
): () => void {
  if (!supabase) throw new Error('Supabase not configured')

  const channel: RealtimeChannel = supabase
    .channel(`unread-badge-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      () => onUpdate()
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}

// ============================================================================
// Message Search
// ============================================================================

export interface MessageSearchResult {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_type: string
  content: string
  created_at: string
  sender: { id: string; email: string; full_name: string | null; avatar_url: string | null } | null
  conversation_name: string | null
  conversation_type: string
}

/**
 * Search messages across all accessible conversations.
 */
export async function searchMessages(
  teamId: string,
  query: string,
  options?: {
    conversationId?: string
    limit?: number
    offset?: number
  }
): Promise<{ results: MessageSearchResult[]; total: number }> {
  if (!supabase) throw new Error('Supabase not configured')

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  // Search messages via ilike (RLS ensures user only sees messages in their conversations)
  let msgQuery = supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      sender_type,
      content,
      created_at,
      sender:users!sender_id(id, email, full_name, avatar_url),
      conversation:conversations!conversation_id(name, type, team_id)
    `, { count: 'exact' })
    .ilike('content', `%${query}%`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.conversationId) {
    msgQuery = msgQuery.eq('conversation_id', options.conversationId)
  }

  const { data, count, error } = await msgQuery

  if (error) throw error

  const results: MessageSearchResult[] = (data || [])
    .filter((row: Record<string, unknown>) => {
      // Filter to team messages (RLS should handle this but double-check)
      const conv = row.conversation as { name: string | null; type: string; team_id: string } | null
      return conv?.team_id === teamId
    })
    .map((row: Record<string, unknown>) => {
      const sender = row.sender as { id: string; email: string; full_name: string | null; avatar_url: string | null } | null
      const conv = row.conversation as { name: string | null; type: string; team_id: string } | null
      return {
        id: row.id as string,
        conversation_id: row.conversation_id as string,
        sender_id: row.sender_id as string | null,
        sender_type: row.sender_type as string,
        content: row.content as string,
        created_at: row.created_at as string,
        sender,
        conversation_name: conv?.name ?? null,
        conversation_type: conv?.type ?? 'dm',
      }
    })

  return { results, total: count ?? 0 }
}

// ============================================================================
// Team Members Helper
// ============================================================================

/**
 * Get team members for participant picker.
 */
export async function getTeamMembersForComms(
  teamId: string
): Promise<{ id: string; full_name: string | null; avatar_url: string | null }[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('team_members')
    .select(`
      user:users!user_id(id, full_name, avatar_url)
    `)
    .eq('team_id', teamId)

  if (error) throw error

  return ((data || []) as unknown as { user: { id: string; full_name: string | null; avatar_url: string | null } }[]).map((row) => row.user)
}

// ============================================================================
// Mute / Leave / Rename Operations
// ============================================================================

/**
 * Toggle mute state for a conversation.
 */
export async function toggleMuteConversation(
  conversationId: string,
  userId: string,
  muted: boolean
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_participants')
    .update({ is_muted: muted })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Leave a conversation (remove self as participant).
 */
export async function leaveConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Rename a conversation (only for group/channel types).
 */
export async function renameConversation(
  conversationId: string,
  name: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversations')
    .update({ name })
    .eq('id', conversationId)

  if (error) throw error
}

/**
 * Get mute state for a conversation participant.
 */
export async function getParticipantInfo(
  conversationId: string,
  userId: string
): Promise<{ is_muted: boolean; role: string } | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('conversation_participants')
    .select('is_muted, role')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

// ============================================================================
// Channel Operations
// ============================================================================

/**
 * Ensure the team has a default 'General' channel and the user is a participant.
 * Delegates to a SECURITY DEFINER database function that handles:
 * - Creating the channel if it doesn't exist (race-safe via unique constraint)
 * - Adding the calling user as a participant if they aren't already
 * Uses an in-flight map to prevent concurrent client-side calls.
 */
const _ensureDefaultChannelInFlight = new Map<string, Promise<Conversation>>()

export function ensureDefaultChannel(
  teamId: string,
  userId: string
): Promise<Conversation> {
  const existing = _ensureDefaultChannelInFlight.get(teamId)
  if (existing) return existing

  const promise = _ensureDefaultChannelImpl(teamId, userId).finally(() => {
    _ensureDefaultChannelInFlight.delete(teamId)
  })
  _ensureDefaultChannelInFlight.set(teamId, promise)
  return promise
}

async function _ensureDefaultChannelImpl(
  teamId: string,
  userId: string
): Promise<Conversation> {
  if (!supabase) throw new Error('Supabase not configured')

  // Call the server-side function which bypasses RLS to handle all edge cases
  const { data: channelId, error: rpcError } = await supabase
    .rpc('ensure_default_channel', { p_team_id: teamId, p_user_id: userId })

  if (rpcError) throw rpcError

  // Now the user is a participant, so they can read the channel via RLS
  const { data: channel, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', channelId)
    .single()

  if (fetchError) throw fetchError

  return channel as Conversation
}

/**
 * Create a new channel and add all team members.
 */
export async function createChannel(
  teamId: string,
  userId: string,
  name: string,
  description?: string
): Promise<Conversation> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: channel, error: convError } = await supabase
    .from('conversations')
    .insert({
      team_id: teamId,
      type: 'channel',
      name,
      description: description ?? null,
      is_default: false,
      created_by: userId,
    })
    .select()
    .single()

  if (convError) throw convError

  // Auto-join all team members
  const members = await getTeamMembersForComms(teamId)
  if (members.length > 0) {
    const participantRows = members.map((m) => ({
      conversation_id: channel.id,
      user_id: m.id,
      role: m.id === userId ? 'admin' : 'member',
    }))

    await supabase
      .from('conversation_participants')
      .insert(participantRows)
  }

  return channel as Conversation
}

/**
 * Archive a channel (soft-delete — hide from list but preserve messages).
 * Cannot archive the default channel.
 */
export async function archiveChannel(
  conversationId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Verify it's not the default channel
  const { data: conv } = await supabase
    .from('conversations')
    .select('is_default')
    .eq('id', conversationId)
    .single()

  if (conv?.is_default) {
    throw new Error('Cannot archive the default channel')
  }

  // Soft-delete by updating deleted_at (or we can use a status field)
  // Since conversations table doesn't have deleted_at, we'll rename with [Archived] prefix
  // and remove all participants to hide it from lists
  const { error } = await supabase
    .from('conversations')
    .update({ name: null, description: '[Archived]' })
    .eq('id', conversationId)

  if (error) throw error

  // Remove all participants
  const { error: partError } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)

  if (partError) throw partError
}

/**
 * Get all channels for a team (for management UI).
 */
export async function getTeamChannels(
  teamId: string
): Promise<(Conversation & { participant_count: number })[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(count)
    `)
    .eq('team_id', teamId)
    .eq('type', 'channel')
    .neq('description', '[Archived]')
    .order('is_default', { ascending: false })
    .order('name')

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => {
    const participants = row.participants as Array<{ count: number }> | undefined
    return {
      ...row,
      participant_count: participants?.[0]?.count ?? 0,
    } as Conversation & { participant_count: number }
  })
}

/**
 * Update a channel's name and/or description.
 */
export async function updateChannel(
  conversationId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .eq('type', 'channel')

  if (error) throw error
}
