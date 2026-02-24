-- ============================================================================
-- Migration: Deal One-to-One Fact Tables
-- Description: Creates the four fact tables that extend deals with detailed
--              data. Each uses deal_id as BOTH primary key and foreign key,
--              enforcing a strict 1:1 relationship with ON DELETE CASCADE.
-- ============================================================================

-- ============================================================================
-- 1. DEAL CONTRACT FACTS
-- Contract-specific details: prices, dates, deposits
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_contract_facts (
    deal_id UUID PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,

    -- Prices
    original_contract_price DECIMAL(12,2),
    actual_contract_price DECIMAL(12,2),

    -- Dates
    contract_date DATE,
    due_diligence_date DATE,
    due_diligence_end_date DATE,
    original_closing_date DATE,
    extended_closing_date DATE,

    -- Deposit / earnest money
    earnest_money_amount DECIMAL(12,2),
    earnest_money_held_by TEXT,
    earnest_money_date DATE,

    -- Flexible storage
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. DEAL PROPERTY FACTS
-- Physical property details, legal description, mortgage/foreclosure info
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_property_facts (
    deal_id UUID PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,

    -- Property details
    property_type TEXT,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    sqft INTEGER,
    lot_size TEXT,
    year_built INTEGER,

    -- Legal
    legal_description TEXT,
    parcel_number TEXT,

    -- Mortgage / lien info
    mortgage_balance DECIMAL(12,2),
    mortgage_monthly_payment DECIMAL(10,2),
    mortgage_lender TEXT,
    liens_amount DECIMAL(12,2),
    liens_description TEXT,

    -- Foreclosure
    is_foreclosure BOOLEAN NOT NULL DEFAULT FALSE,
    foreclosure_auction_date DATE,
    foreclosure_status TEXT,

    -- Condition
    property_condition TEXT,
    arv DECIMAL(12,2),           -- After Repair Value
    estimated_repair_cost DECIMAL(12,2),

    -- Flexible storage
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. DEAL FACTS
-- Transaction context: lead source, title progress, purchase method
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_facts (
    deal_id UUID PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,

    -- Lead / acquisition
    lead_source TEXT,
    lead_source_detail TEXT,
    reason_for_selling TEXT,

    -- Title
    title_status title_status NOT NULL DEFAULT 'not_ordered',
    title_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    title_ordered_date DATE,
    title_clear_date DATE,

    -- POA (Power of Attorney)
    poa_required BOOLEAN NOT NULL DEFAULT FALSE,
    poa_status TEXT,

    -- Purchase method
    purchase_type purchase_type,

    -- Flexible storage
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for title company lookups
CREATE INDEX IF NOT EXISTS idx_deal_facts_title_company_id ON deal_facts(title_company_id)
    WHERE title_company_id IS NOT NULL;

-- ============================================================================
-- 4. DEAL DISPOSITION
-- Exit strategy: sale prices, JV configuration, buyer details
-- ============================================================================

CREATE TABLE IF NOT EXISTS deal_disposition (
    deal_id UUID PRIMARY KEY REFERENCES deals(id) ON DELETE CASCADE,

    -- Projected sale prices
    original_projected_sale_price DECIMAL(12,2),
    updated_projected_sale_price DECIMAL(12,2),
    actual_sale_price DECIMAL(12,2),

    -- Listing info
    listing_price DECIMAL(12,2),
    listing_date DATE,
    listing_agent_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- JV (Joint Venture) configuration
    is_jv_deal BOOLEAN NOT NULL DEFAULT FALSE,
    jv_type jv_type,
    jv_fixed_amount DECIMAL(12,2),
    jv_percentage DECIMAL(5,2),
    jv_partner_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Assignment (for wholesale)
    assignment_fee DECIMAL(12,2),

    -- Flexible storage
    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for JV partner and listing agent lookups
CREATE INDEX IF NOT EXISTS idx_deal_disposition_jv_partner ON deal_disposition(jv_partner_contact_id)
    WHERE jv_partner_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_disposition_listing_agent ON deal_disposition(listing_agent_contact_id)
    WHERE listing_agent_contact_id IS NOT NULL;

-- ============================================================================
-- 5. TRIGGERS — updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_deal_contract_facts_updated_at ON deal_contract_facts;
CREATE TRIGGER update_deal_contract_facts_updated_at
    BEFORE UPDATE ON deal_contract_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_property_facts_updated_at ON deal_property_facts;
CREATE TRIGGER update_deal_property_facts_updated_at
    BEFORE UPDATE ON deal_property_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_facts_updated_at ON deal_facts;
CREATE TRIGGER update_deal_facts_updated_at
    BEFORE UPDATE ON deal_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deal_disposition_updated_at ON deal_disposition;
CREATE TRIGGER update_deal_disposition_updated_at
    BEFORE UPDATE ON deal_disposition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE
-- ============================================================================
