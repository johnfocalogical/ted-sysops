# Data Schema Overview

## Purpose
High-level overview of data model and relationships. Specific field names, types, and constraints are in GitHub issues.

---

## Multi-Tenancy Architecture

### Organization Isolation
Every table (except organizations and users) has `org_id`:
```
organizations (root)
  └── users (employees)
  └── deals (all org data)
  └── contacts
  └── automators
  └── etc.
```

**Pattern:** All queries filtered by org_id via RLS policies.

---

## Primary Entities

### Deals (Central Hub)
The core entity everything connects to:
- Basic info (address, type, status)
- Dates (contract, closing, due diligence)
- Prices (contract, projected sale, listing)
- Relationships (owner, coordinator, seller, buyer)

**Pattern:** One deal = one property transaction.

### Contacts (Multi-Purpose)
Unified contact management:
- Type: Seller, Buyer, Vendor
- Role (for vendors): Title company, inspector, attorney, runner, realtor
- Standard contact info

**Pattern:** One contact table for all people/companies.

### Users (Employees)
Internal team members:
- Login credentials (via Supabase Auth)
- Role (admin, TC, deal manager, viewer)
- Commission rules (JSONB configuration)
- Org membership

**Pattern:** Users work on deals, have permissions.

---

## Deal Sub-Entities

### Contract Facts
Contract-specific details:
- Dates (contract, due diligence, closing)
- Prices (original, actual)
- Deposit info
- Custom fields (JSONB)

**Pattern:** Related to contract terms.

### Property Facts
Property-specific details:
- Physical attributes
- Legal description
- Mortgage info
- Foreclosure status
- Custom fields (JSONB)

**Pattern:** About the property itself.

### Deal Facts
Transaction details:
- Lead source
- Title status
- Reason for selling
- Purchase type (cash, financing, etc.)

**Pattern:** Context around the deal.

### Disposition Info
For selling the deal:
- Projected sale prices (original, updated)
- JV deal details (partner, type, fee)
- Buyer information

**Pattern:** How we plan to exit the deal.

---

## Workflow Entities

### Automators (Process Definitions)
Templates for guided workflows:
- Name and description
- Steps (stored as JSON)
- Branching logic
- Side effects (what gets updated)

**Pattern:** Reusable process templates.

### Process Instances
Execution of automators on specific deals:
- Current step position
- User responses (stored as JSON)
- Status (running, completed, canceled)
- Started by, timestamps

**Pattern:** Track state of running processes.

### Checklist Items
Deal-specific todo list:
- Item name
- Checked status
- Auto-populated date (from automators)
- Link to process that populated it

**Pattern:** Visual progress tracking.

---

## Financial Entities

### Expenses
Costs incurred per deal:
- Description and category
- Amount and date
- Notes
- Link to deal

**Pattern:** Track all deal costs for profit calculation.

---

## Collaboration Entities

### Activities (Audit Log)
Complete history of changes:
- User who made change
- Action type
- Description
- Old/new values (for field changes)
- Timestamp

**Pattern:** Immutable audit trail.

### Comments
Team discussion:
- Text content
- User who commented
- Tagged users (for notifications)
- Link to deal

**Pattern:** Threaded conversation.

### Notes
Personal/team notes:
- Text content
- User who created
- Link to deal

**Pattern:** Free-form documentation.

---

## Junction Tables (Many-to-Many)

### Deal-Employee Relationships
Track who worked on which deals:
- Deal + Employee
- Role on the deal
- Used for commission calculations

**Pattern:** Credit team members for contributions.

### Deal-Vendor Relationships
External service providers:
- Deal + Vendor (Contact)
- Role (title company, inspector, etc.)
- Used for credit and tracking

**Pattern:** Track vendors per deal.

---

## Supporting Entities

### Showings
Property showing schedules:
- Date and time
- Buyer contact
- Vendor (if applicable)
- Buffer time
- Link to deal

**Pattern:** Coordinate property visits.

### Organizations
Root entity for multi-tenancy:
- Name
- Settings (JSONB for customization)

**Pattern:** Isolate customer data.

---

## Relationship Patterns

### One-to-Many
```
Deal → Expenses (one deal, many expenses)
Deal → Activities (one deal, many log entries)
Deal → Checklist Items (one deal, many tasks)
User → Deals as Owner (one user owns many deals)
```

### Many-to-One
```
Deals → User as Owner (many deals, one owner)
Deals → Contact as Seller (many deals, one seller contact)
Deals → Organization (many deals, one org)
```

### Many-to-Many (via Junction)
```
Deals ←→ Users (via deal_employees)
Deals ←→ Contacts as Vendors (via deal_vendors)
```

### One-to-One (Conceptual)
```
Deal → Contract Facts (1:1 relationship)
Deal → Property Facts (1:1 relationship)
Deal → Disposition Info (1:1 relationship)
```

**Pattern:** These could be in deals table, but separated for organization.

---

## Data Types & Storage

### Standard Types
- UUIDs for IDs
- TEXT for strings
- DECIMAL for money
- DATE for dates
- TIMESTAMP for created_at/updated_at
- BOOLEAN for flags

### Flexible Storage (JSONB)
Used for:
- Commission rules (varies per employee)
- Custom fields (configurable per org)
- Automator step definitions
- Process instance responses

**Pattern:** JSONB when structure varies or is user-defined.

### Arrays
Used for:
- Tagged users in comments
- File paths in storage

---

## Timestamps Pattern

Every table has:
```sql
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

With trigger:
```sql
CREATE TRIGGER update_updated_at
  BEFORE UPDATE ON [table]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Pattern:** Track when records created/modified.

---

## Soft Delete Pattern

