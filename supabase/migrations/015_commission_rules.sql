-- ============================================================================
-- Migration: Commission Rules
-- Description: Adds flexible commission rule definitions per employee profile.
--              Supports flat fee, percentage (gross/net), tiered, and role-based
--              calculation types with JSONB configuration.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE commission_calculation_type AS ENUM (
        'flat_fee', 'percentage_gross', 'percentage_net', 'tiered', 'role_based'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. COMMISSION RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    employee_profile_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,

    -- Rule definition
    name TEXT NOT NULL,
    calculation_type commission_calculation_type NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',

    -- Future use: filter by deal type or role in deal
    deal_type_filter UUID[],
    deal_role_filter TEXT[],

    -- Effective date range
    effective_date DATE NOT NULL,
    end_date DATE,

    -- Status and ordering
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_commission_rules_team_id
    ON commission_rules(team_id);

CREATE INDEX IF NOT EXISTS idx_commission_rules_employee_profile_id
    ON commission_rules(employee_profile_id);

CREATE INDEX IF NOT EXISTS idx_commission_rules_active
    ON commission_rules(employee_profile_id, is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_commission_rules_effective_date
    ON commission_rules(employee_profile_id, effective_date, end_date);

CREATE INDEX IF NOT EXISTS idx_commission_rules_configuration
    ON commission_rules USING GIN (configuration);

-- ============================================================================
-- 4. TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_commission_rules_updated_at ON commission_rules;
CREATE TRIGGER update_commission_rules_updated_at
    BEFORE UPDATE ON commission_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- SELECT: all team members can view commission rules
DROP POLICY IF EXISTS "commission_rules_select" ON commission_rules;
CREATE POLICY "commission_rules_select" ON commission_rules
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- INSERT: team admins only
DROP POLICY IF EXISTS "commission_rules_insert" ON commission_rules;
CREATE POLICY "commission_rules_insert" ON commission_rules
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- UPDATE: team admins only
DROP POLICY IF EXISTS "commission_rules_update" ON commission_rules;
CREATE POLICY "commission_rules_update" ON commission_rules
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- DELETE: team admins only
DROP POLICY IF EXISTS "commission_rules_delete" ON commission_rules;
CREATE POLICY "commission_rules_delete" ON commission_rules
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );
