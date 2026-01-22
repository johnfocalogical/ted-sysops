-- ============================================================================
-- Migration: Get Invitation Details Function
-- Description: SECURITY DEFINER function to fetch invitation details,
--              bypassing RLS for the accept invitation flow
-- ============================================================================

CREATE OR REPLACE FUNCTION get_invitation_details(p_invitation_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', ti.id,
    'email', ti.email,
    'permission_level', ti.permission_level,
    'status', ti.status,
    'expires_at', ti.expires_at,
    'team', json_build_object(
      'id', t.id,
      'name', t.name,
      'slug', t.slug,
      'org_id', t.org_id,
      'organization', json_build_object(
        'id', o.id,
        'name', o.name
      )
    ),
    'inviter', CASE
      WHEN u.id IS NOT NULL THEN json_build_object(
        'id', u.id,
        'full_name', u.full_name
      )
      ELSE NULL
    END,
    'roles', COALESCE(
      (
        SELECT json_agg(json_build_object('id', tr.id, 'name', tr.name))
        FROM team_invitation_roles tir
        JOIN team_roles tr ON tr.id = tir.role_id
        WHERE tir.invitation_id = ti.id
      ),
      '[]'::json
    )
  ) INTO v_result
  FROM team_invitations ti
  JOIN teams t ON t.id = ti.team_id
  JOIN organizations o ON o.id = t.org_id
  LEFT JOIN users u ON u.id = ti.invited_by
  WHERE ti.id = p_invitation_id;

  RETURN v_result;
END;
$$;

-- Grant execute to both anonymous and authenticated users
-- Security is based on UUID being hard to guess (like a secret token)
GRANT EXECUTE ON FUNCTION get_invitation_details TO anon, authenticated;
