-- =============================================================================
-- Migration 031: Calendar Events View & RPC Function
-- =============================================================================
-- Creates:
--   1. VIEW  deal_calendar_events  — unions all deal date sources into
--      a normalized event structure (7 sources; inspection TBD pending
--      schema addition of initial_inspection_date to deal_contract_facts).
--   2. FUNCTION get_calendar_events() — queries the view with scope,
--      date-range, and optional owner filtering.
-- =============================================================================


-- =============================================================================
-- 1. VIEW: deal_calendar_events
-- =============================================================================

CREATE OR REPLACE VIEW deal_calendar_events AS

-- ---- 1. Closings ----
SELECT
  d.id::TEXT || '-closing'              AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'closing'::TEXT                       AS event_type,
  cf.original_closing_date              AS event_date,
  NULL::DATE                            AS event_end_date,
  NULL::TIME                            AS event_time,
  NULL::INTEGER                         AS duration_min,
  NULL::INTEGER                         AS buffer_min,
  'Closing: ' || d.address              AS event_label,
  NULL::JSONB                           AS metadata
FROM deals d
JOIN deal_contract_facts cf ON cf.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
  AND cf.original_closing_date IS NOT NULL

UNION ALL

-- ---- 2. Extended Closings ----
SELECT
  d.id::TEXT || '-extended_closing'     AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'extended_closing'::TEXT              AS event_type,
  cf.extended_closing_date              AS event_date,
  NULL::DATE                            AS event_end_date,
  NULL::TIME                            AS event_time,
  NULL::INTEGER                         AS duration_min,
  NULL::INTEGER                         AS buffer_min,
  'Ext. Closing: ' || d.address         AS event_label,
  NULL::JSONB                           AS metadata
FROM deals d
JOIN deal_contract_facts cf ON cf.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
  AND cf.extended_closing_date IS NOT NULL

UNION ALL

-- ---- 3. DD Period (range) ----
SELECT
  d.id::TEXT || '-dd_period'            AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'dd_period'::TEXT                     AS event_type,
  cf.due_diligence_date                 AS event_date,
  cf.due_diligence_end_date             AS event_end_date,
  NULL::TIME                            AS event_time,
  NULL::INTEGER                         AS duration_min,
  NULL::INTEGER                         AS buffer_min,
  'DD Period: ' || d.address            AS event_label,
  NULL::JSONB                           AS metadata
FROM deals d
JOIN deal_contract_facts cf ON cf.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
  AND cf.due_diligence_date IS NOT NULL
  AND cf.due_diligence_end_date IS NOT NULL

UNION ALL

-- ---- 4. DD Expiration (point fallback — end date only, no start) ----
SELECT
  d.id::TEXT || '-dd_expiration'        AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'dd_expiration'::TEXT                 AS event_type,
  cf.due_diligence_end_date             AS event_date,
  NULL::DATE                            AS event_end_date,
  NULL::TIME                            AS event_time,
  NULL::INTEGER                         AS duration_min,
  NULL::INTEGER                         AS buffer_min,
  'DD Expires: ' || d.address           AS event_label,
  NULL::JSONB                           AS metadata
FROM deals d
JOIN deal_contract_facts cf ON cf.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
  AND cf.due_diligence_end_date IS NOT NULL
  AND cf.due_diligence_date IS NULL

UNION ALL

-- ---- 5. Inspection ----
-- TODO: deal_contract_facts does not yet have an initial_inspection_date
-- column. When added, uncomment and adjust this block:
--
-- SELECT
--   d.id::TEXT || '-inspection'           AS event_id,
--   d.id                                  AS deal_id,
--   d.team_id,
--   d.owner_id,
--   d.transaction_coordinator_id          AS tc_id,
--   d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
--                                         AS deal_address,
--   d.status                              AS deal_status,
--   'inspection'::TEXT                    AS event_type,
--   cf.initial_inspection_date            AS event_date,
--   NULL::DATE                            AS event_end_date,
--   NULL::TIME                            AS event_time,
--   NULL::INTEGER                         AS duration_min,
--   NULL::INTEGER                         AS buffer_min,
--   'Inspection: ' || d.address           AS event_label,
--   NULL::JSONB                           AS metadata
-- FROM deals d
-- JOIN deal_contract_facts cf ON cf.deal_id = d.id
-- WHERE d.deleted_at IS NULL
--   AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
--   AND cf.initial_inspection_date IS NOT NULL
--
-- UNION ALL

-- ---- 6. Earnest Money ----
SELECT
  d.id::TEXT || '-earnest_money'        AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'earnest_money'::TEXT                 AS event_type,
  cf.earnest_money_date                 AS event_date,
  NULL::DATE                            AS event_end_date,
  NULL::TIME                            AS event_time,
  NULL::INTEGER                         AS duration_min,
  NULL::INTEGER                         AS buffer_min,
  'Earnest $: ' || d.address            AS event_label,
  NULL::JSONB                           AS metadata
