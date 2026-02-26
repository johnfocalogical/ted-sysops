-- =============================================================================
-- Migration 030: Dashboard Postgres Functions
-- =============================================================================
-- Eight RPC functions powering My Dashboard and Team Dashboard.
-- All functions enforce team scoping via p_team_id parameter.
-- Uses SECURITY DEFINER to bypass RLS for aggregation while still
-- filtering by p_team_id for isolation.
-- =============================================================================

-- Helper: calculate JV fee for a deal given its disposition row
-- Returns 0 when no JV deal or missing data.
CREATE OR REPLACE FUNCTION _dashboard_jv_fee(
  p_is_jv_deal BOOLEAN,
  p_jv_type TEXT,
  p_jv_fixed_amount NUMERIC,
  p_jv_percentage NUMERIC,
  p_sale_price NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF NOT COALESCE(p_is_jv_deal, FALSE) THEN
    RETURN 0;
  END IF;
  IF p_jv_type = 'fixed' AND p_jv_fixed_amount IS NOT NULL THEN
    RETURN p_jv_fixed_amount;
  END IF;
  IF p_jv_type = 'percentage' AND p_jv_percentage IS NOT NULL AND p_sale_price IS NOT NULL THEN
    RETURN (p_sale_price * p_jv_percentage / 100);
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- =============================================================================
-- 1. dashboard_my_deadlines
-- =============================================================================
-- Returns deals with upcoming deadlines where user is owner OR TC.
-- Each deadline type that falls within p_days_ahead gets its own row.

CREATE OR REPLACE FUNCTION dashboard_my_deadlines(
  p_team_id UUID,
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  deal_id       UUID,
  address       TEXT,
  status        TEXT,
  deadline_type TEXT,
  deadline_date DATE,
  days_remaining INTEGER,
  owner_name    TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id                       AS deal_id,
    d.address                  AS address,
    d.status::TEXT              AS status,
    dl.deadline_type            AS deadline_type,
    dl.deadline_date            AS deadline_date,
    (dl.deadline_date - CURRENT_DATE)::INTEGER AS days_remaining,
    u.full_name                AS owner_name
  FROM deals d
  JOIN deal_contract_facts cf ON cf.deal_id = d.id
  JOIN users u ON u.id = d.owner_id
  -- Unpivot the three deadline columns into rows
  CROSS JOIN LATERAL (
    VALUES
      ('dd_expiration',    cf.due_diligence_end_date),
      ('closing_date',     cf.original_closing_date),
      ('extended_closing', cf.extended_closing_date)
  ) AS dl(deadline_type, deadline_date)
  WHERE d.team_id = p_team_id
    AND d.deleted_at IS NULL
    AND d.status IN ('active', 'for_sale', 'pending_sale')
    AND (d.owner_id = p_user_id OR d.transaction_coordinator_id = p_user_id)
    AND dl.deadline_date IS NOT NULL
    AND dl.deadline_date >= CURRENT_DATE
    AND dl.deadline_date <= CURRENT_DATE + p_days_ahead
  ORDER BY dl.deadline_date ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 2. dashboard_my_pipeline
-- =============================================================================
-- Deal counts and profit grouped by status for deals where user is owner,
-- TC, or assigned employee.

CREATE OR REPLACE FUNCTION dashboard_my_pipeline(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  status                TEXT,
  deal_count            BIGINT,
  total_projected_profit NUMERIC,
  total_actual_profit    NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_deals AS (
    SELECT DISTINCT d.id, d.status
    FROM deals d
    LEFT JOIN deal_employees de ON de.deal_id = d.id
    WHERE d.team_id = p_team_id
      AND d.deleted_at IS NULL
      AND (
        d.owner_id = p_user_id
        OR d.transaction_coordinator_id = p_user_id
        OR de.user_id = p_user_id
      )
  ),
  deal_financials AS (
    SELECT
      ud.id,
      ud.status,
      -- Best projected sale price
      COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price) AS projected_price,
      dd.actual_sale_price,
      COALESCE(d.contract_price, 0) AS contract_price,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price)
      ) AS projected_jv,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        dd.actual_sale_price
      ) AS actual_jv,
      COALESCE(exp.total, 0) AS total_expenses
    FROM user_deals ud
    JOIN deals d ON d.id = ud.id
    LEFT JOIN deal_disposition dd ON dd.deal_id = ud.id
    LEFT JOIN (
      SELECT deal_id, SUM(amount) AS total
      FROM deal_expenses
      GROUP BY deal_id
    ) exp ON exp.deal_id = ud.id
  )
  SELECT
    df.status::TEXT,
    COUNT(*)::BIGINT AS deal_count,
    SUM(
      CASE WHEN df.projected_price IS NOT NULL
        THEN df.projected_price - df.contract_price - df.projected_jv - df.total_expenses
        ELSE 0
      END
    ) AS total_projected_profit,
    SUM(
      CASE WHEN df.actual_sale_price IS NOT NULL
        THEN df.actual_sale_price - df.contract_price - df.actual_jv - df.total_expenses
        ELSE 0
      END
    ) AS total_actual_profit
  FROM deal_financials df
  GROUP BY df.status;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 3. dashboard_my_financials
