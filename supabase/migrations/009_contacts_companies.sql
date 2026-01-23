-- ============================================================================
-- Migration: Contacts & Companies Foundation (Epic 3A)
-- Description: Core contact and company management schema for tracking people,
--              organizations, their relationships, and contact methods
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Contact method type (phone, email, fax, other)
DO $$ BEGIN
    CREATE TYPE contact_method_type AS ENUM ('phone', 'email', 'fax', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. LOOKUP TABLES (Hard-coded types for MVP)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 Contact Types - Categories for contacts (people)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2.2 Company Types - Categories for companies (organizations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. MAIN TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Contacts - People/individuals tracked by the team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_team_id ON contacts(team_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(team_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at DESC);

-- ----------------------------------------------------------------------------
-- 3.2 Companies - Organizations/businesses tracked by the team
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    website TEXT,
    notes TEXT,
    poc_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_team_id ON companies(team_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(team_id, name);
CREATE INDEX IF NOT EXISTS idx_companies_poc ON companies(poc_contact_id);
CREATE INDEX IF NOT EXISTS idx_companies_city_state ON companies(team_id, state, city);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at DESC);

-- ============================================================================
-- 4. JUNCTION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Contact Type Assignments - Many-to-many contact <-> type
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_type_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES contact_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contact_id, type_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_type_assignments_contact ON contact_type_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_type_assignments_type ON contact_type_assignments(type_id);

-- ----------------------------------------------------------------------------
-- 4.2 Company Type Assignments - Many-to-many company <-> type
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_type_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES company_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, type_id)
);

CREATE INDEX IF NOT EXISTS idx_company_type_assignments_company ON company_type_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_type_assignments_type ON company_type_assignments(type_id);

-- ----------------------------------------------------------------------------
-- 4.3 Contact-Company Links - Relationships between contacts and companies
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_title TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contact_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_companies_contact ON contact_companies(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_companies_company ON contact_companies(company_id);

-- ============================================================================
-- 5. CONTACT METHODS (Polymorphic)
-- ============================================================================

-- Contact methods can belong to:
-- - A contact (personal methods)
-- - A company (general business methods)
-- - A contact_company relationship (work methods for that relationship)
CREATE TABLE IF NOT EXISTS contact_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Owner references (exactly one must be set)
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_company_id UUID REFERENCES contact_companies(id) ON DELETE CASCADE,
    -- Method details
    method_type contact_method_type NOT NULL,
    label TEXT,
    value TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Exactly one owner must be set
    CONSTRAINT contact_methods_owner_check CHECK (
        (CASE WHEN contact_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN contact_company_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- Partial indexes for each owner type
CREATE INDEX IF NOT EXISTS idx_contact_methods_contact
    ON contact_methods(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_methods_company
    ON contact_methods(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_methods_relationship
    ON contact_methods(contact_company_id) WHERE contact_company_id IS NOT NULL;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_companies_updated_at ON contact_companies;
CREATE TRIGGER update_contact_companies_updated_at
    BEFORE UPDATE ON contact_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_methods_updated_at ON contact_methods;
CREATE TRIGGER update_contact_methods_updated_at
    BEFORE UPDATE ON contact_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE contact_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_methods ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7.1 Type Tables - Public read (hard-coded for MVP)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_types_select" ON contact_types;
CREATE POLICY "contact_types_select" ON contact_types
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "contact_types_all" ON contact_types;
CREATE POLICY "contact_types_all" ON contact_types
    FOR ALL USING (is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "company_types_select" ON company_types;
CREATE POLICY "company_types_select" ON company_types
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "company_types_all" ON company_types;
CREATE POLICY "company_types_all" ON company_types
    FOR ALL USING (is_superadmin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 7.2 Contacts - Team-based access
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contacts_select" ON contacts;
CREATE POLICY "contacts_select" ON contacts
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contacts_insert" ON contacts;
CREATE POLICY "contacts_insert" ON contacts
    FOR INSERT WITH CHECK (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contacts_update" ON contacts;
CREATE POLICY "contacts_update" ON contacts
    FOR UPDATE USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contacts_delete" ON contacts;
CREATE POLICY "contacts_delete" ON contacts
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 7.3 Companies - Team-based access
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies
    FOR INSERT WITH CHECK (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update" ON companies
    FOR UPDATE USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "companies_delete" ON companies;
CREATE POLICY "companies_delete" ON companies
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 7.4 Contact Type Assignments - Access via parent contact
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_type_assignments_select" ON contact_type_assignments;
CREATE POLICY "contact_type_assignments_select" ON contact_type_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_type_assignments_insert" ON contact_type_assignments;
CREATE POLICY "contact_type_assignments_insert" ON contact_type_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_type_assignments_delete" ON contact_type_assignments;
CREATE POLICY "contact_type_assignments_delete" ON contact_type_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 7.5 Company Type Assignments - Access via parent company
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "company_type_assignments_select" ON company_type_assignments;
CREATE POLICY "company_type_assignments_select" ON company_type_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = company_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "company_type_assignments_insert" ON company_type_assignments;
CREATE POLICY "company_type_assignments_insert" ON company_type_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = company_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "company_type_assignments_delete" ON company_type_assignments;
CREATE POLICY "company_type_assignments_delete" ON company_type_assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = company_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 7.6 Contact-Company Links - Access via parent contact
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_companies_select" ON contact_companies;
CREATE POLICY "contact_companies_select" ON contact_companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_companies_insert" ON contact_companies;
CREATE POLICY "contact_companies_insert" ON contact_companies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_companies_update" ON contact_companies;
CREATE POLICY "contact_companies_update" ON contact_companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_companies_delete" ON contact_companies;
CREATE POLICY "contact_companies_delete" ON contact_companies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        )
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 7.7 Contact Methods - Access via owner
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_methods_select" ON contact_methods;
CREATE POLICY "contact_methods_select" ON contact_methods
    FOR SELECT USING (
        -- Personal methods: access via contact
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        -- Company methods: access via company
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        -- Relationship methods: access via contact-company link
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_methods_insert" ON contact_methods;
CREATE POLICY "contact_methods_insert" ON contact_methods
    FOR INSERT WITH CHECK (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_methods_update" ON contact_methods;
CREATE POLICY "contact_methods_update" ON contact_methods
    FOR UPDATE USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "contact_methods_delete" ON contact_methods;
CREATE POLICY "contact_methods_delete" ON contact_methods
    FOR DELETE USING (
        (contact_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contacts c
            WHERE c.id = contact_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM companies co
            WHERE co.id = company_id
            AND is_team_member(co.team_id, auth.uid())
        ))
        OR (contact_company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM contact_companies cc
            JOIN contacts c ON c.id = cc.contact_id
            WHERE cc.id = contact_company_id
            AND is_team_member(c.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 8. SEED DATA - Default Types
-- ============================================================================

-- Contact Types (for wholesaling/real estate)
INSERT INTO contact_types (name, description, color, sort_order) VALUES
    ('Seller', 'Property seller or motivated seller lead', 'blue', 1),
    ('Buyer', 'Cash buyer or end buyer', 'green', 2),
    ('Investor', 'Private money lender or JV partner', 'purple', 3),
    ('Agent', 'Real estate agent or broker', 'teal', 4),
    ('Wholesaler', 'Fellow wholesaler for JV deals', 'amber', 5),
    ('Contractor', 'General contractor or handyman', 'orange', 6),
    ('Attorney', 'Real estate attorney', 'gray', 7),
    ('Other', 'Other contact type', 'slate', 99)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- Company Types (for wholesaling/real estate)
INSERT INTO company_types (name, description, color, sort_order) VALUES
    ('Title Company', 'Title and escrow services', 'blue', 1),
    ('Lender', 'Hard money or private lender', 'green', 2),
    ('Brokerage', 'Real estate brokerage', 'teal', 3),
    ('Contractor', 'General contracting company', 'orange', 4),
    ('Property Management', 'Property management company', 'purple', 5),
    ('Inspection', 'Home inspection service', 'amber', 6),
    ('Legal', 'Law firm or legal services', 'gray', 7),
    ('Marketing', 'Marketing or lead generation', 'pink', 8),
    ('Other', 'Other company type', 'slate', 99)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- COMPLETE
-- ============================================================================
