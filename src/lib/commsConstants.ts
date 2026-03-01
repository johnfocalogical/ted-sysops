import type { ConversationType } from '@/types/comms.types'

// Max message length
export const MAX_MESSAGE_LENGTH = 5000

// Pagination
export const MESSAGES_PAGE_SIZE = 50
export const CONVERSATIONS_PAGE_SIZE = 30

// Edit/delete time window (in minutes)
export const MESSAGE_EDIT_WINDOW_MINUTES = 15
export const MESSAGE_DELETE_WINDOW_MINUTES = 15

// System message templates
export const SYSTEM_MESSAGES = {
  PARTICIPANT_ADDED: '{user} was added to the conversation',
  PARTICIPANT_REMOVED: '{user} left the conversation',
  CONVERSATION_RENAMED: '{user} renamed the conversation to "{name}"',
  DEAL_LINKED: '{user} linked deal {address}',
  DEAL_UNLINKED: '{user} unlinked deal {address}',
  STATUS_CHANGED: 'Deal status changed to {status} by {user}',
} as const

// Conversation type labels and icons (for UI)
export const CONVERSATION_TYPE_CONFIG: Record<ConversationType, {
  label: string
  icon: string
}> = {
  dm: { label: 'Direct Message', icon: 'MessageCircle' },
  group: { label: 'Group', icon: 'Users' },
  channel: { label: 'Channel', icon: 'Hash' },
} as const
