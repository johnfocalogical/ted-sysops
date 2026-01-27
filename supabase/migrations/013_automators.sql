-- ============================================================================
-- Visual Automator Builder Schema
-- Workflow definitions stored as JSON, executed on deals
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Automator Definitions - Workflow templates stored as JSONB
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    -- React Flow compatible JSON structure
    definition JSONB NOT NULL DEFAULT '{
        "nodes": [],
        "edges": [],
        "viewport": {"x": 0, "y": 0, "zoom": 1}
    }',
    -- Status for draft/published workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    -- Version tracking
    version INTEGER NOT NULL DEFAULT 1,
    -- Metadata
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    -- Unique name per team
    UNIQUE(team_id, name)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_automators_team_id ON automators(team_id);
CREATE INDEX IF NOT EXISTS idx_automators_status ON automators(status);
CREATE INDEX IF NOT EXISTS idx_automators_created_by ON automators(created_by);
CREATE INDEX IF NOT EXISTS idx_automators_created_at ON automators(created_at DESC);

-- GIN index for JSONB definition queries
CREATE INDEX IF NOT EXISTS idx_automators_definition ON automators USING GIN(definition);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_automators_updated_at ON automators;
CREATE TRIGGER update_automators_updated_at
    BEFORE UPDATE ON automators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE automators ENABLE ROW LEVEL SECURITY;

-- Select: Team members can view automators
DROP POLICY IF EXISTS "automators_select" ON automators;
CREATE POLICY "automators_select" ON automators
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Insert: Team admins can create automators
DROP POLICY IF EXISTS "automators_insert" ON automators;
CREATE POLICY "automators_insert" ON automators
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Update: Team admins can update automators
DROP POLICY IF EXISTS "automators_update" ON automators;
CREATE POLICY "automators_update" ON automators
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Delete: Team admins can delete automators
DROP POLICY IF EXISTS "automators_delete" ON automators;
CREATE POLICY "automators_delete" ON automators
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );
