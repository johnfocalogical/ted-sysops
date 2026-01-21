-- ============================================================================
-- Migration: Multiple Roles per User
-- Description: Add junction tables to support multiple roles per team member
--              and per invitation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create team_member_roles junction table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES team_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_member_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_member_roles_member_id ON team_member_roles(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_roles_role_id ON team_member_roles(role_id);

-- Enable RLS
ALTER TABLE team_member_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_member_roles
DROP POLICY IF EXISTS "team_member_roles_select" ON team_member_roles;
CREATE POLICY "team_member_roles_select" ON team_member_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_roles.team_member_id
            AND (is_team_member(tm.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "team_member_roles_insert" ON team_member_roles;
CREATE POLICY "team_member_roles_insert" ON team_member_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_roles.team_member_id
            AND (is_team_admin(tm.team_id, auth.uid()) OR is_superadmin(auth.uid()) OR tm.user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "team_member_roles_update" ON team_member_roles;
CREATE POLICY "team_member_roles_update" ON team_member_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_roles.team_member_id
            AND (is_team_admin(tm.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "team_member_roles_delete" ON team_member_roles;
CREATE POLICY "team_member_roles_delete" ON team_member_roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_roles.team_member_id
            AND (is_team_admin(tm.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 2. Create team_invitation_roles junction table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_invitation_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES team_invitations(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES team_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(invitation_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitation_roles_invitation_id ON team_invitation_roles(invitation_id);
CREATE INDEX IF NOT EXISTS idx_team_invitation_roles_role_id ON team_invitation_roles(role_id);

-- Enable RLS
ALTER TABLE team_invitation_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invitation_roles
DROP POLICY IF EXISTS "team_invitation_roles_select" ON team_invitation_roles;
CREATE POLICY "team_invitation_roles_select" ON team_invitation_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.id = team_invitation_roles.invitation_id
            AND (
                is_team_admin(ti.team_id, auth.uid())
                OR ti.email = (SELECT email FROM users WHERE id = auth.uid())
                OR is_superadmin(auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "team_invitation_roles_insert" ON team_invitation_roles;
CREATE POLICY "team_invitation_roles_insert" ON team_invitation_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.id = team_invitation_roles.invitation_id
            AND (is_team_admin(ti.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "team_invitation_roles_delete" ON team_invitation_roles;
CREATE POLICY "team_invitation_roles_delete" ON team_invitation_roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.id = team_invitation_roles.invitation_id
            AND (is_team_admin(ti.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3. Migrate existing role assignments from team_members
-- ----------------------------------------------------------------------------
INSERT INTO team_member_roles (team_member_id, role_id)
SELECT id, role_id FROM team_members WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Migrate existing role assignments from team_invitations
-- ----------------------------------------------------------------------------
INSERT INTO team_invitation_roles (invitation_id, role_id)
SELECT id, role_id FROM team_invitations WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Drop old role_id columns
-- ----------------------------------------------------------------------------
-- Drop indexes first
DROP INDEX IF EXISTS idx_team_members_role_id;

-- Drop the columns
ALTER TABLE team_members DROP COLUMN IF EXISTS role_id;
ALTER TABLE team_invitations DROP COLUMN IF EXISTS role_id;
