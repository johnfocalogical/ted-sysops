-- ============================================================================
-- Migration: Deal Enums & Base Deals Table
-- Description: Creates all deal-related enums and the central deals table.
--              This is the foundation for the entire deal pipeline system.
--              Fact tables, junction tables, and RLS follow in subsequent
--              migrations.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Deal lifecycle status
DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM (
        'active',
        'for_sale',
        'pending_sale',
        'closed',
        'funded',
        'on_hold',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Deal type / strategy
DO $$ BEGIN
    CREATE TYPE deal_type AS ENUM (
        'wholesale',
        'listing',
        'novation',
        'purchase'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- How the property is being purchased
DO $$ BEGIN
    CREATE TYPE purchase_type AS ENUM (
        'cash',
        'financing',
        'subject_to',
        'owner_finance',
        'hard_money'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Title/escrow progress
DO $$ BEGIN
    CREATE TYPE title_status AS ENUM (
        'not_ordered',
        'ordered',
        'in_progress',
        'clear',
        'issues',
        'ready_to_close'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Expense categories for deal costs
DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM (
        'marketing',
        'inspection',
        'title_escrow',
        'legal',
        'hoa',
        'earnest_money',
        'contractor',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Joint venture fee type
DO $$ BEGIN
    CREATE TYPE jv_type AS ENUM (
        'fixed',
        'percentage'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. DEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Core identification
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip TEXT,
    county TEXT,

    -- Classification
    deal_type deal_type NOT NULL,
    status deal_status NOT NULL DEFAULT 'active',

    -- Key people (FKs)
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    buyer_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Key dates
    contract_date DATE,
    closing_date DATE,

    -- Summary financial (user-entered base values)
    contract_price DECIMAL(12,2),

    -- Flexible storage
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,

    -- Soft delete
    deleted_at TIMESTAMPTZ,

    -- Audit
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Team scoping (primary filter for all queries)
CREATE INDEX IF NOT EXISTS idx_deals_team_id ON deals(team_id);

-- Pipeline / whiteboard queries: team + status
CREATE INDEX IF NOT EXISTS idx_deals_team_status ON deals(team_id, status);

-- Owner lookup
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);

-- TC lookup
CREATE INDEX IF NOT EXISTS idx_deals_tc_id ON deals(transaction_coordinator_id)
    WHERE transaction_coordinator_id IS NOT NULL;

-- Contact lookups
CREATE INDEX IF NOT EXISTS idx_deals_seller_contact_id ON deals(seller_contact_id)
    WHERE seller_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_buyer_contact_id ON deals(buyer_contact_id)
    WHERE buyer_contact_id IS NOT NULL;

-- Date-based queries (upcoming closings, overdue, etc.)
CREATE INDEX IF NOT EXISTS idx_deals_closing_date ON deals(team_id, closing_date)
    WHERE closing_date IS NOT NULL;

-- Soft-delete filter (most queries exclude deleted)
CREATE INDEX IF NOT EXISTS idx_deals_not_deleted ON deals(team_id)
    WHERE deleted_at IS NULL;

-- Full-text search on address
CREATE INDEX IF NOT EXISTS idx_deals_address_fts ON deals
    USING GIN(to_tsvector('english', address));

-- JSONB custom fields
CREATE INDEX IF NOT EXISTS idx_deals_custom_fields ON deals
    USING GIN(custom_fields);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. EXTEND ACTIVITY LOGS FOR DEALS
-- ============================================================================

-- Add deal_id column to activity_logs
ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE CASCADE;

-- Partial index for deal activity
CREATE INDEX IF NOT EXISTS idx_activity_logs_deal_id
    ON activity_logs(deal_id) WHERE deal_id IS NOT NULL;

-- Update entity check constraint to include deal_id
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_check;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_check CHECK (
    (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN employee_profile_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN deal_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- ============================================================================
-- COMPLETE
-- ============================================================================
