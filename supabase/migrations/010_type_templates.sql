-- ============================================================================
-- Migration: Contact & Company Type System (Epic 3B)
-- Description: Template-based type management for contacts and companies
--              following the role_templates/team_roles pattern
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Custom field types
DO $$ BEGIN
    CREATE TYPE custom_field_type AS ENUM (
        'text',
        'number',
        'date',
        'dropdown',
        'multi_select',
        'checkbox',
        'url',
        'email',
        'phone'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TEMPLATE TABLES (Superadmin Managed)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Contact Type Templates - System-wide contact type definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_type_templates (
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

-- ----------------------------------------------------------------------------
-- 2.2 Company Type Templates - System-wide company type definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_type_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'Building2',
    color TEXT NOT NULL DEFAULT 'gray',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    auto_install BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TEAM TYPE TABLES (Per-Team, Customizable)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Team Contact Types - Contact types per team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_contact_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'User',
    color TEXT NOT NULL DEFAULT 'gray',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    template_id UUID REFERENCES contact_type_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_contact_types_team_id ON team_contact_types(team_id);
CREATE INDEX IF NOT EXISTS idx_team_contact_types_template_id ON team_contact_types(template_id);

-- ----------------------------------------------------------------------------
-- 3.2 Team Company Types - Company types per team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_company_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'Building2',
    color TEXT NOT NULL DEFAULT 'gray',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    template_id UUID REFERENCES company_type_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_company_types_team_id ON team_company_types(team_id);
CREATE INDEX IF NOT EXISTS idx_team_company_types_template_id ON team_company_types(template_id);

-- ============================================================================
-- 4. CUSTOM FIELD DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Owner: exactly one must be set
    team_contact_type_id UUID REFERENCES team_contact_types(id) ON DELETE CASCADE,
    team_company_type_id UUID REFERENCES team_company_types(id) ON DELETE CASCADE,
    -- Field definition
    name TEXT NOT NULL,
    field_type custom_field_type NOT NULL DEFAULT 'text',
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    options JSONB,  -- For dropdown/multi_select: ["Option 1", "Option 2"]
    default_value TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one owner must be set
    CONSTRAINT custom_field_owner_check CHECK (
        (CASE WHEN team_contact_type_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN team_company_type_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_contact_type
    ON custom_field_definitions(team_contact_type_id) WHERE team_contact_type_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_company_type
    ON custom_field_definitions(team_company_type_id) WHERE team_company_type_id IS NOT NULL;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at for templates
DROP TRIGGER IF EXISTS update_contact_type_templates_updated_at ON contact_type_templates;
CREATE TRIGGER update_contact_type_templates_updated_at
    BEFORE UPDATE ON contact_type_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_type_templates_updated_at ON company_type_templates;
CREATE TRIGGER update_company_type_templates_updated_at
    BEFORE UPDATE ON company_type_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for team types
DROP TRIGGER IF EXISTS update_team_contact_types_updated_at ON team_contact_types;
CREATE TRIGGER update_team_contact_types_updated_at
    BEFORE UPDATE ON team_contact_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_company_types_updated_at ON team_company_types;
CREATE TRIGGER update_team_company_types_updated_at
    BEFORE UPDATE ON team_company_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_field_definitions_updated_at ON custom_field_definitions;
CREATE TRIGGER update_custom_field_definitions_updated_at
    BEFORE UPDATE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5.1 Auto-copy type templates when team is created
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION copy_type_templates_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Copy contact type templates
    INSERT INTO team_contact_types (team_id, name, description, icon, color, sort_order, template_id)
    SELECT
        NEW.id,
        ct.name,
        ct.description,
        ct.icon,
        ct.color,
        ct.sort_order,
        ct.id
    FROM contact_type_templates ct
    WHERE ct.auto_install = TRUE;

    -- Copy company type templates
    INSERT INTO team_company_types (team_id, name, description, icon, color, sort_order, template_id)
    SELECT
        NEW.id,
        ct.name,
        ct.description,
        ct.icon,
        ct.color,
        ct.sort_order,
        ct.id
    FROM company_type_templates ct
    WHERE ct.auto_install = TRUE;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_created_copy_types ON teams;
CREATE TRIGGER on_team_created_copy_types
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_type_templates_to_team();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE contact_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_contact_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6.1 Template Policies (public read, superadmin write)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_type_templates_select" ON contact_type_templates;
CREATE POLICY "contact_type_templates_select" ON contact_type_templates
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "contact_type_templates_insert" ON contact_type_templates;
CREATE POLICY "contact_type_templates_insert" ON contact_type_templates
    FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "contact_type_templates_update" ON contact_type_templates;
CREATE POLICY "contact_type_templates_update" ON contact_type_templates
    FOR UPDATE USING (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "contact_type_templates_delete" ON contact_type_templates;
CREATE POLICY "contact_type_templates_delete" ON contact_type_templates
    FOR DELETE USING (is_superadmin(auth.uid()));

-- Company type templates
DROP POLICY IF EXISTS "company_type_templates_select" ON company_type_templates;
CREATE POLICY "company_type_templates_select" ON company_type_templates
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "company_type_templates_insert" ON company_type_templates;
CREATE POLICY "company_type_templates_insert" ON company_type_templates
    FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "company_type_templates_update" ON company_type_templates;
CREATE POLICY "company_type_templates_update" ON company_type_templates
    FOR UPDATE USING (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "company_type_templates_delete" ON company_type_templates;
CREATE POLICY "company_type_templates_delete" ON company_type_templates
    FOR DELETE USING (is_superadmin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 6.2 Team Contact Types Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "team_contact_types_select" ON team_contact_types;
CREATE POLICY "team_contact_types_select" ON team_contact_types
    FOR SELECT USING (
        is_team_member(team_id, auth.uid())
        OR is_superadmin(auth.uid())
        -- Org owners can read types for teams in their org
        OR EXISTS (
            SELECT 1 FROM organizations o
            JOIN teams t ON t.org_id = o.id
            WHERE t.id = team_contact_types.team_id
            AND o.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "team_contact_types_insert" ON team_contact_types;
CREATE POLICY "team_contact_types_insert" ON team_contact_types
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_contact_types_update" ON team_contact_types;
CREATE POLICY "team_contact_types_update" ON team_contact_types
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_contact_types_delete" ON team_contact_types;
CREATE POLICY "team_contact_types_delete" ON team_contact_types
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 6.3 Team Company Types Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "team_company_types_select" ON team_company_types;
CREATE POLICY "team_company_types_select" ON team_company_types
    FOR SELECT USING (
        is_team_member(team_id, auth.uid())
        OR is_superadmin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM organizations o
            JOIN teams t ON t.org_id = o.id
            WHERE t.id = team_company_types.team_id
            AND o.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "team_company_types_insert" ON team_company_types;
CREATE POLICY "team_company_types_insert" ON team_company_types
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_company_types_update" ON team_company_types;
CREATE POLICY "team_company_types_update" ON team_company_types
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_company_types_delete" ON team_company_types;
CREATE POLICY "team_company_types_delete" ON team_company_types
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 6.4 Custom Field Definitions Policies (access via parent type)
-- ----------------------------------------------------------------------------
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
    );

-- ============================================================================
-- 7. SEED DATA - Default Type Templates
-- ============================================================================

-- Contact Type Templates (from existing contact_types)
INSERT INTO contact_type_templates (name, description, icon, color, is_system, auto_install, sort_order) VALUES
    ('Seller', 'Property seller or motivated seller lead', 'User', 'blue', TRUE, TRUE, 1),
    ('Buyer', 'Cash buyer or end buyer', 'UserCheck', 'green', TRUE, TRUE, 2),
    ('Investor', 'Private money lender or JV partner', 'Wallet', 'purple', TRUE, TRUE, 3),
    ('Agent', 'Real estate agent or broker', 'Home', 'teal', TRUE, TRUE, 4),
    ('Wholesaler', 'Fellow wholesaler for JV deals', 'Repeat', 'amber', TRUE, TRUE, 5),
    ('Contractor', 'General contractor or handyman', 'Wrench', 'orange', TRUE, TRUE, 6),
    ('Attorney', 'Real estate attorney', 'Scale', 'gray', TRUE, TRUE, 7),
    ('Other', 'Other contact type', 'User', 'slate', TRUE, TRUE, 99)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- Company Type Templates (from existing company_types)
INSERT INTO company_type_templates (name, description, icon, color, is_system, auto_install, sort_order) VALUES
    ('Title Company', 'Title and escrow services', 'FileText', 'blue', TRUE, TRUE, 1),
    ('Lender', 'Hard money or private lender', 'Landmark', 'green', TRUE, TRUE, 2),
    ('Brokerage', 'Real estate brokerage', 'Building', 'teal', TRUE, TRUE, 3),
    ('Contractor', 'General contracting company', 'HardHat', 'orange', TRUE, TRUE, 4),
    ('Property Management', 'Property management company', 'Home', 'purple', TRUE, TRUE, 5),
    ('Inspection', 'Home inspection service', 'Search', 'amber', TRUE, TRUE, 6),
    ('Legal', 'Law firm or legal services', 'Scale', 'gray', TRUE, TRUE, 7),
    ('Marketing', 'Marketing or lead generation', 'Megaphone', 'pink', TRUE, TRUE, 8),
    ('Other', 'Other company type', 'Building2', 'slate', TRUE, TRUE, 99)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- 8. MIGRATE EXISTING TYPE ASSIGNMENTS
-- ============================================================================

-- First, create team types for existing teams that don't have them yet
-- This copies templates to all existing teams
INSERT INTO team_contact_types (team_id, name, description, icon, color, sort_order, template_id)
SELECT
    t.id,
    ctt.name,
    ctt.description,
    ctt.icon,
    ctt.color,
    ctt.sort_order,
    ctt.id
FROM teams t
CROSS JOIN contact_type_templates ctt
WHERE ctt.auto_install = TRUE
AND NOT EXISTS (
    SELECT 1 FROM team_contact_types tct
    WHERE tct.team_id = t.id AND tct.name = ctt.name
);

INSERT INTO team_company_types (team_id, name, description, icon, color, sort_order, template_id)
SELECT
    t.id,
    ctt.name,
    ctt.description,
    ctt.icon,
    ctt.color,
    ctt.sort_order,
    ctt.id
FROM teams t
CROSS JOIN company_type_templates ctt
WHERE ctt.auto_install = TRUE
AND NOT EXISTS (
    SELECT 1 FROM team_company_types tct
    WHERE tct.team_id = t.id AND tct.name = ctt.name
);

-- ============================================================================
-- 9. UPDATE TYPE ASSIGNMENT FOREIGN KEYS
-- ============================================================================

-- Create a function to migrate type assignments
-- This maps old global type IDs to new team-specific type IDs
CREATE OR REPLACE FUNCTION migrate_type_assignments()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    new_type_id UUID;
BEGIN
    -- Migrate contact type assignments
    FOR rec IN
        SELECT cta.id, cta.contact_id, ct.name as type_name, c.team_id
        FROM contact_type_assignments cta
        JOIN contact_types ct ON ct.id = cta.type_id
        JOIN contacts c ON c.id = cta.contact_id
    LOOP
        -- Find matching team contact type
        SELECT id INTO new_type_id
        FROM team_contact_types
        WHERE team_id = rec.team_id AND name = rec.type_name
        LIMIT 1;

        IF new_type_id IS NOT NULL THEN
            UPDATE contact_type_assignments
            SET type_id = new_type_id
            WHERE id = rec.id;
        END IF;
    END LOOP;

    -- Migrate company type assignments
    FOR rec IN
        SELECT cta.id, cta.company_id, ct.name as type_name, c.team_id
        FROM company_type_assignments cta
        JOIN company_types ct ON ct.id = cta.type_id
        JOIN companies c ON c.id = cta.company_id
    LOOP
        -- Find matching team company type
        SELECT id INTO new_type_id
        FROM team_company_types
        WHERE team_id = rec.team_id AND name = rec.type_name
        LIMIT 1;

        IF new_type_id IS NOT NULL THEN
            UPDATE company_type_assignments
            SET type_id = new_type_id
            WHERE id = rec.id;
        END IF;
    END LOOP;
END;
$$;

-- Run the migration
SELECT migrate_type_assignments();

-- Drop the migration function (one-time use)
DROP FUNCTION IF EXISTS migrate_type_assignments();

-- ============================================================================
-- 10. UPDATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop old foreign keys
ALTER TABLE contact_type_assignments
    DROP CONSTRAINT IF EXISTS contact_type_assignments_type_id_fkey;

ALTER TABLE company_type_assignments
    DROP CONSTRAINT IF EXISTS company_type_assignments_type_id_fkey;

-- Add new foreign keys pointing to team types
ALTER TABLE contact_type_assignments
    ADD CONSTRAINT contact_type_assignments_type_id_fkey
    FOREIGN KEY (type_id) REFERENCES team_contact_types(id) ON DELETE CASCADE;

ALTER TABLE company_type_assignments
    ADD CONSTRAINT company_type_assignments_type_id_fkey
    FOREIGN KEY (type_id) REFERENCES team_company_types(id) ON DELETE CASCADE;

-- ============================================================================
-- COMPLETE
-- ============================================================================