FROM deals d
JOIN deal_contract_facts cf ON cf.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
  AND cf.earnest_money_date IS NOT NULL

UNION ALL

-- ---- 7. Contract Date ----
SELECT
  d.id::TEXT || '-contract'             AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'contract'::TEXT                      AS event_type,
  d.contract_date                       AS event_date,
  NULL::DATE                            AS event_end_date,
  NULL::TIME                            AS event_time,
  NULL::INTEGER                         AS duration_min,
  NULL::INTEGER                         AS buffer_min,
  'Contract: ' || d.address             AS event_label,
  NULL::JSONB                           AS metadata
FROM deals d
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
  AND d.contract_date IS NOT NULL

UNION ALL

-- ---- 8. Showings ----
SELECT
  s.id::TEXT || '-showing'              AS event_id,
  d.id                                  AS deal_id,
  d.team_id,
  d.owner_id,
  d.transaction_coordinator_id          AS tc_id,
  d.address || COALESCE(', ' || d.city, '') || COALESCE(', ' || d.state, '')
                                        AS deal_address,
  d.status                              AS deal_status,
  'showing'::TEXT                       AS event_type,
  s.showing_datetime::DATE              AS event_date,
  NULL::DATE                            AS event_end_date,
  s.showing_datetime::TIME              AS event_time,
  s.duration_minutes                    AS duration_min,
  s.buffer_minutes                      AS buffer_min,
  'Showing: ' || d.address              AS event_label,
  jsonb_build_object(
    'showing_status', s.status,
    'buyer_contact_id', s.buyer_contact_id,
    'vendor_contact_id', s.vendor_contact_id,
    'showing_id', s.id,
    'notes', s.notes
  )                                     AS metadata
FROM deals d
JOIN deal_showings s ON s.deal_id = d.id
WHERE d.deleted_at IS NULL
  AND d.status IN ('active', 'for_sale', 'pending_sale', 'on_hold')
;


-- =============================================================================
-- 2. FUNCTION: get_calendar_events
-- =============================================================================
-- Queries the view with scope, date-range, and optional owner filtering.
-- Uses SECURITY DEFINER to bypass RLS for read-only aggregation while
-- still enforcing team_id isolation.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_calendar_events(
  p_team_id      UUID,
  p_user_id      UUID,
  p_scope        TEXT    DEFAULT 'my_deals',   -- 'my_deals' | 'team_deals'
  p_start_date   DATE    DEFAULT NULL,
  p_end_date     DATE    DEFAULT NULL,
  p_owner_filter UUID    DEFAULT NULL          -- optional: filter to specific owner
)
RETURNS TABLE (
  event_id       TEXT,
  deal_id        UUID,
  team_id        UUID,
  owner_id       UUID,
  tc_id          UUID,
  deal_address   TEXT,
  deal_status    deal_status,
  event_type     TEXT,
  event_date     DATE,
  event_end_date DATE,
  event_time     TIME,
  duration_min   INTEGER,
  buffer_min     INTEGER,
  event_label    TEXT,
  metadata       JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.event_id,
    v.deal_id,
    v.team_id,
    v.owner_id,
    v.tc_id,
    v.deal_address,
    v.deal_status,
    v.event_type,
    v.event_date,
    v.event_end_date,
    v.event_time,
    v.duration_min,
    v.buffer_min,
    v.event_label,
    v.metadata
  FROM deal_calendar_events v
  WHERE v.team_id = p_team_id

    -- Scope filter
    AND (
      p_scope = 'team_deals'
      OR (v.owner_id = p_user_id OR v.tc_id = p_user_id)
    )

    -- Optional owner filter (only in team_deals scope)
    AND (
      p_owner_filter IS NULL
      OR v.owner_id = p_owner_filter
    )

    -- Date range filter with overlap logic for range events (dd_period)
    AND (
      p_start_date IS NULL
      OR (
        -- Range events: include if they overlap the window
        CASE WHEN v.event_end_date IS NOT NULL
          THEN v.event_date <= COALESCE(p_end_date, v.event_date)
               AND v.event_end_date >= p_start_date
          -- Point events: include if within window
          ELSE v.event_date >= p_start_date
        END
      )
    )
    AND (
      p_end_date IS NULL
      OR (
        CASE WHEN v.event_end_date IS NOT NULL
          THEN v.event_date <= p_end_date
          ELSE v.event_date <= p_end_date
        END
      )
    )

  ORDER BY v.event_date ASC, v.event_time ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
