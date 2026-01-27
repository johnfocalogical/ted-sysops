-- ============================================================================
-- Migration: Employee Activity Enhancements
-- Description: Extends the activity_type enum with granular employee-specific
--              types, enforces immutability by dropping UPDATE/DELETE policies,
--              and adds indexes for activity type filtering.
-- ============================================================================

-- ============================================================================
-- 1. EXTEND ACTIVITY TYPE ENUM
-- ============================================================================

ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'type_assigned';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'type_unassigned';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'department_changed';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'commission_rule_created';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'commission_rule_updated';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'commission_rule_deleted';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'role_changed';

-- ============================================================================
-- 2. ENFORCE IMMUTABILITY — DROP UPDATE/DELETE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "activity_logs_update" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_delete" ON activity_logs;

-- ============================================================================
-- 3. ADD INDEXES FOR FILTERING
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type
    ON activity_logs(activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_type_filter
    ON activity_logs(employee_profile_id, activity_type, created_at DESC)
    WHERE employee_profile_id IS NOT NULL;
