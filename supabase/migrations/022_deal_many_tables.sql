-- ============================================================================
-- Migration: Deal One-to-Many Tables
-- Description: Creates junction and child tables for deals: employees,
--              vendors, expenses, showings, checklist items, comments, notes.
--              All reference deals via deal_id FK with ON DELETE CASCADE.
-- ============================================================================

-- ============================================================================
-- 1. DEAL EMPLOYEES (Junction: deals <-> users)
-- Track which team members worked on a deal and in what capacity
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT,                -- e.g. 'acquisitions', 'dispositions', 'runner'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(deal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_employees_deal_id ON deal_employees(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_employees_user_id ON deal_employees(user_id);

-- ============================================================================
-- 2. DEAL VENDORS (Junction: deals <-> contacts/companies)
-- External service providers per deal. Exactly one of contact_id or company_id
-- must be set.
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role TEXT,                -- e.g. 'title_company', 'inspector', 'attorney'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one vendor reference must be set
    CONSTRAINT deal_vendors_entity_check CHECK (
        (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

CREATE INDEX IF NOT EXISTS idx_deal_vendors_deal_id ON deal_vendors(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_vendors_contact_id ON deal_vendors(contact_id)
    WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_vendors_company_id ON deal_vendors(company_id)
    WHERE company_id IS NOT NULL;

-- ============================================================================
-- 3. DEAL EXPENSES
-- Costs incurred per deal with categorization
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    category expense_category NOT NULL DEFAULT 'other',
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_expenses_deal_id ON deal_expenses(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_expenses_category ON deal_expenses(deal_id, category);

-- ============================================================================
-- 4. DEAL SHOWINGS
-- Property showing schedule with buyer/vendor coordination
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_showings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    showing_datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_minutes INTEGER NOT NULL DEFAULT 15,
    buyer_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    vendor_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',     -- scheduled, completed, canceled, no_show
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_showings_deal_id ON deal_showings(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_showings_datetime ON deal_showings(showing_datetime);

-- ============================================================================
-- 5. DEAL CHECKLIST ITEMS
-- Per-deal task/checklist tracking (can be populated by automators)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,              -- machine-readable key (e.g. 'title_ordered')
    label TEXT NOT NULL,                 -- human-readable label
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    date_completed TIMESTAMPTZ,
    price DECIMAL(12,2),                 -- optional associated cost
    sort_order INTEGER NOT NULL DEFAULT 0,
    process_instance_id UUID,            -- link to automator process that created it
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(deal_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_deal_checklist_items_deal_id ON deal_checklist_items(deal_id);

-- ============================================================================
-- 6. DEAL COMMENTS
-- Team discussion threads on deals
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tagged_user_ids UUID[],              -- for @mentions / notifications
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_comments_deal_id ON deal_comments(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_comments_created_at ON deal_comments(deal_id, created_at DESC);

-- ============================================================================
-- 7. DEAL NOTES
-- Personal/team notes on deals (less formal than comments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id ON deal_notes(deal_id);

-- ============================================================================
-- 8. TRIGGERS — updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_deal_employees_updated_at ON deal_employees;
CREATE TRIGGER update_deal_employees_updated_at
    BEFORE UPDATE ON deal_employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_vendors_updated_at ON deal_vendors;
CREATE TRIGGER update_deal_vendors_updated_at
    BEFORE UPDATE ON deal_vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_expenses_updated_at ON deal_expenses;
CREATE TRIGGER update_deal_expenses_updated_at
    BEFORE UPDATE ON deal_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_showings_updated_at ON deal_showings;
CREATE TRIGGER update_deal_showings_updated_at
    BEFORE UPDATE ON deal_showings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_checklist_items_updated_at ON deal_checklist_items;
CREATE TRIGGER update_deal_checklist_items_updated_at
    BEFORE UPDATE ON deal_checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_comments_updated_at ON deal_comments;
CREATE TRIGGER update_deal_comments_updated_at
    BEFORE UPDATE ON deal_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_notes_updated_at ON deal_notes;
CREATE TRIGGER update_deal_notes_updated_at
    BEFORE UPDATE ON deal_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE
-- ============================================================================
