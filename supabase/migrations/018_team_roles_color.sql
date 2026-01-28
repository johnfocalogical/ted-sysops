-- Add color column to team_roles for role badge styling
ALTER TABLE team_roles ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6B7280';
