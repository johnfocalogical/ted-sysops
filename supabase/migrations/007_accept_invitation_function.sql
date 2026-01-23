-- ============================================================================
-- Migration: Accept Invitation Function
-- Description: SECURITY DEFINER function to handle invitation acceptance,
--              bypassing RLS to avoid permission issues during signup flow
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_id UUID,
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS TABLE (
  out_team_member_id UUID,
  out_team_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_team_member_id UUID;
  v_existing_member_id UUID;
  v_org_id UUID;
BEGIN
  -- 1. Fetch and validate the invitation
  SELECT ti.id, ti.email, ti.team_id, ti.permission_level, ti.status, ti.expires_at
  INTO v_invitation
  FROM team_invitations ti
  WHERE ti.id = p_invitation_id;

  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer pending (status: %)', v_invitation.status;
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- 2. Validate email matches (case-insensitive)
  IF LOWER(v_invitation.email) != LOWER(p_user_email) THEN
    RAISE EXCEPTION 'Email does not match invitation';
  END IF;

  -- 3. Check if user is already a member
  SELECT id INTO v_existing_member_id
  FROM team_members
  WHERE team_id = v_invitation.team_id AND user_id = p_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already a team member';
  END IF;

  -- 4. Update invitation status
  UPDATE team_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = p_invitation_id;

  -- 5. Create team membership
  INSERT INTO team_members (team_id, user_id, permission_level)
  VALUES (v_invitation.team_id, p_user_id, v_invitation.permission_level)
  RETURNING id INTO v_team_member_id;

  -- 6. Assign roles from invitation to new team member
  INSERT INTO team_member_roles (team_member_id, role_id)
  SELECT v_team_member_id, tir.role_id
  FROM team_invitation_roles tir
  WHERE tir.invitation_id = p_invitation_id;

  -- 7. Add user to organization_members if not already present
  SELECT org_id INTO v_org_id FROM teams WHERE id = v_invitation.team_id;

  INSERT INTO organization_members (organization_id, user_id, is_owner)
  VALUES (v_org_id, p_user_id, false)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Return results
  out_team_member_id := v_team_member_id;
  out_team_id := v_invitation.team_id;
  RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_invitation TO authenticated;
