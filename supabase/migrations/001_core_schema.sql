-- ============================================================================
-- Epic 3A: Core Database Schema - Multi-Tenant Foundation
-- ============================================================================
-- This migration creates the foundational schema for the multi-tenant
-- real estate deal management platform.
--
-- Architecture:
--   Organization (billing entity)
--     └── Team (workspace)
--          └── Team Members (users + roles)
--               └── Future: Deals, Contacts, etc.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Permission level for team members
DO $$ BEGIN
    CREATE TYPE permission_level AS ENUM ('admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Invitation status
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Organizations - Top-level billing entity (company)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- ----------------------------------------------------------------------------
-- 2.2 Teams - Workspace within an organization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    join_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON teams(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_join_code ON teams(join_code);

-- ----------------------------------------------------------------------------
-- 2.3 Users - Extended auth.users data (public profile)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 2.4 Role Templates - System-wide role definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    auto_install BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2.5 Team Roles - Custom roles per team (copied from templates or custom)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_roles_team_id ON team_roles(team_id);

-- ----------------------------------------------------------------------------
-- 2.6 Team Members - User membership in a team with role
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL,
    permission_level permission_level NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role_id ON team_members(role_id);

-- ----------------------------------------------------------------------------
-- 2.7 Team Invitations - Pending invites to join a team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL,
    permission_level permission_level NOT NULL DEFAULT 'member',
    status invitation_status NOT NULL DEFAULT 'pending',
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 is_superadmin - Check if user is a superadmin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = check_user_id AND is_superadmin = TRUE
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3.2 is_org_member - Check if user belongs to an organization
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE t.org_id = check_org_id AND tm.user_id = check_user_id
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3.3 is_team_member - Check if user is a member of a team
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_team_member(check_team_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = check_team_id AND user_id = check_user_id
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3.4 is_team_admin - Check if user is an admin of a team
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_team_admin(check_team_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = check_team_id
          AND user_id = check_user_id
          AND permission_level = 'admin'
    );
END;
$$;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_templates_updated_at ON role_templates;
CREATE TRIGGER update_role_templates_updated_at
    BEFORE UPDATE ON role_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_roles_updated_at ON team_roles;
CREATE TRIGGER update_team_roles_updated_at
    BEFORE UPDATE ON team_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
    BEFORE UPDATE ON team_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4.2 Auto-create public.users row when auth.users row is created
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- 4.3 Auto-copy role templates when team is created
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION copy_role_templates_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO team_roles (team_id, name, description, permissions, is_default, template_id)
    SELECT
        NEW.id,
        rt.name,
        rt.description,
        rt.permissions,
        TRUE,
        rt.id
    FROM role_templates rt
    WHERE rt.auto_install = TRUE;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_created ON teams;
CREATE TRIGGER on_team_created
    AFTER INSERT ON teams
    FOR EACH ROW EXECUTE FUNCTION copy_role_templates_to_team();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5.1 Organizations Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations
    FOR SELECT USING (
        is_org_member(id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "organizations_insert" ON organizations;
CREATE POLICY "organizations_insert" ON organizations
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations
    FOR UPDATE USING (
        owner_id = auth.uid() OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "organizations_delete" ON organizations;
CREATE POLICY "organizations_delete" ON organizations
    FOR DELETE USING (
        owner_id = auth.uid() OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.2 Teams Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "teams_select" ON teams;
CREATE POLICY "teams_select" ON teams
    FOR SELECT USING (
        is_team_member(id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams
    FOR INSERT WITH CHECK (
        is_org_member(org_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams
    FOR UPDATE USING (
        is_team_admin(id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "teams_delete" ON teams;
CREATE POLICY "teams_delete" ON teams
    FOR DELETE USING (
        is_team_admin(id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.3 Users Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users
    FOR SELECT USING (
        id = auth.uid()
        OR is_superadmin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM team_members tm1
            JOIN team_members tm2 ON tm1.team_id = tm2.team_id
            WHERE tm1.user_id = auth.uid() AND tm2.user_id = users.id
        )
    );

DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users
    FOR UPDATE USING (
        id = auth.uid() OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.4 Role Templates Policies (public read, superadmin write)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "role_templates_select" ON role_templates;
CREATE POLICY "role_templates_select" ON role_templates
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "role_templates_insert" ON role_templates;
CREATE POLICY "role_templates_insert" ON role_templates
    FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "role_templates_update" ON role_templates;
CREATE POLICY "role_templates_update" ON role_templates
    FOR UPDATE USING (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "role_templates_delete" ON role_templates;
CREATE POLICY "role_templates_delete" ON role_templates
    FOR DELETE USING (is_superadmin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 5.5 Team Roles Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "team_roles_select" ON team_roles;
CREATE POLICY "team_roles_select" ON team_roles
    FOR SELECT USING (
        is_team_member(team_id, auth.uid())
        OR is_superadmin(auth.uid())
        -- Org owners can read roles for teams in their org (for team creation flow)
        OR EXISTS (
            SELECT 1 FROM organizations o
            JOIN teams t ON t.org_id = o.id
            WHERE t.id = team_roles.team_id
            AND o.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "team_roles_insert" ON team_roles;
CREATE POLICY "team_roles_insert" ON team_roles
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_roles_update" ON team_roles;
CREATE POLICY "team_roles_update" ON team_roles
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_roles_delete" ON team_roles;
CREATE POLICY "team_roles_delete" ON team_roles
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.6 Team Members Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members
    FOR INSERT WITH CHECK (
        -- Team admin can add members
        is_team_admin(team_id, auth.uid())
        -- Or user can add themselves (for signup/invitation acceptance flow)
        OR user_id = auth.uid()
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update" ON team_members
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 5.7 Team Invitations Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "team_invitations_select" ON team_invitations;
CREATE POLICY "team_invitations_select" ON team_invitations
    FOR SELECT USING (
        is_team_admin(team_id, auth.uid())
        OR email = (SELECT email FROM users WHERE id = auth.uid())
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_invitations_insert" ON team_invitations;
CREATE POLICY "team_invitations_insert" ON team_invitations
    FOR INSERT WITH CHECK (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_invitations_update" ON team_invitations;
CREATE POLICY "team_invitations_update" ON team_invitations
    FOR UPDATE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "team_invitations_delete" ON team_invitations;
CREATE POLICY "team_invitations_delete" ON team_invitations
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 6. SEED DATA - Default Role Templates
-- ============================================================================

INSERT INTO role_templates (name, description, permissions, is_system, auto_install)
VALUES
    (
        'Full Access',
        'Complete access to all sections',
        '{
            "inbox": {"access": "full"},
            "dashboard": {"access": "full"},
            "pay_time": {"access": "full"},
            "team": {"access": "full"},
            "whiteboard": {"access": "full"},
            "contacts": {"access": "full"},
            "employees": {"access": "full"},
            "transactions": {"access": "full"},
            "calendar": {"access": "full"},
            "reports": {"access": "full"},
            "settings": {"access": "full"}
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'Deal Manager',
        'Manage deals and contacts',
        '{
            "inbox": {"access": "full"},
            "dashboard": {"access": "full"},
            "whiteboard": {"access": "full"},
            "contacts": {"access": "full"},
            "calendar": {"access": "full"},
            "reports": {"access": "view"}
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'Transaction Coordinator',
        'Focus on transaction processing',
        '{
            "inbox": {"access": "view"},
            "dashboard": {"access": "view"},
            "whiteboard": {"access": "full"},
            "contacts": {"access": "view"},
            "transactions": {"access": "full"},
            "calendar": {"access": "full"}
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'Finance',
        'Financial reporting and oversight',
        '{
            "inbox": {"access": "view"},
            "dashboard": {"access": "view"},
            "reports": {"access": "full"},
            "transactions": {"access": "view"},
            "settings": {"access": "view"}
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'View Only',
        'Read-only access to main sections',
        '{
            "inbox": {"access": "view"},
            "dashboard": {"access": "view"},
            "whiteboard": {"access": "view"},
            "contacts": {"access": "view"},
            "transactions": {"access": "view"},
            "calendar": {"access": "view"},
            "reports": {"access": "view"}
        }'::jsonb,
        TRUE,
        TRUE
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    is_system = EXCLUDED.is_system,
    auto_install = EXCLUDED.auto_install;

-- ============================================================================
-- COMPLETE
-- ============================================================================
