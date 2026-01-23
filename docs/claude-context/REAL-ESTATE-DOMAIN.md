# Real Estate Investment Domain Knowledge

## Purpose
This guide helps you understand the real estate investment/wholesaling domain so you can make informed decisions when building features. Specific business rules for each feature will be in GitHub issues.

---

## Business Context

### Who Uses This App?
- **Real estate investors** - Buy properties to flip or hold
- **Wholesalers** - Get properties under contract and assign to end buyers
- **Transaction coordinators** - Manage deal logistics and deadlines
- **Investment teams** - Work collaboratively on deals

### Key Difference from Traditional Real Estate
This is **NOT** for traditional agents/MLS. It's for:
- Buying undervalued properties
- Off-market deals
- Creative financing
- Quick turnarounds (30-90 days)
- Focus on profit margins

---

## Deal Types (High-Level)

### Wholesale
- Get property under contract from seller
- Find end buyer willing to pay more
- Assign the contract (never take title)
- Make money on the "spread" (assignment fee)
- Typical timeline: 30-45 days

### Listing
- Put property on market for sale
- May be MLS or off-market
- Often after rehab/improvements
- Make money on sale price minus costs

### Novation  
- Facilitate transaction between seller and buyer
- More control than assignment
- Can adjust terms

### Purchase
- Actually buy and take title
- Plans to hold, rehab, or flip

**Pattern:** Different deal types have different data requirements and workflows.

---

## Deal Lifecycle Statuses

Think of status as "where is this deal right now?":
- **Active** - Under contract, actively working it
- **For Sale** - Listed and available for buyers
- **Pending Sale** - Buyer is under contract
- **Closed** - Deal is done
- **Funded** - Money has been distributed
- **On Hold** - Temporarily paused
- **Canceled** - Fell through

**Pattern:** Status drives which actions are available and what data is required.

---

## Key Concepts & Terminology

### Lead Sources
Where deals come from: direct mail, PPC ads, referrals, cold calling, driving for dollars.
**Why it matters:** Track ROI per marketing channel.

### Due Diligence Period
Time to inspect property and back out if needed (typically 7-30 days).
**Why it matters:** Critical deadline that can be extended, affects timeline.

### Title Work
Process of verifying clean ownership:
- Title Ordered → Title Company Working → Title Ready → Can Close
- POA (Power of Attorney) may be needed for absent parties

**Why it matters:** Can't close without clear title.

### Assignment Fee
The profit on wholesale deals. Contract for $100k, sell for $110k = $10k assignment fee.

### JV (Joint Venture) Deals
Partnering with another investor:
- **Fixed JV**: Partner gets fixed dollar amount
- **Percentage JV**: Partner gets % of profit

**Why it matters:** Affects profit calculations significantly.

---

## Common Workflows

### Typical Wholesale Flow
1. **Lead comes in** → Create deal
2. **Initial contact** → Qualify seller
3. **Property visit** → Assess condition
4. **Negotiate contract** → Get it signed
5. **Due diligence** → Inspect, title work
6. **Find buyer** → Market the deal
7. **Assign contract** → Paperwork to transfer
8. **Close** → Buyer pays, seller gets paid
9. **Get paid** → Receive assignment fee

**Pattern:** Each step can trigger automators (guided workflows).

### Transaction Coordinator Role
The "project manager" of deals:
- Ensures deadlines are met
- Coordinates vendors (inspectors, title company)
- Updates checklists
- Runs processes/automators
- Keeps team informed

---

## Financial Concepts

### Profit Calculation (Simplified)
```
Gross Profit = Sale Price - Contract Price - JV Fee
Net Profit = Gross Profit - Expenses - Commissions
```

### Expenses to Track
Common categories:
- Marketing costs (finding the deal)
- Inspections
- Title work
- Attorney/legal fees
- HOA fees
- Earnest money deposit
- Other deal-specific costs

### Commission Structures
Employees can be paid in different ways:
- Fixed amount per deal
- Percentage of profit
- Tiered (more deals = higher %)
- Hybrid (base + bonus)

**Pattern:** Commission rules are flexible and stored as configuration, not hard-coded.

---

## Vendor Management

### Who are Vendors?
External service providers:
- **Title Companies** - Handle closing
- **Inspectors** - Check property condition
- **Attorneys** - Legal review (in some states)
- **Runners** - Drive contracts, take photos, meet sellers
- **Realtors** - Sometimes involved in acquisitions

**Pattern:** Track vendor relationships per deal for credit/accountability.

---

## Data Validation Patterns

### Address Data
- Must be complete and valid
- Used for property identification
- City/state helps with market tracking

### Financial Data
- Always positive numbers
- Reasonable ranges (catch typos)
- Dates must be logical (closing after contract)

### Required vs Optional
- **Always required**: Address, deal type, status, owner
- **Often optional**: Secondary contacts, custom fields, detailed property facts
- **Contextual**: Based on deal type and status

---

## Business Rules to Keep in Mind

### Multi-tenancy
Each organization is isolated:
- Can't see other orgs' data
- Can configure their own options
- Custom fields per org

### Audit Trail
Everything is logged:
- Who changed what and when
- Immutable history (can't delete)
- Required for accountability and compliance

### Permissions
Role-based:
- Deal owner has full control
- Transaction coordinator can edit
- Team members have limited access
- Vendors may have read-only access

---

## Common Scenarios

### Renegotiation
Prices change during deal:
- Inspection finds issues → Price reduction
- Market shifts → Adjust expectations
- Multiple rounds possible

**Pattern:** Track original vs current prices, log all changes.

### Extensions
Deadlines get pushed:
- Closing extension (need more time)
- Due diligence extension (more inspection time)

**Pattern:** Update dates, mark in checklist, notify team.

### Deal On Hold
Sometimes deals pause:
- Waiting on financing
- Title issues to resolve
- Market conditions

**Pattern:** Change status, document reason, continue later.

---

## Integration Points

### CRM Systems
Leads often come from external CRMs:
- REI Sift, Podio, Zapier integrations
- Map CRM fields to deal fields
- Automated deal creation from leads

### Email/SMS
Communication is critical:
- Email sellers/buyers
- Text for quick updates
- Track communication history

### Document Storage
Lots of paperwork:
- Contracts
- Inspection reports
- Photos
- Title documents

---

## Things That Make This Domain Unique

### Speed Matters
- Wholesale deals move FAST (30-45 days typical)
- Miss a deadline = lose the deal
- Automators help maintain pace

### Profit Margins Are Everything
- Track to the dollar
- Every expense matters
- Commission structures are complex

### Highly Customizable
- Every investor works differently
- Custom fields are essential
- Configurable workflows

### Collaboration Intensive
- Multiple people per deal
- External vendors involved
- Need visibility into what everyone's doing

---

## When Building Features, Consider:

1. **What deal type(s) does this apply to?**
   - Wholesale only? All types?

2. **What status(es) make sense?**
   - Can only happen when Active?

3. **Who needs access?**
   - Owner only? TC? Whole team?

4. **What triggers this?**
   - Manual action? Status change? Date?

5. **What downstream effects?**
   - Update financials? Change status? Log activity?

6. **Is this configurable?**
   - Should orgs customize this?

---

## Resources for Clarification

- **GitHub Issue** - Has specific requirements for the feature
- **Automator Patterns** - How processes/workflows work
- **Financial Patterns** - How to calculate profits/commissions
- **Supabase Patterns** - How to structure data and queries

---

**Remember:** This guide provides context and concepts. GitHub issues provide specific requirements and rules for each feature.
