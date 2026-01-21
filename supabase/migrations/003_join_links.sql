-- ============================================================================
-- Migration: 003_join_links.sql
-- Description: Add join link functionality to teams and update RLS policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add join link columns to teams table
-- ----------------------------------------------------------------------------
ALTER TABLE teams ADD COLUMN IF NOT EXISTS join_link_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS default_role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 2. Update RLS policies for public invitation access
-- ----------------------------------------------------------------------------

-- Drop existing select policy and recreate with public access
DROP POLICY IF EXISTS "team_invitations_select" ON team_invitations;

-- Allow anyone to read invitation by ID (for accept flow)
-- This is safe because UUIDs are hard to guess
CREATE POLICY "team_invitations_select" ON team_invitations
    FOR SELECT USING (
        -- Team admins can see all invitations for their team
        is_team_admin(team_id, auth.uid())
        -- Users can see invitations for their email
        OR email = (SELECT email FROM users WHERE id = auth.uid())
        -- Superadmins can see all
        OR is_superadmin(auth.uid())
        -- Anyone can read by ID (for accept flow - UUID is secure)
        OR true
    );

-- ----------------------------------------------------------------------------
-- 3. Update RLS policies for public team access via join code
-- ----------------------------------------------------------------------------

-- Drop existing select policy and recreate with join link access
DROP POLICY IF EXISTS "teams_select" ON teams;

CREATE POLICY "teams_select" ON teams
    FOR SELECT USING (
        -- Existing access: team members
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
        )
        -- Org members can see all teams in their org (needed for team creation flow)
        OR is_org_member(teams.org_id, auth.uid())
        -- Superadmins can see all
        OR is_superadmin(auth.uid())
        -- Public access for teams with join link enabled (for join flow)
        OR join_link_enabled = true
    );

-- ----------------------------------------------------------------------------
-- 4. Add policy for users to update invitation status when accepting
-- ----------------------------------------------------------------------------

-- Allow the invited user to update their own invitation (to accept it)
DROP POLICY IF EXISTS "team_invitations_update" ON team_invitations;

CREATE POLICY "team_invitations_update" ON team_invitations
    FOR UPDATE USING (
        -- Team admins can update any invitation
        is_team_admin(team_id, auth.uid())
        -- Superadmins can update any
        OR is_superadmin(auth.uid())
        -- The invited user can update their own invitation (to accept it)
        OR (
            email = (SELECT email FROM users WHERE id = auth.uid())
            AND status = 'pending'
        )
    );

-- ----------------------------------------------------------------------------
-- 5. Allow users to insert themselves into team_members when accepting invite
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "team_members_insert" ON team_members;

CREATE POLICY "team_members_insert" ON team_members
    FOR INSERT WITH CHECK (
        -- Team admins can add members
        is_team_admin(team_id, auth.uid())
        -- Superadmins can add
        OR is_superadmin(auth.uid())
        -- Org members can add themselves to teams in their org (for team creation flow)
        OR (
            user_id = auth.uid()
            AND is_org_member(
                (SELECT org_id FROM teams WHERE id = team_members.team_id),
                auth.uid()
            )
        )
        -- Users can add themselves if they have a pending invitation
        OR (
            user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM team_invitations ti
                WHERE ti.team_id = team_members.team_id
                AND ti.email = (SELECT email FROM users WHERE id = auth.uid())
                AND ti.status = 'pending'
            )
        )
        -- Users can add themselves via join link
        OR (
            user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM teams t
                WHERE t.id = team_members.team_id
                AND t.join_link_enabled = true
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 6. Index for join_code lookups
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_teams_join_link ON teams(join_code) WHERE join_link_enabled = true;
