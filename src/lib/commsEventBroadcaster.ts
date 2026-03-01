import { supabase } from './supabase'

// ============================================================================
// Types
// ============================================================================

export type DealEventType =
  | 'status_change'
  | 'automator_milestone'
  | 'employee_change'
  | 'vendor_change'
  | 'financial_event'
  | 'checklist_completion'

export interface CommsSettings {
  broadcast_enabled: boolean
  events: Record<DealEventType, boolean>
  thresholds: {
    min_expense_amount: number
    min_profit_change_pct: number
  }
}

export const DEFAULT_COMMS_SETTINGS: CommsSettings = {
  broadcast_enabled: false,
  events: {
    status_change: false,
    automator_milestone: false,
    employee_change: false,
    vendor_change: false,
    financial_event: false,
    checklist_completion: false,
  },
  thresholds: {
    min_expense_amount: 200,
    min_profit_change_pct: 10,
  },
}

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Get the comms settings for a team.
 */
export async function getCommsSettings(teamId: string): Promise<CommsSettings> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('teams')
    .select('comms_settings')
    .eq('id', teamId)
    .single()

  if (error) throw error
  return (data?.comms_settings as CommsSettings) ?? DEFAULT_COMMS_SETTINGS
}

/**
 * Update the comms settings for a team.
 */
export async function updateCommsSettings(
  teamId: string,
  settings: CommsSettings
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('teams')
    .update({ comms_settings: settings })
    .eq('id', teamId)

  if (error) throw error
}

// ============================================================================
// Message Formatting
// ============================================================================

interface EventData {
  // status_change
  oldStatus?: string
  newStatus?: string
  actorName?: string

  // automator_milestone
  automatorName?: string
  instanceStatus?: string

  // employee_change / vendor_change
  personName?: string
  role?: string
  action?: 'assigned' | 'removed'

  // financial_event
  expenseCategory?: string
  expenseAmount?: number
  profitChange?: number

  // checklist_completion
  checklistItem?: string
}

function formatEventMessage(eventType: DealEventType, data: EventData): string {
  const actor = data.actorName ?? 'Someone'

  switch (eventType) {
    case 'status_change':
      return `Deal status changed to ${data.newStatus ?? 'unknown'} by ${actor}.`

    case 'automator_milestone':
      return `Automator "${data.automatorName ?? 'Unknown'}" ${data.instanceStatus === 'completed' ? 'completed' : 'updated'}.`

    case 'employee_change':
      if (data.action === 'removed') {
        return `${data.personName ?? 'Someone'} was removed${data.role ? ` as ${data.role}` : ''}.`
      }
      return `${data.personName ?? 'Someone'} was assigned${data.role ? ` as ${data.role}` : ''}.`

    case 'vendor_change':
      if (data.action === 'removed') {
        return `Vendor ${data.personName ?? 'unknown'} was removed${data.role ? ` (${data.role})` : ''}.`
      }
      return `Vendor ${data.personName ?? 'unknown'} was added${data.role ? ` as ${data.role}` : ''}.`

    case 'financial_event':
      if (data.expenseCategory && data.expenseAmount != null) {
        return `New expense added: ${data.expenseCategory} — $${data.expenseAmount.toLocaleString()}.`
      }
      return 'Financial data updated.'

    case 'checklist_completion':
      return `Checklist item completed: "${data.checklistItem ?? 'Unknown'}" ✓`

    default:
      return 'Deal updated.'
  }
}

// ============================================================================
// Broadcasting
// ============================================================================

/**
 * Broadcast a deal event as a system message to the deal's linked conversation.
 * Checks team settings to determine if the event type is enabled.
 * Only broadcasts to existing conversations — does not create new ones.
 * If teamId is not provided, it will be looked up from the deal.
 */
export async function broadcastDealEvent(
  dealId: string,
  teamIdOrNull: string | null,
  eventType: DealEventType,
  eventData: EventData
): Promise<void> {
  if (!supabase) return

  try {
    // Resolve teamId if not provided
    let teamId = teamIdOrNull
    if (!teamId) {
      const { data: deal } = await supabase
        .from('deals')
        .select('team_id')
        .eq('id', dealId)
        .single()
      if (!deal) return
      teamId = deal.team_id
    }

    // Check team settings
    if (!teamId) return
    const settings = await getCommsSettings(teamId)
    if (!settings.broadcast_enabled) return
    if (!settings.events[eventType]) return

    // Apply thresholds for financial events
    if (eventType === 'financial_event') {
      if (
        eventData.expenseAmount != null &&
        eventData.expenseAmount < settings.thresholds.min_expense_amount
      ) {
        return // Below threshold
      }
    }

    // Find the deal's linked conversation (don't create one)
    const { data: links } = await supabase
      .from('conversation_deal_links')
      .select('conversation_id')
      .eq('deal_id', dealId)
      .limit(1)

    if (!links || links.length === 0) return // No linked conversation

    const conversationId = links[0].conversation_id

    // Format and send the system message
    const content = formatEventMessage(eventType, eventData)

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: null,
      sender_type: 'system',
      content,
      metadata: {
        event_type: eventType,
        deal_id: dealId,
      },
    })

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
  } catch (err) {
    // Broadcasting should never break the main operation
    console.error('Failed to broadcast deal event:', err)
  }
}