-- =============================================================================
-- Single-row financial summary for the user.

CREATE OR REPLACE FUNCTION dashboard_my_financials(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  pipeline_value         NUMERIC,
  closed_revenue_mtd     NUMERIC,
  closed_revenue_qtd     NUMERIC,
  estimated_commissions  NUMERIC,
  total_expenses         NUMERIC
) AS $$
DECLARE
  v_month_start DATE;
  v_quarter_start DATE;
BEGIN
  v_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_quarter_start := DATE_TRUNC('quarter', CURRENT_DATE)::DATE;

  RETURN QUERY
  WITH user_deals AS (
    SELECT DISTINCT d.id, d.status, d.contract_price
    FROM deals d
    LEFT JOIN deal_employees de ON de.deal_id = d.id
    WHERE d.team_id = p_team_id
      AND d.deleted_at IS NULL
      AND (
        d.owner_id = p_user_id
        OR d.transaction_coordinator_id = p_user_id
        OR de.user_id = p_user_id
      )
  ),
  enriched AS (
    SELECT
      ud.id,
      ud.status,
      COALESCE(ud.contract_price, 0) AS contract_price,
      COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price) AS projected_price,
      dd.actual_sale_price,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price)
      ) AS projected_jv,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        dd.actual_sale_price
      ) AS actual_jv,
      COALESCE(exp.total, 0) AS expenses,
      cf.original_closing_date,
      cf.extended_closing_date
    FROM user_deals ud
    LEFT JOIN deal_disposition dd ON dd.deal_id = ud.id
    LEFT JOIN deal_contract_facts cf ON cf.deal_id = ud.id
    LEFT JOIN (
      SELECT deal_id, SUM(amount) AS total
      FROM deal_expenses
      GROUP BY deal_id
    ) exp ON exp.deal_id = ud.id
  ),
  -- Closing date: prefer extended, fallback to original
  with_close_date AS (
    SELECT e.*,
      COALESCE(e.extended_closing_date, e.original_closing_date) AS closing_date
    FROM enriched e
  )
  SELECT
    -- pipeline_value: projected profit on non-closed/non-canceled deals
    COALESCE(SUM(
      CASE WHEN wcd.status NOT IN ('closed', 'funded', 'canceled') AND wcd.projected_price IS NOT NULL
        THEN wcd.projected_price - wcd.contract_price - wcd.projected_jv - wcd.expenses
        ELSE 0
      END
    ), 0) AS pipeline_value,

    -- closed_revenue_mtd
    COALESCE(SUM(
      CASE WHEN wcd.status IN ('closed', 'funded')
        AND wcd.closing_date >= v_month_start
        AND wcd.actual_sale_price IS NOT NULL
        THEN wcd.actual_sale_price
        ELSE 0
      END
    ), 0) AS closed_revenue_mtd,

    -- closed_revenue_qtd
    COALESCE(SUM(
      CASE WHEN wcd.status IN ('closed', 'funded')
        AND wcd.closing_date >= v_quarter_start
        AND wcd.actual_sale_price IS NOT NULL
        THEN wcd.actual_sale_price
        ELSE 0
      END
    ), 0) AS closed_revenue_qtd,

    -- estimated_commissions: from deal_employees for this user
    COALESCE((
      SELECT SUM(
        CASE WHEN de2.commission_percentage IS NOT NULL AND wcd2.projected_price IS NOT NULL
          THEN (wcd2.projected_price - wcd2.contract_price - wcd2.projected_jv - wcd2.expenses)
               * (de2.commission_percentage / 100)
          ELSE 0
        END
      )
      FROM deal_employees de2
      JOIN with_close_date wcd2 ON wcd2.id = de2.deal_id
      WHERE de2.user_id = p_user_id
        AND wcd2.status NOT IN ('canceled')
    ), 0) AS estimated_commissions,

    -- total_expenses across user's deals
    COALESCE(SUM(wcd.expenses), 0) AS total_expenses

  FROM with_close_date wcd;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 4. dashboard_stale_deals
