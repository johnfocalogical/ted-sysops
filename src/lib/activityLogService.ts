import { supabase } from './supabase'
import type {
  ActivityLog,
  ActivityLogWithUser,
  CreateActivityLogDTO,
  ActivityEntityType,
  PaginatedActivityLogs,
} from '@/types/activity.types'

// ============================================================================
// Activity Log Service
// Universal activity tracking across contacts, companies, deals, etc.
// ============================================================================

/**
 * Get activity logs for a specific entity (contact, company, etc.)
 */
export async function getActivityLogsForEntity(
  entityType: ActivityEntityType,
  entityId: string,
  options?: { limit?: number; offset?: number }
): Promise<PaginatedActivityLogs> {
  if (!supabase) throw new Error('Supabase not configured')

  const { limit = 20, offset = 0 } = options || {}

  // Build the query based on entity type
  let query = supabase
    .from('activity_logs')
    .select(
      `
      *,
      user:users!activity_logs_user_id_fkey (
        id,
        full_name,
        email
      )
    `,
      { count: 'exact' }
    )
    .eq('entity_type', entityType)

  // Add the entity-specific filter
  if (entityType === 'contact') {
    query = query.eq('contact_id', entityId)
  } else if (entityType === 'company') {
    query = query.eq('company_id', entityId)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  const total = count || 0
  const hasMore = offset + limit < total

  return {
    data: (data || []) as ActivityLogWithUser[],
    total,
    hasMore,
  }
}

/**
 * Get activity logs for a specific user across a team
 */
export async function getActivityLogsForUser(
  userId: string,
  teamId: string,
  options?: { limit?: number; offset?: number }
): Promise<PaginatedActivityLogs> {
  if (!supabase) throw new Error('Supabase not configured')

  const { limit = 20, offset = 0 } = options || {}

  const { data, count, error } = await supabase
    .from('activity_logs')
    .select(
      `
      *,
      user:users!activity_logs_user_id_fkey (
        id,
        full_name,
        email
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  const total = count || 0
  const hasMore = offset + limit < total

  return {
    data: (data || []) as ActivityLogWithUser[],
    total,
    hasMore,
  }
}

/**
 * Create a new activity log entry
 */
export async function createActivityLog(
  dto: CreateActivityLogDTO,
  userId: string
): Promise<ActivityLog> {
  if (!supabase) throw new Error('Supabase not configured')

  // Build the insert data based on entity type
  const insertData: Record<string, unknown> = {
    team_id: dto.team_id,
    user_id: userId,
    entity_type: dto.entity_type,
    activity_type: dto.activity_type,
    content: dto.content || null,
    metadata: dto.metadata || null,
  }

  // Set the appropriate entity FK
  if (dto.entity_type === 'contact' && dto.contact_id) {
    insertData.contact_id = dto.contact_id
  } else if (dto.entity_type === 'company' && dto.company_id) {
    insertData.company_id = dto.company_id
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error

  return data as ActivityLog
}

/**
 * Delete an activity log entry
 */
export async function deleteActivityLog(activityId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', activityId)

  if (error) throw error
}

/**
 * Update an activity log entry (for editing comments)
 */
export async function updateActivityLog(
  activityId: string,
  content: string
): Promise<ActivityLog> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('activity_logs')
    .update({ content })
    .eq('id', activityId)
    .select()
    .single()

  if (error) throw error

  return data as ActivityLog
}

/**
 * Convenience function: Add a comment to an entity
 */
export async function addComment(
  entityType: ActivityEntityType,
  entityId: string,
  content: string,
  userId: string,
  teamId: string
): Promise<ActivityLogWithUser> {
  if (!supabase) throw new Error('Supabase not configured')

  const dto: CreateActivityLogDTO = {
    team_id: teamId,
    entity_type: entityType,
    activity_type: 'comment',
    content,
  }

  // Set the appropriate entity ID
  if (entityType === 'contact') {
    dto.contact_id = entityId
  } else if (entityType === 'company') {
    dto.company_id = entityId
  }

  // Create the activity log
  const activityLog = await createActivityLog(dto, userId)

  // Fetch with user data
  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      `
      *,
      user:users!activity_logs_user_id_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq('id', activityLog.id)
    .single()

  if (error) throw error

  return data as ActivityLogWithUser
}
