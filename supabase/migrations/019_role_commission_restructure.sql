-- ============================================================================
-- Migration: Role-Based Commission Restructure
-- Description: Attaches commission rules to roles (not employees directly).
--              Roles require a department. Employees inherit commissions via
--              role assignment with optional per-employee overrides and expiration.
--              Fixes trigger ordering so departments install before roles.
--              Adds commission rule templates for auto-install on new teams.
-- ============================================================================

-- ============================================================================
-- 1. ADD department_id TO team_roles
-- ============================================================================

ALTER TABLE team_roles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES team_departments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_team_roles_department_id ON team_roles(department_id);

-- ============================================================================
-- 2. ADD default_department_name TO role_templates
-- ============================================================================

ALTER TABLE role_templates ADD COLUMN IF NOT EXISTS default_department_name TEXT;

-- Map existing templates to default departments
UPDATE role_templates SET default_department_name = 'Administration' WHERE name = 'Full Access' AND default_department_name IS NULL;
UPDATE role_templates SET default_department_name = 'Sales' WHERE name = 'Deal Manager' AND default_department_name IS NULL;
UPDATE role_templates SET default_department_name = 'Operations' WHERE name = 'Transaction Coordinator' AND default_department_name IS NULL;
UPDATE role_templates SET default_department_name = 'Finance' WHERE name = 'Finance' AND default_department_name IS NULL;
UPDATE role_templates SET default_department_name = 'Administration' WHERE name = 'View Only' AND default_department_name IS NULL;