Instead of DELETE:
```sql
deleted_at TIMESTAMPTZ NULL
```

Queries filter:
```sql
WHERE deleted_at IS NULL
```

**Pattern:** Preserve data, enable recovery.

---

## RLS (Row Level Security)

### Org Isolation Policy
Applied to all tables:
```sql
CREATE POLICY org_isolation ON [table]
  FOR ALL
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Owner/Coordinator Access
For deals specifically:
```sql
CREATE POLICY owner_access ON deals
  FOR ALL
  USING (
    owner_id = auth.uid() 
    OR transaction_coordinator_id = auth.uid()
  );
```

**Pattern:** Security at database level.

---

## Indexes Strategy

### Primary Keys
Every table has UUID primary key:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

### Foreign Keys
With indexes for joins:
```sql
CREATE INDEX idx_deals_owner_id ON deals(owner_id);
CREATE INDEX idx_deals_seller_contact_id ON deals(seller_contact_id);
```

### Composite Indexes
For common query patterns:
```sql
CREATE INDEX idx_deals_org_status ON deals(org_id, status);
CREATE INDEX idx_deals_org_owner ON deals(org_id, owner_id);
```

### JSONB Indexes (GIN)
For flexible fields:
```sql
CREATE INDEX idx_automators_steps ON automators USING GIN(steps);
CREATE INDEX idx_users_commission_rules ON users USING GIN(commission_rules);
```

### Full-Text Search
For text fields:
```sql
CREATE INDEX idx_deals_address_fts ON deals 
  USING GIN(to_tsvector('english', address));
```

**Pattern:** Index what you query frequently.

---

## Calculated vs Stored

### Calculated Fields (Don't Store)
Computed on-demand:
- Gross profit (sale - contract - jv)
- Total expenses (sum of expense records)
- Net profit (gross - expenses - commissions)

**Pattern:** Calculate fresh, avoid stale data.

### Stored Fields (Do Store)
User-entered values:
- Contract price
- Projected sale price
- Individual expense amounts

**Pattern:** Store inputs, calculate outputs.

### Exception: Cached Calculations
For performance, may cache with invalidation:
```sql
-- Add calculated column
ALTER TABLE deals ADD COLUMN cached_net_profit DECIMAL;

-- Trigger to recalculate
CREATE TRIGGER recalc_profit
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_cached_fields();
```

**Pattern:** Only if performance requires it.

---

## Data Integrity

### Foreign Key Constraints
Enforce relationships:
```sql
FOREIGN KEY (owner_id) REFERENCES users(id)
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
```

### Check Constraints
Enforce business rules:
```sql
CHECK (contract_price > 0)
CHECK (status IN ('active', 'closed', 'canceled', ...))
```

### NOT NULL Constraints
Required fields:
```sql
address TEXT NOT NULL
deal_type TEXT NOT NULL
org_id UUID NOT NULL
```

**Pattern:** Database enforces data quality.

---

## Migration Strategy

### Sequential Migrations
```
001_create_organizations.sql
002_create_users.sql
003_create_contacts.sql
004_create_deals.sql
005_create_deal_facts.sql
...
```

**Pattern:** Build from foundation up, one feature at a time.

### Rollback Strategy
Every migration has down script:
```sql
-- Up
CREATE TABLE deals (...);

-- Down
DROP TABLE deals;
```

**Pattern:** Be able to undo changes.

---

## Common Query Patterns

### Fetch Deal with Relations
```sql
SELECT 
  d.*,
  o.name as owner_name,
  s.name as seller_name,
  (SELECT SUM(amount) FROM expenses WHERE deal_id = d.id) as total_expenses
FROM deals d
LEFT JOIN users o ON o.id = d.owner_id
LEFT JOIN contacts s ON s.id = d.seller_contact_id
WHERE d.org_id = $1;
```

### Deal Financial Summary
```sql
SELECT 
  d.id,
  d.address,
  (d.projected_sale_price - d.contract_price - COALESCE(di.jv_fee, 0)) as gross_profit,
  COALESCE(SUM(e.amount), 0) as total_expenses
FROM deals d
LEFT JOIN disposition_info di ON di.deal_id = d.id
LEFT JOIN expenses e ON e.deal_id = d.id
WHERE d.id = $1
GROUP BY d.id, di.jv_fee;
```

### Active Deals for User
```sql
SELECT * FROM deals
WHERE org_id = $1
  AND status IN ('active', 'pending_sale')
  AND (owner_id = $2 OR transaction_coordinator_id = $2)
ORDER BY created_at DESC;
```

---

## Performance Considerations

### N+1 Query Problem
❌ **Bad:**
```javascript
for (deal of deals) {
  deal.expenses = await fetchExpenses(deal.id)
}
```

✅ **Good:**
```javascript
const dealIds = deals.map(d => d.id)
const allExpenses = await fetchExpensesBatch(dealIds)
```

### Eager Loading
Load related data in one query:
```sql
SELECT 
  d.*,
  json_agg(e.*) as expenses
FROM deals d
LEFT JOIN expenses e ON e.deal_id = d.id
GROUP BY d.id;
```

---

## Summary

**Key Patterns:**
1. Multi-tenancy via org_id on every table
2. Deals are central hub, everything connects to them
3. Flexible data in JSONB (commission rules, custom fields)
4. Audit trail via activities table (immutable)
5. RLS for security at database level
6. Indexes on foreign keys and common filters
7. Calculated fields computed on-demand
8. Junction tables for many-to-many
9. Timestamps on every table
10. UUID primary keys everywhere

**Specific schema details (field names, types, constraints) are in GitHub issues.**
This overview provides the conceptual data model and patterns.
