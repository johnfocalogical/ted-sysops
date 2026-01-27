-- ============================================================================
-- Migration: Department Enhancement & Employee Type System (Epic ES3)
-- Description: Adds icon/color to departments, creates employee type templates
--              and team employee types (following contact/company type pattern),
--              adds employee type assignments (M:N), and extends custom fields
--              for employee types with orphan management.
-- ============================================================================

-- ============================================================================
-- 1. DEPARTMENT ENHANCEMENT - Add icon/color columns
-- ============================================================================

ALTER TABLE team_departments
    ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'Briefcase',
    ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'gray';

-- Replace the auto-install function to include icon/color
CREATE OR REPLACE FUNCTION copy_default_departments_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO team_departments (team_id, name, icon, color, sort_order)
    VALUES
        (NEW.id, 'Operations', 'Settings', 'blue', 1),
        (NEW.id, 'Sales', 'TrendingUp', 'green', 2),
        (NEW.id, 'Acquisitions', 'Search', 'purple', 3),
        (NEW.id, 'Finance', 'DollarSign', 'amber', 4),
        (NEW.id, 'Marketing', 'Megaphone', 'pink', 5),
        (NEW.id, 'Administration', 'Briefcase', 'gray', 6);
    RETURN NEW;
END;
$$;

-- Backfill existing departments with icon/color
UPDATE team_departments SET icon = 'Settings', color = 'blue' WHERE name = 'Operations' AND icon = 'Briefcase' AND color = 'gray';
UPDATE team_departments SET icon = 'TrendingUp', color = 'green' WHERE name = 'Sales' AND icon = 'Briefcase' AND color = 'gray';
UPDATE team_departments SET icon = 'Search', color = 'purple' WHERE name = 'Acquisitions' AND icon = 'Briefcase' AND color = 'gray';
UPDATE team_departments SET icon = 'DollarSign', color = 'amber' WHERE name = 'Finance' AND icon = 'Briefcase' AND color = 'gray';
UPDATE team_departments SET icon = 'Megaphone', color = 'pink' WHERE name = 'Marketing' AND icon = 'Briefcase' AND color = 'gray';
-- Administration keeps Briefcase/gray defaults