-- ============================================================================
-- 3. CREATE role_commission_rules TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES team_roles(id) ON DELETE CASCADE,

    -- Rule definition
    name TEXT NOT NULL,
    calculation_type commission_calculation_type NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',

    -- Status and ordering
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_commission_rules_team_id ON role_commission_rules(team_id);
CREATE INDEX IF NOT EXISTS idx_role_commission_rules_role_id ON role_commission_rules(role_id);
CREATE INDEX IF NOT EXISTS idx_role_commission_rules_active ON role_commission_rules(role_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_commission_rules_configuration ON role_commission_rules USING GIN (configuration);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_role_commission_rules_updated_at ON role_commission_rules;
CREATE TRIGGER update_role_commission_rules_updated_at
    BEFORE UPDATE ON role_commission_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE role_commission_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_commission_rules_select" ON role_commission_rules;
CREATE POLICY "role_commission_rules_select" ON role_commission_rules
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "role_commission_rules_insert" ON role_commission_rules;
CREATE POLICY "role_commission_rules_insert" ON role_commission_rules
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "role_commission_rules_update" ON role_commission_rules;
CREATE POLICY "role_commission_rules_update" ON role_commission_rules
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "role_commission_rules_delete" ON role_commission_rules;
CREATE POLICY "role_commission_rules_delete" ON role_commission_rules
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 4. CREATE role_template_commission_rules TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_template_commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_template_id UUID NOT NULL REFERENCES role_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    calculation_type commission_calculation_type NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_template_commission_rules_template_id ON role_template_commission_rules(role_template_id);

-- RLS (superadmin write, read via join for team context)
ALTER TABLE role_template_commission_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_template_commission_rules_select" ON role_template_commission_rules;
CREATE POLICY "role_template_commission_rules_select" ON role_template_commission_rules
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "role_template_commission_rules_insert" ON role_template_commission_rules;
CREATE POLICY "role_template_commission_rules_insert" ON role_template_commission_rules
    FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "role_template_commission_rules_update" ON role_template_commission_rules;
CREATE POLICY "role_template_commission_rules_update" ON role_template_commission_rules
    FOR UPDATE USING (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "role_template_commission_rules_delete" ON role_template_commission_rules;
CREATE POLICY "role_template_commission_rules_delete" ON role_template_commission_rules
    FOR DELETE USING (is_superadmin(auth.uid()));

-- ============================================================================
-- 5. EXTEND commission_rules FOR OVERRIDES
-- ============================================================================

-- Link to the role commission rule being overridden (NULL = custom/legacy rule)
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS role_commission_rule_id UUID REFERENCES role_commission_rules(id) ON DELETE SET NULL;

-- Optional expiration for time-limited overrides
ALTER TABLE commission_rules ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_commission_rules_role_commission_rule_id ON commission_rules(role_commission_rule_id);

-- ============================================================================
-- 6. FIX TRIGGER ORDERING
-- PostgreSQL fires AFTER triggers alphabetically. We need departments
-- installed before roles (so roles can reference departments), and roles
-- installed before role commission rules.
-- ============================================================================

-- Drop ALL existing team creation triggers
DROP TRIGGER IF EXISTS on_team_created ON teams;
DROP TRIGGER IF EXISTS on_team_created_departments ON teams;
DROP TRIGGER IF EXISTS on_team_created_copy_types ON teams;
DROP TRIGGER IF EXISTS on_team_created_copy_employee_types ON teams;

-- ============================================================================
-- 7. UPDATE copy_role_templates_to_team() — now sets department_id
-- ============================================================================

CREATE OR REPLACE FUNCTION copy_role_templates_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO team_roles (team_id, name, description, permissions, is_default, template_id, department_id)
    SELECT
        NEW.id,
        rt.name,
        rt.description,
        rt.permissions,
        TRUE,
        rt.id,
        td.id  -- department_id looked up by name
    FROM role_templates rt
    LEFT JOIN team_departments td
        ON td.team_id = NEW.id AND td.name = rt.default_department_name
    WHERE rt.auto_install = TRUE;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 8. CREATE copy_role_template_commissions_to_team()
-- ============================================================================

CREATE OR REPLACE FUNCTION copy_role_template_commissions_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_user_id UUID;
BEGIN
    -- Get the org owner as the created_by user
    SELECT o.owner_id INTO v_admin_user_id
    FROM teams t
    JOIN organizations o ON o.id = t.org_id
    WHERE t.id = NEW.id;

    -- If no owner found, skip commission rule creation
    IF v_admin_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Copy commission rule templates for each role that was just created from a template
    INSERT INTO role_commission_rules (team_id, role_id, name, calculation_type, configuration, priority, notes, created_by)
    SELECT
        NEW.id,
        tr.id,
        rtcr.name,
        rtcr.calculation_type,
        rtcr.configuration,
        rtcr.priority,
        rtcr.notes,
        v_admin_user_id
    FROM team_roles tr
    JOIN role_templates rt ON rt.id = tr.template_id
    JOIN role_template_commission_rules rtcr ON rtcr.role_template_id = rt.id
    WHERE tr.team_id = NEW.id;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 9. RECREATE ALL TRIGGERS WITH ORDERED NAMES
-- a_ = departments (must be first)
-- b_ = roles with department lookup (needs departments)
-- c_ = role commission rules (needs roles)
-- d_ = contact/company types (independent)
-- e_ = employee types (independent)
-- ============================================================================

CREATE TRIGGER on_team_created_a_departments
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_default_departments_to_team();

CREATE TRIGGER on_team_created_b_roles
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_role_templates_to_team();

CREATE TRIGGER on_team_created_c_role_commissions
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_role_template_commissions_to_team();

CREATE TRIGGER on_team_created_d_copy_types
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_type_templates_to_team();

CREATE TRIGGER on_team_created_e_copy_employee_types
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_employee_type_templates_to_team();

-- ============================================================================
-- 10. BACKFILL EXISTING TEAMS — assign departments to existing default roles
-- ============================================================================

UPDATE team_roles tr
SET department_id = td.id
FROM role_templates rt, team_departments td
WHERE tr.template_id = rt.id
  AND td.team_id = tr.team_id
  AND td.name = rt.default_department_name
  AND tr.department_id IS NULL;

-- ============================================================================
-- 11. SEED DEFAULT COMMISSION RULE TEMPLATES
-- ============================================================================

-- Deal Manager: 3% of gross profit per deal
INSERT INTO role_template_commission_rules (role_template_id, name, calculation_type, configuration, priority)
SELECT id, 'Standard Deal Commission', 'percentage_gross', '{"percentage": 3}', 0
FROM role_templates WHERE name = 'Deal Manager'
ON CONFLICT DO NOTHING;

-- Transaction Coordinator: $500 flat fee per deal
INSERT INTO role_template_commission_rules (role_template_id, name, calculation_type, configuration, priority)
SELECT id, 'Transaction Fee', 'flat_fee', '{"amount": 500}', 0
FROM role_templates WHERE name = 'Transaction Coordinator'
ON CONFLICT DO NOTHING;
