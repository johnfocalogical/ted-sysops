-- ============================================================================
-- Migration: RLS Policies for All Deal Tables
-- Description: Enables Row Level Security on all deal-related tables.
--              Deals table: team-member-based access.
--              Child tables: inherit access via subquery to parent deal's team_id.
--              Follows the same authorization pattern as contacts/companies.
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL DEAL TABLES
-- ============================================================================

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_contract_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_property_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_disposition ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DEALS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "deals_select" ON deals;
CREATE POLICY "deals_select" ON deals
    FOR SELECT USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "deals_insert" ON deals;
CREATE POLICY "deals_insert" ON deals
    FOR INSERT WITH CHECK (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "deals_update" ON deals;
CREATE POLICY "deals_update" ON deals
    FOR UPDATE USING (
        is_team_member(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "deals_delete" ON deals;
CREATE POLICY "deals_delete" ON deals
    FOR DELETE USING (
        is_team_admin(team_id, auth.uid()) OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- 3. HELPER: Macro pattern for child tables
-- All child tables inherit access via the parent deal's team_id
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 Deal Contract Facts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_contract_facts_select" ON deal_contract_facts;
CREATE POLICY "deal_contract_facts_select" ON deal_contract_facts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_contract_facts_insert" ON deal_contract_facts;
CREATE POLICY "deal_contract_facts_insert" ON deal_contract_facts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_contract_facts_update" ON deal_contract_facts;
CREATE POLICY "deal_contract_facts_update" ON deal_contract_facts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_contract_facts_delete" ON deal_contract_facts;
CREATE POLICY "deal_contract_facts_delete" ON deal_contract_facts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.2 Deal Property Facts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_property_facts_select" ON deal_property_facts;
CREATE POLICY "deal_property_facts_select" ON deal_property_facts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_property_facts_insert" ON deal_property_facts;
CREATE POLICY "deal_property_facts_insert" ON deal_property_facts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_property_facts_update" ON deal_property_facts;
CREATE POLICY "deal_property_facts_update" ON deal_property_facts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_property_facts_delete" ON deal_property_facts;
CREATE POLICY "deal_property_facts_delete" ON deal_property_facts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.3 Deal Facts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_facts_select" ON deal_facts;
CREATE POLICY "deal_facts_select" ON deal_facts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_facts_insert" ON deal_facts;
CREATE POLICY "deal_facts_insert" ON deal_facts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_facts_update" ON deal_facts;
CREATE POLICY "deal_facts_update" ON deal_facts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_facts_delete" ON deal_facts;
CREATE POLICY "deal_facts_delete" ON deal_facts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.4 Deal Disposition
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_disposition_select" ON deal_disposition;
CREATE POLICY "deal_disposition_select" ON deal_disposition
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_disposition_insert" ON deal_disposition;
CREATE POLICY "deal_disposition_insert" ON deal_disposition
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_disposition_update" ON deal_disposition;
CREATE POLICY "deal_disposition_update" ON deal_disposition
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_disposition_delete" ON deal_disposition;
CREATE POLICY "deal_disposition_delete" ON deal_disposition
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.5 Deal Employees
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_employees_select" ON deal_employees;
CREATE POLICY "deal_employees_select" ON deal_employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_employees_insert" ON deal_employees;
CREATE POLICY "deal_employees_insert" ON deal_employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_employees_update" ON deal_employees;
CREATE POLICY "deal_employees_update" ON deal_employees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_employees_delete" ON deal_employees;
CREATE POLICY "deal_employees_delete" ON deal_employees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.6 Deal Vendors
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_vendors_select" ON deal_vendors;
CREATE POLICY "deal_vendors_select" ON deal_vendors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_vendors_insert" ON deal_vendors;
CREATE POLICY "deal_vendors_insert" ON deal_vendors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_vendors_update" ON deal_vendors;
CREATE POLICY "deal_vendors_update" ON deal_vendors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_vendors_delete" ON deal_vendors;
CREATE POLICY "deal_vendors_delete" ON deal_vendors
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.7 Deal Expenses
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_expenses_select" ON deal_expenses;
CREATE POLICY "deal_expenses_select" ON deal_expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_expenses_insert" ON deal_expenses;
CREATE POLICY "deal_expenses_insert" ON deal_expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_expenses_update" ON deal_expenses;
CREATE POLICY "deal_expenses_update" ON deal_expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_expenses_delete" ON deal_expenses;
CREATE POLICY "deal_expenses_delete" ON deal_expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.8 Deal Showings
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_showings_select" ON deal_showings;
CREATE POLICY "deal_showings_select" ON deal_showings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_showings_insert" ON deal_showings;
CREATE POLICY "deal_showings_insert" ON deal_showings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_showings_update" ON deal_showings;
CREATE POLICY "deal_showings_update" ON deal_showings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_showings_delete" ON deal_showings;
CREATE POLICY "deal_showings_delete" ON deal_showings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.9 Deal Checklist Items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_checklist_items_select" ON deal_checklist_items;
CREATE POLICY "deal_checklist_items_select" ON deal_checklist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_checklist_items_insert" ON deal_checklist_items;
CREATE POLICY "deal_checklist_items_insert" ON deal_checklist_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_checklist_items_update" ON deal_checklist_items;
CREATE POLICY "deal_checklist_items_update" ON deal_checklist_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_checklist_items_delete" ON deal_checklist_items;
CREATE POLICY "deal_checklist_items_delete" ON deal_checklist_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_admin(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

-- ----------------------------------------------------------------------------
-- 3.10 Deal Comments
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_comments_select" ON deal_comments;
CREATE POLICY "deal_comments_select" ON deal_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_comments_insert" ON deal_comments;
CREATE POLICY "deal_comments_insert" ON deal_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_comments_update" ON deal_comments;
CREATE POLICY "deal_comments_update" ON deal_comments
    FOR UPDATE USING (
        -- Users can edit their own comments, admins can edit any
        (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND is_team_admin(d.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "deal_comments_delete" ON deal_comments;
CREATE POLICY "deal_comments_delete" ON deal_comments
    FOR DELETE USING (
        -- Users can delete their own comments, admins can delete any
        (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND is_team_admin(d.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 3.11 Deal Notes
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "deal_notes_select" ON deal_notes;
CREATE POLICY "deal_notes_select" ON deal_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_notes_insert" ON deal_notes;
CREATE POLICY "deal_notes_insert" ON deal_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND (is_team_member(d.team_id, auth.uid()) OR is_superadmin(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "deal_notes_update" ON deal_notes;
CREATE POLICY "deal_notes_update" ON deal_notes
    FOR UPDATE USING (
        -- Users can edit their own notes, admins can edit any
        (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND is_team_admin(d.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS "deal_notes_delete" ON deal_notes;
CREATE POLICY "deal_notes_delete" ON deal_notes
    FOR DELETE USING (
        -- Users can delete their own notes, admins can delete any
        (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM deals d
            WHERE d.id = deal_id
            AND is_team_admin(d.team_id, auth.uid())
        ))
        OR is_superadmin(auth.uid())
    );

-- ============================================================================
-- COMPLETE
-- ============================================================================
