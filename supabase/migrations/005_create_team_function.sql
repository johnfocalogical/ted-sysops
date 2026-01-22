-- ============================================================================
-- Migration: Create Team Function
-- Description: SECURITY DEFINER function to handle team creation atomically,
--              bypassing RLS chicken-and-egg issues
-- ============================================================================

CREATE OR REPLACE FUNCTION create_team(
  p_org_id UUID,
  p_user_id UUID,
  p_team_name TEXT,
  p_team_slug TEXT
)
RETURNS TABLE (
  out_team_id UUID,
  out_team_member_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_team_member_id UUID;
  v_full_access_role_id UUID;
BEGIN
  -- Verify user is org owner or existing org member
  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = p_org_id AND owner_id = p_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.org_id = p_org_id AND tm.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not authorized to create teams in this organization';
  END IF;

  -- Create team (trigger will auto-install role templates)
  INSERT INTO teams (org_id, name, slug)
  VALUES (p_org_id, p_team_name, p_team_slug)
  RETURNING id INTO v_team_id;

  -- Get the "Full Access" role for this team (created by trigger)
  SELECT tr.id INTO v_full_access_role_id
  FROM team_roles tr
  WHERE tr.team_id = v_team_id AND tr.name = 'Full Access'
  LIMIT 1;

  -- Create team membership with admin permission
  INSERT INTO team_members (team_id, user_id, permission_level)
  VALUES (v_team_id, p_user_id, 'admin')
  RETURNING id INTO v_team_member_id;

  -- Assign the Full Access role via junction table
  IF v_full_access_role_id IS NOT NULL THEN
    INSERT INTO team_member_roles (team_member_id, role_id)
    VALUES (v_team_member_id, v_full_access_role_id);
  END IF;

  out_team_id := v_team_id;
  out_team_member_id := v_team_member_id;
  RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_team TO authenticated;
