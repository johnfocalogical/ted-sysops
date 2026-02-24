-- Add commission_percentage to deal_employees for per-deal commission rates
ALTER TABLE deal_employees
  ADD COLUMN commission_percentage NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN deal_employees.commission_percentage IS 'Per-deal commission percentage for this employee (overrides role-based rules)';
