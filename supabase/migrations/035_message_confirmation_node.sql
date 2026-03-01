-- ============================================================================
-- Migration: Add message_confirmation node support to automator instances
-- Description: Adds confirmation_message_id column to automator_instances
--              for tracking which message is waiting for confirmation.
--              Extends execute_automator_step to handle the
--              'messageConfirmation' node type.
-- ============================================================================

-- Add confirmation tracking column to automator_instances
ALTER TABLE automator_instances
ADD COLUMN IF NOT EXISTS confirmation_message_id UUID REFERENCES messages(id);

-- Index for looking up instances waiting for confirmation on a message
CREATE INDEX IF NOT EXISTS idx_automator_instances_confirmation_message
ON automator_instances (confirmation_message_id)
WHERE confirmation_message_id IS NOT NULL;
