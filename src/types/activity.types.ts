// ============================================================================
// Activity Log Types
// Universal activity tracking across contacts, companies, deals, etc.
// ============================================================================

// Activity type - what kind of action was performed
export type ActivityType =
  | 'comment'
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_change'
  | 'type_assigned'
  | 'type_unassigned'
  | 'department_changed'
  | 'commission_rule_created'
  | 'commission_rule_updated'
  | 'commission_rule_deleted'
  | 'role_changed'

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
  activityTypes?: ActivityType[]
  dateFrom?: string
  dateTo?: string
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

// ============================================================================
// Activity Filtering & Export
// ============================================================================

// Filter categories for UI dropdowns
export type ActivityFilterCategory = 'all' | 'comments' | 'profile_changes' | 'commission' | 'permissions'

// Map filter categories to activity type arrays
export const ACTIVITY_FILTER_MAP: Record<ActivityFilterCategory, ActivityType[] | null> = {
  all: null, // null = no filter
  comments: ['comment'],
  profile_changes: ['updated', 'status_change', 'type_assigned', 'type_unassigned', 'department_changed'],
  commission: ['commission_rule_created', 'commission_rule_updated', 'commission_rule_deleted'],
  permissions: ['role_changed'],
}

// Human-readable labels for activity types
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  comment: 'Comment',
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  status_change: 'Status Change',
  type_assigned: 'Type Assigned',
  type_unassigned: 'Type Unassigned',
  department_changed: 'Department Changed',
  commission_rule_created: 'Commission Rule Created',
  commission_rule_updated: 'Commission Rule Updated',
  commission_rule_deleted: 'Commission Rule Deleted',
  role_changed: 'Role Changed',
}

// ============================================================================
// @Mention Support
// ============================================================================

export interface MentionedUser {
  id: string
  full_name: string | null
  email: string
}

// ============================================================================
// Export
// ============================================================================

export interface ExportActivityParams {
  entityType: ActivityEntityType
  entityId: string
  activityTypes?: ActivityType[]
  dateFrom?: string
  dateTo?: string
}
