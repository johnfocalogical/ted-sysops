-- ============================================================================
-- Migration: Add parent_automator_ids to automators table
-- Description: Denormalized array tracking which automators trigger this one
--              as a child. Enables the list page to show dependency trees
--              without parsing every definition JSONB.
-- ============================================================================

-- Add parent_automator_ids column with empty array default
ALTER TABLE automators ADD COLUMN IF NOT EXISTS parent_automator_ids UUID[] DEFAULT '{}';

-- GIN index for efficient array containment queries
CREATE INDEX IF NOT EXISTS idx_automators_parent_ids
    ON automators USING GIN (parent_automator_ids);
