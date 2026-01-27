// ============================================================================
// Activity Log Types
// Universal activity tracking across contacts, companies, deals, etc.
// ============================================================================

// Activity type - what kind of action was performed
export type ActivityType = 'comment' | 'created' | 'updated' | 'deleted' | 'status_change'

// Entity type - what entity the activity is about
export type ActivityEntityType = 'contact' | 'company' | 'deal' | 'employee'

// Base activity log matching database table
export interface ActivityLog {
  id: string
  team_id: string
  user_id: string
  contact_id: string | null
  company_id: string | null
  employee_profile_id: string | null
  entity_type: ActivityEntityType
  activity_type: ActivityType
  content: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Activity log with user details for display
export interface ActivityLogWithUser extends ActivityLog {
  user: {
    id: string
    full_name: string | null
    email: string
  }
}

// DTO for creating a new activity log entry
export interface CreateActivityLogDTO {
  team_id: string
  contact_id?: string
  company_id?: string
  employee_profile_id?: string
  entity_type: ActivityEntityType
  activity_type: ActivityType
  content?: string
  metadata?: Record<string, unknown>
}

// Parameters for fetching activity logs
export interface ActivityLogsParams {
  entityType: ActivityEntityType
  entityId: string
  limit?: number
  offset?: number
}

// Parameters for fetching activity by user
export interface UserActivityParams {
  userId: string
  teamId: string
  limit?: number
  offset?: number
}

// Paginated activity logs response
export interface PaginatedActivityLogs {
  data: ActivityLogWithUser[]
  total: number
  hasMore: boolean
}
