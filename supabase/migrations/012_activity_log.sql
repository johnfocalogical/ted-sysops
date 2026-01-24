-- ============================================================================
-- Activity Log System
-- Universal activity tracking across contacts, companies, deals, etc.
-- Phase 1: Comments only (manual user entries)
-- Future: Auto-logged events (created, updated, deleted)
-- ============================================================================

-- Activity types enum (includes future types for expansion)
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('comment', 'created', 'updated', 'deleted', 'status_change');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Entity types enum
DO $$ BEGIN
    CREATE TYPE activity_entity_type AS ENUM ('contact', 'company', 'deal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Activity Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Polymorphic relationship (exactly one must be set)
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    -- deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,  -- Future

    entity_type activity_entity_type NOT NULL,
    activity_type activity_type NOT NULL,
    content TEXT,  -- Comment text or description
    metadata JSONB,  -- For field changes, old/new values, etc.

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one entity FK must be set
    CONSTRAINT activity_logs_entity_check CHECK (
        (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_team_id ON activity_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_contact_id ON activity_logs(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Select: Team members can view activity in their team
DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;
CREATE POLICY "activity_logs_select" ON activity_logs
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Insert: Team members can create activity entries
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;
CREATE POLICY "activity_logs_insert" ON activity_logs
    FOR INSERT WITH CHECK (
        is_team_member(team_id, auth.uid())
    );

-- Delete: Users can delete their own entries, admins can delete any
DROP POLICY IF EXISTS "activity_logs_delete" ON activity_logs;
CREATE POLICY "activity_logs_delete" ON activity_logs
    FOR DELETE USING (
        user_id = auth.uid() OR
        is_team_admin(team_id, auth.uid()) OR
        is_superadmin(auth.uid())
    );

-- Update: Users can update their own entries (for editing comments)
DROP POLICY IF EXISTS "activity_logs_update" ON activity_logs;
CREATE POLICY "activity_logs_update" ON activity_logs
    FOR UPDATE USING (
        user_id = auth.uid() OR
        is_team_admin(team_id, auth.uid()) OR
        is_superadmin(auth.uid())
    );
