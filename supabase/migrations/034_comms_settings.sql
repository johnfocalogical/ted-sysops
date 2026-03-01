-- ============================================================================
-- Migration: Add comms_settings JSONB column to teams table
-- Description: Stores per-team configuration for deal event broadcasting
--              to conversations. Controls which event types are broadcast
--              and configurable thresholds.
-- ============================================================================

ALTER TABLE teams
ADD COLUMN IF NOT EXISTS comms_settings JSONB NOT NULL DEFAULT '{
  "broadcast_enabled": false,
  "events": {
    "status_change": false,
    "automator_milestone": false,
    "employee_change": false,
    "vendor_change": false,
    "financial_event": false,
    "checklist_completion": false
  },
  "thresholds": {
    "min_expense_amount": 200,
    "min_profit_change_pct": 10
  }
}'::jsonb;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_teams_comms_settings
ON teams USING gin (comms_settings);