-- =============================================================================
-- Deals with no recent activity where user is owner or TC.

CREATE OR REPLACE FUNCTION dashboard_stale_deals(
  p_team_id UUID,
  p_user_id UUID,
  p_stale_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  deal_id             UUID,
  address             TEXT,
  status              TEXT,
  owner_name          TEXT,
  days_since_activity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id                        AS deal_id,
    d.address                   AS address,
    d.status::TEXT               AS status,
    u.full_name                 AS owner_name,
    COALESCE(
      (CURRENT_DATE - al.last_activity::DATE)::INTEGER,
      (CURRENT_DATE - d.created_at::DATE)::INTEGER
    ) AS days_since_activity
  FROM deals d
  JOIN users u ON u.id = d.owner_id
  LEFT JOIN (
    SELECT
      a.deal_id,
      MAX(a.created_at) AS last_activity
    FROM activity_logs a
    WHERE a.deal_id IS NOT NULL
    GROUP BY a.deal_id
  ) al ON al.deal_id = d.id
  WHERE d.team_id = p_team_id
    AND d.deleted_at IS NULL
    AND d.status IN ('active', 'for_sale', 'pending_sale')
    AND (d.owner_id = p_user_id OR d.transaction_coordinator_id = p_user_id)
    AND (
      al.last_activity IS NULL
      OR al.last_activity < NOW() - (p_stale_days || ' days')::INTERVAL
    )
  ORDER BY days_since_activity DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 5. dashboard_team_pipeline
-- =============================================================================
-- Team-wide deal counts and financials by status.
-- p_period controls which closed/funded deals are counted.

CREATE OR REPLACE FUNCTION dashboard_team_pipeline(
  p_team_id UUID,
  p_period  TEXT DEFAULT 'mtd'  -- 'mtd' | 'qtd' | 'ytd'
)
RETURNS TABLE (
  status                TEXT,
  deal_count            BIGINT,
  total_projected_profit NUMERIC,
  total_actual_profit    NUMERIC
) AS $$
DECLARE
  v_period_start DATE;
BEGIN
  v_period_start := CASE p_period
    WHEN 'qtd' THEN DATE_TRUNC('quarter', CURRENT_DATE)::DATE
    WHEN 'ytd' THEN DATE_TRUNC('year',    CURRENT_DATE)::DATE
    ELSE              DATE_TRUNC('month',   CURRENT_DATE)::DATE
  END;

  RETURN QUERY
  WITH deal_financials AS (
    SELECT
      d.id,
      d.status,
      COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price) AS projected_price,
      dd.actual_sale_price,
      COALESCE(d.contract_price, 0) AS contract_price,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price)
      ) AS projected_jv,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        dd.actual_sale_price
      ) AS actual_jv,
      COALESCE(exp.total, 0) AS total_expenses,
      COALESCE(cf.extended_closing_date, cf.original_closing_date) AS closing_date
    FROM deals d
    LEFT JOIN deal_disposition dd ON dd.deal_id = d.id
    LEFT JOIN deal_contract_facts cf ON cf.deal_id = d.id
    LEFT JOIN (
      SELECT deal_id, SUM(amount) AS total
      FROM deal_expenses
      GROUP BY deal_id
    ) exp ON exp.deal_id = d.id
    WHERE d.team_id = p_team_id
      AND d.deleted_at IS NULL
  )
  SELECT
    df.status::TEXT,
    COUNT(*)::BIGINT AS deal_count,
    SUM(
      CASE WHEN df.projected_price IS NOT NULL
        THEN df.projected_price - df.contract_price - df.projected_jv - df.total_expenses
        ELSE 0
      END
    ) AS total_projected_profit,
    -- Actual profit only for closed/funded deals in period
    SUM(
      CASE WHEN df.status::TEXT IN ('closed', 'funded')
        AND df.actual_sale_price IS NOT NULL
        AND df.closing_date >= v_period_start
        THEN df.actual_sale_price - df.contract_price - df.actual_jv - df.total_expenses
        ELSE 0
      END
    ) AS total_actual_profit
  FROM deal_financials df
  GROUP BY df.status;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 6. dashboard_team_workload
