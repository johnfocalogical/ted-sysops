-- ============================================================================
-- Migration: Automator Instances & Step Execution Log
-- Description: Creates tables for tracking automator execution on deals.
--              automator_instances: running/completed/canceled instances.
--              automator_instance_steps: immutable log of completed steps.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Automator Instances - Execution of an automator on a specific deal
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automator_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    automator_id UUID NOT NULL REFERENCES automators(id) ON DELETE CASCADE,
    -- Frozen copy of automator definition at start time
    definition_snapshot JSONB NOT NULL,
    -- Runtime status
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'canceled')),
    -- Node ID the user is currently on (null when completed/canceled)
    current_node_id TEXT,
    -- Parent-child relationship for triggered automators
    parent_instance_id UUID REFERENCES automator_instances(id) ON DELETE SET NULL,
    parent_step_node_id TEXT,
    -- Tracking
    started_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 1.2 Automator Instance Steps - Immutable execution log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automator_instance_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES automator_instances(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL CHECK (node_type IN ('start', 'decision', 'data_collection', 'end')),
    -- For decision nodes: which branch was chosen
    branch_taken TEXT,
    -- User input data from data collection forms
    user_response JSONB,
    -- Log of backend actions fired and their results
    actions_executed JSONB,
    -- Who completed this step
    completed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- automator_instances indexes
CREATE INDEX IF NOT EXISTS idx_automator_instances_deal_id
    ON automator_instances(deal_id);
CREATE INDEX IF NOT EXISTS idx_automator_instances_deal_status
    ON automator_instances(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_automator_instances_parent
    ON automator_instances(parent_instance_id);
CREATE INDEX IF NOT EXISTS idx_automator_instances_automator_id
    ON automator_instances(automator_id);
CREATE INDEX IF NOT EXISTS idx_automator_instances_team_id
    ON automator_instances(team_id);

-- automator_instance_steps indexes
CREATE INDEX IF NOT EXISTS idx_automator_instance_steps_instance_id
    ON automator_instance_steps(instance_id);
CREATE INDEX IF NOT EXISTS idx_automator_instance_steps_instance_node
    ON automator_instance_steps(instance_id, node_id);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on automator_instances
DROP TRIGGER IF EXISTS update_automator_instances_updated_at ON automator_instances;
CREATE TRIGGER update_automator_instances_updated_at
    BEFORE UPDATE ON automator_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE automator_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE automator_instance_steps ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4.1 automator_instances policies
-- ----------------------------------------------------------------------------

-- Select: Team members can view instances
DROP POLICY IF EXISTS "automator_instances_select" ON automator_instances;
CREATE POLICY "automator_instances_select" ON automator_instances
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Insert: Team members can start automator instances
DROP POLICY IF EXISTS "automator_instances_insert" ON automator_instances;
CREATE POLICY "automator_instances_insert" ON automator_instances
    FOR INSERT WITH CHECK (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Update: Team members can advance steps, team admins can cancel
DROP POLICY IF EXISTS "automator_instances_update" ON automator_instances;
CREATE POLICY "automator_instances_update" ON automator_instances
    FOR UPDATE USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Delete: Team admins only
DROP POLICY IF EXISTS "automator_instances_delete" ON automator_instances;
CREATE POLICY "automator_instances_delete" ON automator_instances
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 4.2 automator_instance_steps policies (immutable — no update/delete)
-- ----------------------------------------------------------------------------

-- Select: Team members can view steps via parent instance's team
DROP POLICY IF EXISTS "automator_instance_steps_select" ON automator_instance_steps;
CREATE POLICY "automator_instance_steps_select" ON automator_instance_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automator_instances ai
            WHERE ai.id = automator_instance_steps.instance_id
            AND (is_team_member(ai.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- Insert: Team members can record steps via parent instance's team
DROP POLICY IF EXISTS "automator_instance_steps_insert" ON automator_instance_steps;
CREATE POLICY "automator_instance_steps_insert" ON automator_instance_steps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM automator_instances ai
            WHERE ai.id = automator_instance_steps.instance_id
            AND (is_team_member(ai.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- No UPDATE or DELETE policies — steps are immutable
