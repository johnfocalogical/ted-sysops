import { createActivityLog } from './activityLogService'
import type { ActivityType } from '@/types/activity.types'

// ============================================================================
// Employee Activity Helpers
// Granular logging for employee profile changes, type assignments,
// commission rules, and role changes.
// ============================================================================

interface ProfileField {
  field: string
  label: string
  from: string | null
  to: string | null
}

const TRACKED_PROFILE_FIELDS: { key: string; label: string }[] = [
  { key: 'job_title', label: 'Job Title' },
  { key: 'hire_date', label: 'Hire Date' },
  { key: 'status', label: 'Status' },
  { key: 'employee_notes', label: 'Notes' },
  { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
  { key: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
  { key: 'emergency_contact_relationship', label: 'Emergency Contact Relationship' },
]

/**
 * Compare tracked fields between before/after profile states.
 * Returns array of changed fields with from/to values.
 */
export function computeProfileDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): ProfileField[] {
  const diffs: ProfileField[] = []

  for (const { key, label } of TRACKED_PROFILE_FIELDS) {
    const fromVal = (before[key] as string | null) ?? null
    const toVal = (after[key] as string | null) ?? null
    if (fromVal !== toVal) {
      diffs.push({ field: key, label, from: fromVal, to: toVal })
    }
  }

  return diffs
}

/**
 * Log a profile update with field-level diffs.
 * Emits `department_changed` if department changed, and `updated` with diff metadata for other fields.
 */
export async function logProfileUpdate(params: {
  teamId: string
  employeeProfileId: string
  userId: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  departmentIdBefore: string | null
  departmentIdAfter: string | null
  departmentNameBefore: string | null
  departmentNameAfter: string | null
}): Promise<void> {
  const {
    teamId, employeeProfileId, userId,
    before, after,
    departmentIdBefore, departmentIdAfter,
    departmentNameBefore, departmentNameAfter,
  } = params

  // Department change — separate activity entry
  if (departmentIdBefore !== departmentIdAfter) {
    await createActivityLog(
      {
        team_id: teamId,
        entity_type: 'employee',
        activity_type: 'department_changed',
        employee_profile_id: employeeProfileId,
        content: departmentNameAfter
          ? `Department changed to ${departmentNameAfter}`
          : 'Department removed',
        metadata: {
          from_department_id: departmentIdBefore,
          to_department_id: departmentIdAfter,
          from_department_name: departmentNameBefore,
          to_department_name: departmentNameAfter,
        },
      },
      userId
    )
  }

  // Other field changes
  const diffs = computeProfileDiff(before, after)
  if (diffs.length > 0) {
    const changedLabels = diffs.map((d) => d.label).join(', ')
    await createActivityLog(
      {
        team_id: teamId,
        entity_type: 'employee',
        activity_type: 'updated',
        employee_profile_id: employeeProfileId,
        content: `Updated ${changedLabels}`,
        metadata: { changes: diffs },
      },
      userId
    )
  }
}

/**
 * Log an employee type assignment or removal.
 */
export async function logTypeChange(params: {
  teamId: string
  employeeProfileId: string
  userId: string
  typeName: string
  typeId: string
  action: 'assigned' | 'unassigned'
}): Promise<void> {
  const { teamId, employeeProfileId, userId, typeName, typeId, action } = params
  const activityType: ActivityType = action === 'assigned' ? 'type_assigned' : 'type_unassigned'

  await createActivityLog(
    {
      team_id: teamId,
      entity_type: 'employee',
      activity_type: activityType,
      employee_profile_id: employeeProfileId,
      content: action === 'assigned'
        ? `Assigned type: ${typeName}`
        : `Removed type: ${typeName}`,
      metadata: { type_id: typeId, type_name: typeName },
    },
    userId
  )
}

/**
 * Log a commission rule create, update, or delete.
 */
export async function logCommissionRuleChange(params: {
  teamId: string
  employeeProfileId: string
  userId: string
  action: 'created' | 'updated' | 'deleted'
  rule: Record<string, unknown>
  previousRule?: Record<string, unknown>
}): Promise<void> {
  const { teamId, employeeProfileId, userId, action, rule, previousRule } = params
  const activityType: ActivityType = `commission_rule_${action}` as ActivityType

  const ruleName = (rule.name as string) || 'Commission rule'
  const contentMap = {
    created: `Created commission rule: ${ruleName}`,
    updated: `Updated commission rule: ${ruleName}`,
    deleted: `Deleted commission rule: ${ruleName}`,
  }

  const metadata: Record<string, unknown> = { rule }
  if (previousRule) {
    metadata.previous_rule = previousRule
  }

  await createActivityLog(
    {
      team_id: teamId,
      entity_type: 'employee',
      activity_type: activityType,
      employee_profile_id: employeeProfileId,
      content: contentMap[action],
      metadata,
    },
    userId
  )
}

/**
 * Log a role or permission level change for an employee.
 */
export async function logRoleChange(params: {
  teamId: string
  employeeProfileId: string
  userId: string
  beforeRoles: string[]
  afterRoles: string[]
  beforePermissionLevel: string
  afterPermissionLevel: string
}): Promise<void> {
  const {
    teamId, employeeProfileId, userId,
    beforeRoles, afterRoles,
    beforePermissionLevel, afterPermissionLevel,
  } = params

  const parts: string[] = []
  if (beforePermissionLevel !== afterPermissionLevel) {
    parts.push(`Permission changed from ${beforePermissionLevel} to ${afterPermissionLevel}`)
  }

  const addedRoles = afterRoles.filter((r) => !beforeRoles.includes(r))
  const removedRoles = beforeRoles.filter((r) => !afterRoles.includes(r))
  if (addedRoles.length > 0) {
    parts.push(`Added roles: ${addedRoles.join(', ')}`)
  }
  if (removedRoles.length > 0) {
    parts.push(`Removed roles: ${removedRoles.join(', ')}`)
  }

  if (parts.length === 0) return // No actual changes

  await createActivityLog(
    {
      team_id: teamId,
      entity_type: 'employee',
      activity_type: 'role_changed',
      employee_profile_id: employeeProfileId,
      content: parts.join('. '),
      metadata: {
        before_roles: beforeRoles,
        after_roles: afterRoles,
        before_permission_level: beforePermissionLevel,
        after_permission_level: afterPermissionLevel,
      },
    },
    userId
  )
}
