-- ============================================================================
-- Migration: Organization Members Table
-- Description: Add organization_members table to track org-level membership
--              and support multiple org owners
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create organization_members table
-- ----------------------------------------------------------------------------
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_owner BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Create helper functions BEFORE RLS policies (to avoid circular deps)
-- ----------------------------------------------------------------------------

-- Check if user is org owner (via organization_members)
CREATE OR REPLACE FUNCTION is_org_owner(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check organization_members table
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = check_org_id
    AND user_id = check_user_id
    AND is_owner = true
  ) THEN
    RETURN true;
  END IF;

  -- Fallback to owner_id for backwards compatibility during migration
  RETURN EXISTS (
    SELECT 1 FROM organizations
    WHERE id = check_org_id
    AND owner_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_org_member to use new table (with fallback)
CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check organization_members table
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = check_org_id
    AND user_id = check_user_id
  ) THEN
    RETURN true;
  END IF;

  -- Fallback: check if user is in any team of this org
  RETURN EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.org_id = check_org_id
    AND tm.user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. RLS policies for organization_members
-- ----------------------------------------------------------------------------

-- SELECT: User can see their own membership, org owners can see all, superadmins can see all
CREATE POLICY "org_members_select" ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR is_org_owner(organization_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

-- INSERT: Only org owners and superadmins can add members
CREATE POLICY "org_members_insert" ON organization_members
    FOR INSERT WITH CHECK (
        is_org_owner(organization_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

-- UPDATE: Only org owners and superadmins can update membership
CREATE POLICY "org_members_update" ON organization_members
    FOR UPDATE USING (
        is_org_owner(organization_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

-- DELETE: Only org owners and superadmins can remove members
CREATE POLICY "org_members_delete" ON organization_members
    FOR DELETE USING (
        is_org_owner(organization_id, auth.uid())
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 4. Backfill existing data
-- ----------------------------------------------------------------------------

-- Add existing org owners as organization_members with is_owner=true
INSERT INTO organization_members (organization_id, user_id, is_owner)
SELECT id, owner_id, true FROM organizations
ON CONFLICT (organization_id, user_id) DO UPDATE SET is_owner = true;

-- Add all team members as org members (not owners by default)
INSERT INTO organization_members (organization_id, user_id, is_owner)
SELECT DISTINCT t.org_id, tm.user_id, false
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Create indexes for performance
-- ----------------------------------------------------------------------------
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_is_owner ON organization_members(organization_id) WHERE is_owner = true;

-- ----------------------------------------------------------------------------
-- 6. Update trigger for updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. Function to get org owner count (for last-owner protection)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_org_owner_count(p_org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM organization_members
    WHERE organization_id = p_org_id
    AND is_owner = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_org_owner_count TO authenticated;
