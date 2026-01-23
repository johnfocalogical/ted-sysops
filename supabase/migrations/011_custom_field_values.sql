-- ============================================================================
-- Migration: Custom Field Values (Epic 3C)
-- Description: Storage for custom field values with typed columns and orphan
--              preservation when types are removed/re-added
-- ============================================================================

-- ============================================================================
-- 1. EXTEND CUSTOM FIELD TYPE ENUM
-- ============================================================================

-- Add textarea and currency to the enum
ALTER TYPE custom_field_type ADD VALUE IF NOT EXISTS 'textarea';
ALTER TYPE custom_field_type ADD VALUE IF NOT EXISTS 'currency';

-- ============================================================================
-- 2. CUSTOM FIELD VALUES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Owner: exactly one must be set (contact or company)
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Field definition reference
    field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,

    -- Value storage: use appropriate column based on field_type
    -- text, textarea, email, phone, url
    value_text TEXT,
    -- number, currency
    value_number DECIMAL(15,4),
    -- date
    value_date DATE,
    -- checkbox
    value_boolean BOOLEAN,
    -- dropdown (single string), multi_select (string array)
    value_json JSONB,

    -- Orphan tracking: when a type is removed from a contact/company,
    -- values are preserved but marked as orphaned for potential restoration
    is_orphaned BOOLEAN NOT NULL DEFAULT FALSE,
    orphaned_at TIMESTAMPTZ,
    orphaned_type_name TEXT,  -- Store the type name for reference

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one owner must be set
    CONSTRAINT custom_field_value_owner_check CHECK (
        (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Unique constraint: one value per field per entity
-- Using partial indexes for the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_field_values_contact_unique
    ON custom_field_values(contact_id, field_definition_id)
    WHERE contact_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_field_values_company_unique
    ON custom_field_values(company_id, field_definition_id)
    WHERE company_id IS NOT NULL;

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_custom_field_values_contact
    ON custom_field_values(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_field_values_company
    ON custom_field_values(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_field_values_definition
    ON custom_field_values(field_definition_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_orphaned
    ON custom_field_values(is_orphaned) WHERE is_orphaned = TRUE;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_custom_field_values_updated_at ON custom_field_values;
CREATE TRIGGER update_custom_field_values_updated_at
    BEFORE UPDATE ON custom_field_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ORPHAN MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to mark values as orphaned when a type assignment is removed
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
    END IF;

    RETURN OLD;
END;
$$;

-- Function to restore orphaned values when a type is re-assigned
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
    END IF;

    RETURN NEW;
END;
$$;

-- Triggers for orphan management on contact type assignments
DROP TRIGGER IF EXISTS on_contact_type_removed_orphan_values ON contact_type_assignments;
CREATE TRIGGER on_contact_type_removed_orphan_values
    AFTER DELETE ON contact_type_assignments
    FOR EACH ROW EXECUTE FUNCTION mark_custom_field_values_orphaned();

DROP TRIGGER IF EXISTS on_contact_type_added_restore_values ON contact_type_assignments;
CREATE TRIGGER on_contact_type_added_restore_values
    AFTER INSERT ON contact_type_assignments
    FOR EACH ROW EXECUTE FUNCTION restore_orphaned_custom_field_values();

-- Triggers for orphan management on company type assignments
DROP TRIGGER IF EXISTS on_company_type_removed_orphan_values ON company_type_assignments;
CREATE TRIGGER on_company_type_removed_orphan_values
    AFTER DELETE ON company_type_assignments
    FOR EACH ROW EXECUTE FUNCTION mark_custom_field_values_orphaned();

DROP TRIGGER IF EXISTS on_company_type_added_restore_values ON company_type_assignments;
CREATE TRIGGER on_company_type_added_restore_values
    AFTER INSERT ON company_type_assignments
    FOR EACH ROW EXECUTE FUNCTION restore_orphaned_custom_field_values();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

-- Select: users can read values for contacts/companies they have access to
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
    );

-- Insert: team members can create values
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
    );

-- Update: team members can update values
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
    );

-- Delete: team members can delete values
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
    );

-- ============================================================================
-- COMPLETE
-- ============================================================================