-- =============================================================================
-- Per-member deal counts.

CREATE OR REPLACE FUNCTION dashboard_team_workload(
  p_team_id UUID
)
RETURNS TABLE (
  user_id              UUID,
  full_name            TEXT,
  active_count         BIGINT,
  for_sale_count       BIGINT,
  pending_count        BIGINT,
  closed_mtd_count     BIGINT,
  total_pipeline_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.owner_id AS user_id,
    u.full_name,
    COUNT(*) FILTER (WHERE d.status = 'active')::BIGINT         AS active_count,
    COUNT(*) FILTER (WHERE d.status = 'for_sale')::BIGINT       AS for_sale_count,
    COUNT(*) FILTER (WHERE d.status = 'pending_sale')::BIGINT   AS pending_count,
    COUNT(*) FILTER (WHERE d.status IN ('closed', 'funded')
      AND COALESCE(cf.extended_closing_date, cf.original_closing_date)
          >= DATE_TRUNC('month', CURRENT_DATE)::DATE
    )::BIGINT AS closed_mtd_count,
    COALESCE(SUM(
      CASE WHEN d.status NOT IN ('closed', 'funded', 'canceled')
        AND COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price) IS NOT NULL
        THEN COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price)
             - COALESCE(d.contract_price, 0)
             - _dashboard_jv_fee(
                 dd.is_jv_deal, dd.jv_type::TEXT,
                 dd.jv_fixed_amount, dd.jv_percentage,
                 COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price)
               )
             - COALESCE(exp.total, 0)
        ELSE 0
      END
    ), 0) AS total_pipeline_value
  FROM deals d
  JOIN users u ON u.id = d.owner_id
  LEFT JOIN deal_disposition dd ON dd.deal_id = d.id
  LEFT JOIN deal_contract_facts cf ON cf.deal_id = d.id
  LEFT JOIN (
    SELECT deal_id, SUM(amount) AS total
    FROM deal_expenses
    GROUP BY deal_id
  ) exp ON exp.deal_id = d.id
  WHERE d.team_id = p_team_id
    AND d.deleted_at IS NULL
  GROUP BY d.owner_id, u.full_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 7. dashboard_team_financials
-- =============================================================================
-- Team-wide financial totals for a given period.

CREATE OR REPLACE FUNCTION dashboard_team_financials(
  p_team_id UUID,
  p_period  TEXT DEFAULT 'mtd'  -- 'mtd' | 'qtd' | 'ytd'
)
RETURNS TABLE (
  pipeline_value  NUMERIC,
  closed_revenue  NUMERIC,
  total_expenses  NUMERIC,
  net_profit      NUMERIC
) AS $$
DECLARE
  v_period_start DATE;