-- ============================================================================
-- 2. EMPLOYEE TYPE TEMPLATES (Superadmin Managed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_type_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'User',
    color TEXT NOT NULL DEFAULT 'gray',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    auto_install BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_employee_type_templates_updated_at ON employee_type_templates;
CREATE TRIGGER update_employee_type_templates_updated_at
    BEFORE UPDATE ON employee_type_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE employee_type_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_type_templates_select" ON employee_type_templates;
CREATE POLICY "employee_type_templates_select" ON employee_type_templates
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "employee_type_templates_insert" ON employee_type_templates;
CREATE POLICY "employee_type_templates_insert" ON employee_type_templates
    FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "employee_type_templates_update" ON employee_type_templates;
CREATE POLICY "employee_type_templates_update" ON employee_type_templates
    FOR UPDATE USING (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "employee_type_templates_delete" ON employee_type_templates;
CREATE POLICY "employee_type_templates_delete" ON employee_type_templates
    FOR DELETE USING (is_superadmin(auth.uid()));

-- Seed default employee type templates
INSERT INTO employee_type_templates (name, description, icon, color, is_system, auto_install, sort_order) VALUES
    ('Full-Time', 'Full-time W-2 employee', 'UserCheck', 'green', TRUE, TRUE, 1),
    ('Part-Time', 'Part-time W-2 employee', 'User', 'blue', TRUE, TRUE, 2),
    ('Contractor', 'Independent contractor (W-9)', 'Wrench', 'amber', TRUE, TRUE, 3),
    ('1099', '1099 independent contractor', 'FileText', 'purple', TRUE, TRUE, 4)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- 3. TEAM EMPLOYEE TYPES (Per-Team, Customizable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_employee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'User',
    color TEXT NOT NULL DEFAULT 'gray',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    template_id UUID REFERENCES employee_type_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_employee_types_team_id ON team_employee_types(team_id);
CREATE INDEX IF NOT EXISTS idx_team_employee_types_template_id ON team_employee_types(template_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_team_employee_types_updated_at ON team_employee_types;
CREATE TRIGGER update_team_employee_types_updated_at
    BEFORE UPDATE ON team_employee_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE team_employee_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_employee_types_select" ON team_employee_types;
CREATE POLICY "team_employee_types_select" ON team_employee_types
    FOR SELECT USING (
        is_team_member(team_id, auth.uid())
        OR is_superadmin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM organizations o
            JOIN teams t ON t.org_id = o.id
            WHERE t.id = team_employee_types.team_id
            AND o.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "team_employee_types_insert" ON team_employee_types;
CREATE POLICY "team_employee_types_insert" ON team_employee_types
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_employee_types_update" ON team_employee_types;
CREATE POLICY "team_employee_types_update" ON team_employee_types
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_employee_types_delete" ON team_employee_types;
CREATE POLICY "team_employee_types_delete" ON team_employee_types
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 4. AUTO-COPY EMPLOYEE TYPE TEMPLATES TO NEW TEAMS
-- ============================================================================

CREATE OR REPLACE FUNCTION copy_employee_type_templates_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO team_employee_types (team_id, name, description, icon, color, sort_order, template_id)
    SELECT
        NEW.id,
        et.name,
        et.description,
        et.icon,
        et.color,
        et.sort_order,
        et.id
    FROM employee_type_templates et
    WHERE et.auto_install = TRUE;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_created_copy_employee_types ON teams;
CREATE TRIGGER on_team_created_copy_employee_types
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_employee_type_templates_to_team();

-- Backfill: copy employee type templates to all existing teams
INSERT INTO team_employee_types (team_id, name, description, icon, color, sort_order, template_id)
SELECT
    t.id,
    et.name,
    et.description,
    et.icon,
    et.color,
    et.sort_order,
    et.id
FROM teams t
CROSS JOIN employee_type_templates et
WHERE et.auto_install = TRUE
AND NOT EXISTS (
    SELECT 1 FROM team_employee_types tet
    WHERE tet.team_id = t.id AND tet.name = et.name
);

-- ============================================================================
-- 5. EMPLOYEE TYPE ASSIGNMENTS (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_type_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_profile_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES team_employee_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_profile_id, type_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_type_assignments_profile
    ON employee_type_assignments(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_type_assignments_type
    ON employee_type_assignments(type_id);

-- RLS
ALTER TABLE employee_type_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_type_assignments_select" ON employee_type_assignments;
CREATE POLICY "employee_type_assignments_select" ON employee_type_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_type_assignments.employee_profile_id
            AND (is_team_member(ep.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "employee_type_assignments_insert" ON employee_type_assignments;
CREATE POLICY "employee_type_assignments_insert" ON employee_type_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_type_assignments.employee_profile_id
            AND (
                is_team_admin(ep.team_id, auth.uid())
                OR is_superadmin(auth.uid())
                -- Self-assign: user can assign types to their own profile
                OR EXISTS (
                    SELECT 1 FROM team_members tm
                    WHERE tm.id = ep.team_member_id
                    AND tm.user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS "employee_type_assignments_delete" ON employee_type_assignments;
CREATE POLICY "employee_type_assignments_delete" ON employee_type_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_type_assignments.employee_profile_id
            AND (
                is_team_admin(ep.team_id, auth.uid())
                OR is_superadmin(auth.uid())
                OR EXISTS (
                    SELECT 1 FROM team_members tm
                    WHERE tm.id = ep.team_member_id
                    AND tm.user_id = auth.uid()
                )
            )
        )
    );

-- ============================================================================
-- 6. EXTEND CUSTOM FIELD DEFINITIONS FOR EMPLOYEE TYPES
-- ============================================================================

-- Add employee type FK to custom_field_definitions
ALTER TABLE custom_field_definitions
    ADD COLUMN IF NOT EXISTS team_employee_type_id UUID REFERENCES team_employee_types(id) ON DELETE CASCADE;

-- Partial index
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_employee_type
    ON custom_field_definitions(team_employee_type_id) WHERE team_employee_type_id IS NOT NULL;

-- Update CHECK constraint: exactly one of 3 owner FKs must be set
ALTER TABLE custom_field_definitions DROP CONSTRAINT IF EXISTS custom_field_owner_check;
ALTER TABLE custom_field_definitions ADD CONSTRAINT custom_field_owner_check CHECK (
    (CASE WHEN team_contact_type_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN team_company_type_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN team_employee_type_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Update RLS policies to include employee type branch
DROP POLICY IF EXISTS "custom_field_definitions_select" ON custom_field_definitions;
CREATE POLICY "custom_field_definitions_select" ON custom_field_definitions
    FOR SELECT USING (
        -- Access via contact type
        (team_contact_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_contact_types tct
            WHERE tct.id = team_contact_type_id
            AND (is_team_member(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        -- Access via company type
        OR (team_company_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_company_types tct
            WHERE tct.id = team_company_type_id
            AND (is_team_member(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        -- Access via employee type
        OR (team_employee_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_employee_types tet
            WHERE tet.id = team_employee_type_id
            AND (is_team_member(tet.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "custom_field_definitions_insert" ON custom_field_definitions;
CREATE POLICY "custom_field_definitions_insert" ON custom_field_definitions
    FOR INSERT WITH CHECK (
        (team_contact_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_contact_types tct
            WHERE tct.id = team_contact_type_id
            AND (is_team_admin(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (team_company_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_company_types tct
            WHERE tct.id = team_company_type_id
            AND (is_team_admin(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (team_employee_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_employee_types tet
            WHERE tet.id = team_employee_type_id
            AND (is_team_admin(tet.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "custom_field_definitions_update" ON custom_field_definitions;
CREATE POLICY "custom_field_definitions_update" ON custom_field_definitions
    FOR UPDATE USING (
        (team_contact_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_contact_types tct
            WHERE tct.id = team_contact_type_id
            AND (is_team_admin(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (team_company_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_company_types tct
            WHERE tct.id = team_company_type_id
            AND (is_team_admin(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (team_employee_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_employee_types tet
            WHERE tet.id = team_employee_type_id
            AND (is_team_admin(tet.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "custom_field_definitions_delete" ON custom_field_definitions;
CREATE POLICY "custom_field_definitions_delete" ON custom_field_definitions
    FOR DELETE USING (
        (team_contact_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_contact_types tct
            WHERE tct.id = team_contact_type_id
            AND (is_team_admin(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (team_company_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_company_types tct
            WHERE tct.id = team_company_type_id
            AND (is_team_admin(tct.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (team_employee_type_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM team_employee_types tet
            WHERE tet.id = team_employee_type_id
            AND (is_team_admin(tet.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

-- ============================================================================
-- 7. EXTEND CUSTOM FIELD VALUES FOR EMPLOYEES
-- ============================================================================

-- Add employee_id column to custom_field_values
ALTER TABLE custom_field_values
    ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE;

-- Partial unique index for employee field values
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_field_values_employee_unique
    ON custom_field_values(employee_id, field_definition_id)
    WHERE employee_id IS NOT NULL;

-- General index for employee lookups
CREATE INDEX IF NOT EXISTS idx_custom_field_values_employee
    ON custom_field_values(employee_id) WHERE employee_id IS NOT NULL;

-- Update CHECK constraint: exactly one of 3 owner FKs must be set
ALTER TABLE custom_field_values DROP CONSTRAINT IF EXISTS custom_field_value_owner_check;
ALTER TABLE custom_field_values ADD CONSTRAINT custom_field_value_owner_check CHECK (
    (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN employee_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Update RLS policies to include employee branch
DROP POLICY IF EXISTS "custom_field_values_select" ON custom_field_values;
CREATE POLICY "custom_field_values_select" ON custom_field_values
    FOR SELECT USING (
        -- Via contact
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = custom_field_values.contact_id
            AND (is_team_member(c.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        -- Via company
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = custom_field_values.company_id
            AND (is_team_member(co.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        -- Via employee
        OR (employee_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = custom_field_values.employee_id
            AND (is_team_member(ep.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "custom_field_values_insert" ON custom_field_values;
CREATE POLICY "custom_field_values_insert" ON custom_field_values
    FOR INSERT WITH CHECK (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = custom_field_values.contact_id
            AND (is_team_member(c.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = custom_field_values.company_id
            AND (is_team_member(co.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (employee_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = custom_field_values.employee_id
            AND (is_team_member(ep.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "custom_field_values_update" ON custom_field_values;
CREATE POLICY "custom_field_values_update" ON custom_field_values
    FOR UPDATE USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = custom_field_values.contact_id
            AND (is_team_member(c.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = custom_field_values.company_id
            AND (is_team_member(co.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (employee_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = custom_field_values.employee_id
            AND (is_team_member(ep.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

DROP POLICY IF EXISTS "custom_field_values_delete" ON custom_field_values;
CREATE POLICY "custom_field_values_delete" ON custom_field_values
    FOR DELETE USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = custom_field_values.contact_id
            AND (is_team_member(c.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = custom_field_values.company_id
            AND (is_team_member(co.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
        OR (employee_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = custom_field_values.employee_id
            AND (is_team_member(ep.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        ))
    );

-- ============================================================================
-- 8. EXTEND ORPHAN MANAGEMENT FOR EMPLOYEE TYPE ASSIGNMENTS
-- ============================================================================

-- Update mark_custom_field_values_orphaned to handle employee type removals
CREATE OR REPLACE FUNCTION mark_custom_field_values_orphaned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    type_name TEXT;
BEGIN
    -- Get the type name for reference
    IF TG_TABLE_NAME = 'contact_type_assignments' THEN
        SELECT name INTO type_name FROM team_contact_types WHERE id = OLD.type_id;

        -- Mark field values as orphaned (values from fields belonging to the removed type)
        UPDATE custom_field_values cfv
        SET is_orphaned = TRUE,
            orphaned_at = NOW(),
            orphaned_type_name = type_name
        WHERE cfv.contact_id = OLD.contact_id
        AND cfv.field_definition_id IN (
            SELECT id FROM custom_field_definitions
            WHERE team_contact_type_id = OLD.type_id
        )
        AND cfv.is_orphaned = FALSE;

    ELSIF TG_TABLE_NAME = 'company_type_assignments' THEN
        SELECT name INTO type_name FROM team_company_types WHERE id = OLD.type_id;

        UPDATE custom_field_values cfv
        SET is_orphaned = TRUE,
            orphaned_at = NOW(),
            orphaned_type_name = type_name
        WHERE cfv.company_id = OLD.company_id
        AND cfv.field_definition_id IN (
            SELECT id FROM custom_field_definitions
            WHERE team_company_type_id = OLD.type_id
        )
        AND cfv.is_orphaned = FALSE;

    ELSIF TG_TABLE_NAME = 'employee_type_assignments' THEN
        SELECT name INTO type_name FROM team_employee_types WHERE id = OLD.type_id;

        UPDATE custom_field_values cfv
        SET is_orphaned = TRUE,
            orphaned_at = NOW(),
            orphaned_type_name = type_name
        WHERE cfv.employee_id = OLD.employee_profile_id
        AND cfv.field_definition_id IN (
            SELECT id FROM custom_field_definitions
            WHERE team_employee_type_id = OLD.type_id
        )
        AND cfv.is_orphaned = FALSE;
    END IF;

    RETURN OLD;
END;
$$;

-- Update restore_orphaned_custom_field_values to handle employee type re-assignments
CREATE OR REPLACE FUNCTION restore_orphaned_custom_field_values()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_TABLE_NAME = 'contact_type_assignments' THEN
        UPDATE custom_field_values cfv
        SET is_orphaned = FALSE,
            orphaned_at = NULL,
            orphaned_type_name = NULL
        WHERE cfv.contact_id = NEW.contact_id
        AND cfv.field_definition_id IN (
            SELECT id FROM custom_field_definitions
            WHERE team_contact_type_id = NEW.type_id
        )
        AND cfv.is_orphaned = TRUE;

    ELSIF TG_TABLE_NAME = 'company_type_assignments' THEN
        UPDATE custom_field_values cfv
        SET is_orphaned = FALSE,
            orphaned_at = NULL,
            orphaned_type_name = NULL
        WHERE cfv.company_id = NEW.company_id
        AND cfv.field_definition_id IN (
            SELECT id FROM custom_field_definitions
            WHERE team_company_type_id = NEW.type_id
        )
        AND cfv.is_orphaned = TRUE;

    ELSIF TG_TABLE_NAME = 'employee_type_assignments' THEN
        UPDATE custom_field_values cfv
        SET is_orphaned = FALSE,
            orphaned_at = NULL,
            orphaned_type_name = NULL
        WHERE cfv.employee_id = NEW.employee_profile_id
        AND cfv.field_definition_id IN (
            SELECT id FROM custom_field_definitions
            WHERE team_employee_type_id = NEW.type_id
        )
        AND cfv.is_orphaned = TRUE;
    END IF;

    RETURN NEW;
END;
$$;

-- Triggers for orphan management on employee type assignments
DROP TRIGGER IF EXISTS on_employee_type_removed_orphan_values ON employee_type_assignments;
CREATE TRIGGER on_employee_type_removed_orphan_values
    AFTER DELETE ON employee_type_assignments
    FOR EACH ROW EXECUTE FUNCTION mark_custom_field_values_orphaned();

DROP TRIGGER IF EXISTS on_employee_type_added_restore_values ON employee_type_assignments;
CREATE TRIGGER on_employee_type_added_restore_values
    AFTER INSERT ON employee_type_assignments
    FOR EACH ROW EXECUTE FUNCTION restore_orphaned_custom_field_values();

-- ============================================================================
-- COMPLETE
-- ============================================================================
