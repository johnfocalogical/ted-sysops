// ============================================================================
// Comms Types - Internal messaging & deal-centric communication
// ============================================================================

// ============================================================================
// Enums (matching database enum values)
// ============================================================================

export type ConversationType = 'dm' | 'group' | 'channel'

export type MessageSenderType = 'user' | 'system' | 'automator'

// ============================================================================
// Core Entity Interfaces
// ============================================================================

export interface Conversation {
  id: string
  team_id: string
  type: ConversationType
  name: string | null
  description: string | null
  is_default: boolean
  created_by: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_message_id: string | null
  is_muted: boolean
  role: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_type: MessageSenderType
  content: string
  metadata: MessageMetadata
  is_edited: boolean
  edited_at: string | null
  is_deleted: boolean
  sender_automator_id: string | null
  created_at: string
}

export interface ConversationDealLink {
  id: string
  conversation_id: string
  deal_id: string
  linked_by: string
  linked_at: string
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  created_at: string
}

// ============================================================================
// Message Metadata (Rich References)
// ============================================================================

export interface MessageMetadata {
  deal_references?: DealReference[]
  contact_references?: ContactReference[]
  financial_references?: FinancialReference[]
  deal_snapshot?: DealSnapshot
  confirmation?: MessageConfirmation
}

export interface DealReference {
  deal_id: string
  address: string
  status: string
  deal_type: string
  projected_profit?: number
}

export interface ContactReference {
  contact_id: string
  name: string
  type: string
  primary_contact?: string
}

export interface FinancialReference {
  deal_id: string
  label: string
  amount: number
  type: 'profit' | 'expense' | 'commission' | 'revenue'
}

export interface DealSnapshot {
  deal_id: string
  address: string
  status: string
  financial_summary: Record<string, number>
  checklist_progress: number
  assigned_employees: string[]
  captured_at: string
}

export interface MessageConfirmation {
  node_id: string
  instance_id: string
  assignee: 'specific_user' | 'deal_owner' | 'any_participant'
  assignee_user_id?: string
  status: 'pending' | 'confirmed' | 'timed_out'
  confirmed_by?: string
  confirmed_by_name?: string
  confirmed_at?: string
}

// ============================================================================
// Extended / Joined Interfaces (for views with related data)
// ============================================================================

export interface MessageWithSender extends Message {
  sender?: {
    id: string
    email?: string
    full_name: string | null
    avatar_url: string | null
  }
  automator?: {
    id: string
    name: string
  }
  attachments?: MessageAttachment[]
}

export interface ConversationPreview extends Conversation {
  last_message?: {
    content: string
    sender_name: string | null
    created_at: string
  }
  unread_count: number
  participants: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }[]
}

// ============================================================================
// DTOs (Data Transfer Objects for create/update operations)
// ============================================================================

export interface CreateConversationInput {
  type: ConversationType
  name?: string
  description?: string
  participant_ids: string[]
  deal_ids?: string[]
  initial_message?: string
}

export interface SendMessageInput {
  conversation_id: string
  content: string
  metadata?: Partial<MessageMetadata>
  attachments?: File[]
}