BEGIN
  v_period_start := CASE p_period
    WHEN 'qtd' THEN DATE_TRUNC('quarter', CURRENT_DATE)::DATE
    WHEN 'ytd' THEN DATE_TRUNC('year',    CURRENT_DATE)::DATE
    ELSE              DATE_TRUNC('month',   CURRENT_DATE)::DATE
  END;

  RETURN QUERY
  WITH base AS (
    SELECT
      d.id,
      d.status,
      COALESCE(d.contract_price, 0) AS contract_price,
      COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price) AS projected_price,
      dd.actual_sale_price,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        COALESCE(dd.updated_projected_sale_price, dd.original_projected_sale_price)
      ) AS projected_jv,
      _dashboard_jv_fee(
        dd.is_jv_deal, dd.jv_type::TEXT,
        dd.jv_fixed_amount, dd.jv_percentage,
        dd.actual_sale_price
      ) AS actual_jv,
      COALESCE(exp.total, 0) AS expenses,
      COALESCE(cf.extended_closing_date, cf.original_closing_date) AS closing_date
    FROM deals d
    LEFT JOIN deal_disposition dd ON dd.deal_id = d.id
    LEFT JOIN deal_contract_facts cf ON cf.deal_id = d.id
    LEFT JOIN (
      SELECT deal_id, SUM(amount) AS total
      FROM deal_expenses
      GROUP BY deal_id
    ) exp ON exp.deal_id = d.id
    WHERE d.team_id = p_team_id
      AND d.deleted_at IS NULL
  )
  SELECT
    -- pipeline_value: projected profit on active pipeline deals
    COALESCE(SUM(
      CASE WHEN b.status NOT IN ('closed', 'funded', 'canceled')
        AND b.projected_price IS NOT NULL
        THEN b.projected_price - b.contract_price - b.projected_jv - b.expenses
        ELSE 0
      END
    ), 0) AS pipeline_value,

    -- closed_revenue: actual sale price for closed/funded in period
    COALESCE(SUM(
      CASE WHEN b.status IN ('closed', 'funded')
        AND b.closing_date >= v_period_start
        AND b.actual_sale_price IS NOT NULL
        THEN b.actual_sale_price
        ELSE 0
      END
    ), 0) AS closed_revenue,

    -- total_expenses: expenses for closed/funded deals in period
    COALESCE(SUM(
      CASE WHEN b.status IN ('closed', 'funded')
        AND b.closing_date >= v_period_start
        THEN b.expenses
        ELSE 0
      END
    ), 0) AS total_expenses,

    -- net_profit: actual revenue - contract - jv - expenses for closed in period
    COALESCE(SUM(
      CASE WHEN b.status IN ('closed', 'funded')
        AND b.closing_date >= v_period_start
        AND b.actual_sale_price IS NOT NULL
        THEN b.actual_sale_price - b.contract_price - b.actual_jv - b.expenses
        ELSE 0
      END
    ), 0) AS net_profit

  FROM base b;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- =============================================================================
-- 8. dashboard_recently_closed
-- =============================================================================
-- Recently closed/funded deals.

CREATE OR REPLACE FUNCTION dashboard_recently_closed(
  p_team_id UUID,
  p_days    INTEGER DEFAULT 30
)
RETURNS TABLE (
  deal_id          UUID,
  address          TEXT,
  closed_date      DATE,
  actual_sale_price NUMERIC,
  net_profit       NUMERIC,
  owner_name       TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS deal_id,
    d.address,
    COALESCE(cf.extended_closing_date, cf.original_closing_date) AS closed_date,
    dd.actual_sale_price,
    CASE WHEN dd.actual_sale_price IS NOT NULL
      THEN dd.actual_sale_price
           - COALESCE(d.contract_price, 0)
           - _dashboard_jv_fee(
               dd.is_jv_deal, dd.jv_type::TEXT,
               dd.jv_fixed_amount, dd.jv_percentage,
               dd.actual_sale_price
             )
           - COALESCE(exp.total, 0)
      ELSE NULL
    END AS net_profit,
    u.full_name AS owner_name
  FROM deals d
  JOIN users u ON u.id = d.owner_id
  LEFT JOIN deal_disposition dd ON dd.deal_id = d.id
  LEFT JOIN deal_contract_facts cf ON cf.deal_id = d.id
  LEFT JOIN (
    SELECT deal_id, SUM(amount) AS total
    FROM deal_expenses
    GROUP BY deal_id
  ) exp ON exp.deal_id = d.id
  WHERE d.team_id = p_team_id
    AND d.deleted_at IS NULL
    AND d.status IN ('closed', 'funded')
    AND COALESCE(cf.extended_closing_date, cf.original_closing_date) IS NOT NULL
    AND COALESCE(cf.extended_closing_date, cf.original_closing_date) >= CURRENT_DATE - p_days
  ORDER BY closed_date DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
