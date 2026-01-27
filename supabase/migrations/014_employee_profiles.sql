-- ============================================================================
-- Migration: Employee Profiles & Departments
-- Description: Extends team members with rich employee profiles (1:1),
--              adds configurable departments per team, extends contact_methods
--              and activity_logs to support employee entities.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Employee status
DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add 'employee' to activity entity type
ALTER TYPE activity_entity_type ADD VALUE IF NOT EXISTS 'employee';

-- ============================================================================
-- 2. TEAM DEPARTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_departments_team_id ON team_departments(team_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_team_departments_updated_at ON team_departments;
CREATE TRIGGER update_team_departments_updated_at
    BEFORE UPDATE ON team_departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE team_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_departments_select" ON team_departments;
CREATE POLICY "team_departments_select" ON team_departments
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_departments_insert" ON team_departments;
CREATE POLICY "team_departments_insert" ON team_departments
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_departments_update" ON team_departments;
CREATE POLICY "team_departments_update" ON team_departments
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_departments_delete" ON team_departments;
CREATE POLICY "team_departments_delete" ON team_departments
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Auto-install default departments for new teams
CREATE OR REPLACE FUNCTION copy_default_departments_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO team_departments (team_id, name, sort_order)
    VALUES
        (NEW.id, 'Operations', 1),
        (NEW.id, 'Sales', 2),
        (NEW.id, 'Acquisitions', 3),
        (NEW.id, 'Finance', 4),
        (NEW.id, 'Marketing', 5),
        (NEW.id, 'Administration', 6);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_created_departments ON teams;
CREATE TRIGGER on_team_created_departments
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_default_departments_to_team();

-- Seed default departments for existing teams
INSERT INTO team_departments (team_id, name, sort_order)
SELECT t.id, d.name, d.sort_order
FROM teams t
CROSS JOIN (VALUES
    ('Operations', 1),
    ('Sales', 2),
    ('Acquisitions', 3),
    ('Finance', 4),
    ('Marketing', 5),
    ('Administration', 6)
) AS d(name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM team_departments td
    WHERE td.team_id = t.id AND td.name = d.name
);

-- ============================================================================
-- 3. EMPLOYEE PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL UNIQUE REFERENCES team_members(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Employee profile fields
    job_title TEXT,
    department_id UUID REFERENCES team_departments(id) ON DELETE SET NULL,
    hire_date DATE,
    status employee_status NOT NULL DEFAULT 'active',
    employee_notes TEXT,

    -- Emergency contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_profiles_team_member_id ON employee_profiles(team_member_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_team_id ON employee_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department ON employee_profiles(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_profiles_status ON employee_profiles(team_id, status);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at
    BEFORE UPDATE ON employee_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: team members can view all profiles in their team
DROP POLICY IF EXISTS "employee_profiles_select" ON employee_profiles;
CREATE POLICY "employee_profiles_select" ON employee_profiles
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- INSERT: team admins (also auto-created by trigger)
DROP POLICY IF EXISTS "employee_profiles_insert" ON employee_profiles;
CREATE POLICY "employee_profiles_insert" ON employee_profiles
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- UPDATE: team admins can update any; users can update their own
DROP POLICY IF EXISTS "employee_profiles_update" ON employee_profiles;
CREATE POLICY "employee_profiles_update" ON employee_profiles
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid())
        OR EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = employee_profiles.team_member_id
            AND tm.user_id = auth.uid()
        )
        OR is_superadmin(auth.uid())
    );

-- DELETE: team admins only
DROP POLICY IF EXISTS "employee_profiles_delete" ON employee_profiles;
CREATE POLICY "employee_profiles_delete" ON employee_profiles
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- Auto-create employee profile when team member is added
CREATE OR REPLACE FUNCTION create_employee_profile_on_team_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO employee_profiles (team_member_id, team_id)
    VALUES (NEW.id, NEW.team_id)
    ON CONFLICT (team_member_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_member_created_profile ON team_members;
CREATE TRIGGER on_team_member_created_profile
    AFTER INSERT ON team_members
    FOR EACH ROW EXECUTE FUNCTION create_employee_profile_on_team_member();

-- Backfill: create profiles for all existing team members
INSERT INTO employee_profiles (team_member_id, team_id)
SELECT tm.id, tm.team_id
FROM team_members tm
WHERE NOT EXISTS (
    SELECT 1 FROM employee_profiles ep WHERE ep.team_member_id = tm.id
);

-- ============================================================================
-- 4. EXTEND CONTACT METHODS FOR EMPLOYEES
-- ============================================================================

-- Add employee_profile_id column
ALTER TABLE contact_methods
    ADD COLUMN IF NOT EXISTS employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE;

-- Update owner check constraint (exactly one FK must be set)
ALTER TABLE contact_methods DROP CONSTRAINT IF EXISTS contact_methods_owner_check;
ALTER TABLE contact_methods ADD CONSTRAINT contact_methods_owner_check CHECK (
    (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN contact_company_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN employee_profile_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Partial index for employee methods
CREATE INDEX IF NOT EXISTS idx_contact_methods_employee_profile
    ON contact_methods(employee_profile_id) WHERE employee_profile_id IS NOT NULL;

-- Update RLS policies to include employee_profile_id
DROP POLICY IF EXISTS "contact_methods_select" ON contact_methods;
CREATE POLICY "contact_methods_select" ON contact_methods
    FOR SELECT USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (employee_profile_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_profile_id
            AND is_team_member(ep.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_methods_insert" ON contact_methods;
CREATE POLICY "contact_methods_insert" ON contact_methods
    FOR INSERT WITH CHECK (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (employee_profile_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_profile_id
            AND is_team_member(ep.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_methods_update" ON contact_methods;
CREATE POLICY "contact_methods_update" ON contact_methods
    FOR UPDATE USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (employee_profile_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_profile_id
            AND is_team_member(ep.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_methods_delete" ON contact_methods;
CREATE POLICY "contact_methods_delete" ON contact_methods
    FOR DELETE USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (employee_profile_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM employee_profiles ep
            WHERE ep.id = employee_profile_id
            AND is_team_member(ep.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 5. EXTEND ACTIVITY LOGS FOR EMPLOYEES
-- ============================================================================

-- Add employee_profile_id column
ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE;

-- Update entity check constraint (exactly one entity FK must be set)
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_check;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_check CHECK (
    (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN employee_profile_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Partial index for employee activity
CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_profile_id
    ON activity_logs(employee_profile_id) WHERE employee_profile_id IS NOT NULL;
