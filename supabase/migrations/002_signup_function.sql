-- ============================================================================
-- Epic 3B: Signup Function - Create Org and Team for New Users
-- ============================================================================
-- This function handles the org/team creation during signup.
-- Uses SECURITY DEFINER to bypass RLS since the user may not have
-- an active session yet after auth.signUp().
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_workspace(
  p_user_id UUID,
  p_org_name TEXT,
  p_org_slug TEXT,
  p_team_name TEXT,
  p_team_slug TEXT
)
RETURNS TABLE (
  out_org_id UUID,
  out_team_id UUID,
  out_team_member_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_team_id UUID;
  v_team_member_id UUID;
  v_full_access_role_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (p_org_name, p_org_slug, p_user_id)
  RETURNING id INTO v_org_id;

  -- Create team (trigger will auto-install role templates)
  INSERT INTO teams (org_id, name, slug)
  VALUES (v_org_id, p_team_name, p_team_slug)
  RETURNING id INTO v_team_id;

  -- Get the "Full Access" role for this team (created by trigger)
  SELECT tr.id INTO v_full_access_role_id
  FROM team_roles tr
  WHERE tr.team_id = v_team_id AND tr.name = 'Full Access'
  LIMIT 1;

  -- Create team membership with admin permission
  INSERT INTO team_members (team_id, user_id, role_id, permission_level)
  VALUES (v_team_id, p_user_id, v_full_access_role_id, 'admin')
  RETURNING id INTO v_team_member_id;

  out_org_id := v_org_id;
  out_team_id := v_team_id;
  out_team_member_id := v_team_member_id;
  RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_workspace TO authenticated;
