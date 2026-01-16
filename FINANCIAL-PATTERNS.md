# Financial Calculation Patterns

## Overview
Real estate deal profitability involves complex calculations with multiple variables. This guide covers patterns and approaches, not specific formulas (those are in GitHub issues).

---

## Core Principles

### 1. Precision Matters
Use proper decimal handling for money:
- JavaScript: Use libraries like `decimal.js` or `big.js`
- Database: Use DECIMAL/NUMERIC types
- Never use floating point for currency

**Bad:** `0.1 + 0.2 === 0.30000000000000004`
**Good:** `Decimal(0.1).plus(0.2).equals(0.3) // true`

### 2. Calculate Early, Verify Often
- Client-side: Immediate feedback (optimistic)
- Server-side: Source of truth (authoritative)
- Log: Track all financial changes

### 3. Immutable History
Financial data changes over time:
- Track original projections
- Log updates
- Store actual values at closing
- Never delete old calculations

---

## Calculation Layers

### Layer 1: Base Numbers (From User)
Simple fields entered directly:
- Contract price (what we're paying seller)
- Projected sale price (what we expect to sell for)
- Expenses (what we've spent)

**Pattern:** These are inputs, stored directly.

### Layer 2: Derived Values (Calculated)
Computed from base numbers:
- Gross profit (sale - contract - fees)
- Total expenses (sum of expense records)
- Commission totals (based on rules)

**Pattern:** Calculate on-demand, don't store (or cache with invalidation).

### Layer 3: Projections vs Actuals
Two versions of same number:
- **Projected**: What we think will happen
- **Actual**: What really happened (at closing)

**Pattern:** Both coexist, actuals override projections after closing.

---

## Common Calculation Patterns

### Profit Calculation (Simplified)
```javascript
// Step 1: Gross profit
const grossProfit = salePrice - contractPrice - jvFee

// Step 2: Net profit  
const netProfit = grossProfit - totalExpenses - totalCommissions

// Step 3: Profit after commissions (for some reports)
const finalProfit = grossProfit - totalExpenses
```

**Pattern:** Build up from simple to complex, step by step.

### JV (Joint Venture) Fee
Two types:

**Fixed Amount:**
```javascript
const jvFee = fixedAmount // e.g., $5,000
```

**Percentage:**
```javascript
const jvFee = grossProfit * (jvPercentage / 100) // e.g., 20% of $50k = $10k
```

**Pattern:** Type determines calculation method. Store type + value(s).

### Commission Structures
Can vary per employee:

**Fixed Per Deal:**
```javascript
const commission = fixedAmount // e.g., $1,000
```

**Percentage of Profit:**
```javascript
const commission = profit * (percentage / 100) // e.g., 15% of net profit
```

**Tiered (Volume-Based):**
```javascript
const tier = getTierForDealCount(employeeDealsThisMonth)
const commission = profit * (tier.percentage / 100)
```

**Hybrid (Base + Bonus):**
```javascript
const commission = baseAmount + (profit > threshold ? profit * bonusPercent : 0)
```

**Pattern:** Store commission rules as flexible configuration (JSONB), execute at calculation time.

---

## Expense Tracking Patterns

### Categorization
Group expenses by type:
- Marketing (to acquire the deal)
- Inspections
- Title/escrow
- Legal/attorney
- HOA fees
- Other

**Pattern:** Categories help with reporting and tax prep.

### Running Totals
```javascript
const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
```

**Pattern:** Always sum from source records, don't store running total (or invalidate cache on changes).

### Expense Approval
Large expenses may need approval:
```javascript
if (expense.amount > threshold) {
  expense.status = 'pending_approval'
  notifyManager(expense)
}
```

**Pattern:** Workflow for significant expenses.

---

## Real-time Calculation Patterns

### Client-Side (Optimistic)
Calculate immediately for UI responsiveness:

```javascript
// In React component
const financials = useMemo(() => {
  const gross = salePrice - contractPrice - jvFee
  const expenses = expenseList.reduce((sum, e) => sum + e.amount, 0)
  const commissions = calculateCommissions(employees, gross)
  const net = gross - expenses - commissions
  
  return { gross, expenses, commissions, net }
}, [salePrice, contractPrice, jvFee, expenseList, employees])
```

**Pattern:** `useMemo` to recalculate only when dependencies change.

### Server-Side (Authoritative)
Verify calculations on server:

**Option A: Postgres Function**
```sql
CREATE FUNCTION calculate_deal_profit(deal_id UUID)
RETURNS DECIMAL AS $$
  -- Complex SQL calculation
  SELECT (projected_sale_price - contract_price - COALESCE(jv_fee, 0)) 
    - COALESCE((SELECT SUM(amount) FROM expenses WHERE deal_id = $1), 0)
  FROM deals WHERE id = $1
$$ LANGUAGE sql;
```

**Option B: Edge Function**
```typescript
// /functions/calculate-financials.ts
export async function calculateFinancials(dealId: string) {
  const deal = await fetchDeal(dealId)
  const expenses = await fetchExpenses(dealId)
  const employees = await fetchEmployees(dealId)
  
  // Perform calculations
  return {
    grossProfit: calcGross(deal),
    totalExpenses: calcExpenses(expenses),
    commissions: calcCommissions(employees, deal),
    netProfit: calcNet(deal, expenses, employees)
  }
}
```

**Pattern:** Server validates client calculations, catches errors.

---

## Realtime Update Patterns

### Subscribe to Changes
When expenses change, recalculate:

```javascript
useEffect(() => {
  const subscription = supabase
    .channel('expense-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `deal_id=eq.${dealId}`
    }, () => {
      refetchFinancials()
    })
    .subscribe()
  
  return () => supabase.removeChannel(subscription)
}, [dealId])
```

**Pattern:** Realtime sync keeps all users seeing same numbers.

### Optimistic Updates with Rollback
```javascript
async function updateContractPrice(newPrice) {
  // 1. Update UI immediately
  setDeal(prev => ({ ...prev, contract_price: newPrice }))
  
  // 2. Save to database
  const { error } = await supabase
    .from('deals')
    .update({ contract_price: newPrice })
    .eq('id', dealId)
  
  // 3. Rollback on error
  if (error) {
    setDeal(prev => ({ ...prev, contract_price: originalPrice }))
    toast.error('Failed to update')
  }
}
```

**Pattern:** Immediate feedback, graceful error handling.

---

## Display Patterns

### Currency Formatting
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0, // or 2 for cents
    maximumFractionDigits: 0
  }).format(amount)
}

// Usage: $50,000
```

**Pattern:** Consistent formatting across app.

### Profit Indicators
```javascript
const ProfitDisplay = ({ profit }) => {
  const isPositive = profit >= 0
  
  return (
    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
      {isPositive && '+'}{formatCurrency(profit)}
    </span>
  )
}
```

**Pattern:** Visual indicators for positive/negative.

### Breakdown Tables
Show how we got to final number:

```jsx
<Table>
  <TableRow>
    <TableCell>Projected Sale Price</TableCell>
    <TableCell className="text-right">$150,000</TableCell>
  </TableRow>
  <TableRow>
    <TableCell>Contract Price</TableCell>
    <TableCell className="text-right text-red-600">-$100,000</TableCell>
  </TableRow>
  <TableRow>
    <TableCell>JV Fee</TableCell>
    <TableCell className="text-right text-red-600">-$10,000</TableCell>
  </TableRow>
  <TableRow className="border-t-2">
    <TableCell className="font-semibold">Gross Profit</TableCell>
    <TableCell className="text-right font-semibold">$40,000</TableCell>
  </TableRow>
</Table>
```

**Pattern:** Show your work, build trust.

---

## Validation Patterns

### Sanity Checks
Catch obvious errors:

```javascript
// Profit shouldn't be negative (warning, not error)
if (netProfit < 0) {
  showWarning('This deal is currently unprofitable')
}

// Sale price should be higher than contract (usually)
if (salePrice <= contractPrice) {
  showWarning('Sale price is not higher than contract price')
}

// Commissions seem too high
if (totalCommissions > grossProfit * 0.6) {
  showError('Commissions exceed 60% of gross profit')
}
```

**Pattern:** Guide users, prevent mistakes.

### Business Rules
Domain-specific validation (from issues):
- Minimum profit thresholds
- Maximum expense amounts
- Commission caps
- JV split limits

**Pattern:** Enforce business logic at calculation time.

---

## Audit Trail Patterns

### Log Financial Changes
```javascript
async function logFinancialChange(dealId, field, oldValue, newValue) {
  await supabase.from('activities').insert({
    deal_id: dealId,
    user_id: currentUserId,
    action_type: 'financial_update',
    description: `Updated ${field} from ${formatCurrency(oldValue)} to ${formatCurrency(newValue)}`,
    old_value: oldValue.toString(),
    new_value: newValue.toString()
  })
}
```

**Pattern:** Every financial change is logged with before/after.

### Snapshots Over Time
Track how projections evolve:

```javascript
const financialHistory = [
  { date: '2025-01-01', projected_profit: 50000 },
  { date: '2025-01-15', projected_profit: 45000 }, // Renegotiated
  { date: '2025-02-01', actual_profit: 43000 }     // Closed
]
```

**Pattern:** See how expectations changed, learn from variance.

---

## Commission Rule Storage

### Flexible Configuration (JSONB)
Store as JSON in database:

```json
{
  "type": "percentage",
  "percentage": 20,
  "basis": "net_profit"
}
```

```json
{
  "type": "tiered",
  "tiers": [
    { "min": 0, "max": 5, "percentage": 15 },
    { "min": 6, "max": 10, "percentage": 20 },
    { "min": 11, "max": 999, "percentage": 25 }
  ],
  "period": "monthly",
  "basis": "gross_profit"
}
```

**Pattern:** Flexible schema, no code changes for new rule types.

### Execution Engine
```javascript
function calculateCommission(rules, deal, employeeStats) {
  switch (rules.type) {
    case 'fixed':
      return rules.amount
    
    case 'percentage':
      const basis = rules.basis === 'gross_profit' ? deal.grossProfit : deal.netProfit
      return basis * (rules.percentage / 100)
    
    case 'tiered':
      const tier = rules.tiers.find(t => 
        employeeStats.dealsThisMonth >= t.min && 
        employeeStats.dealsThisMonth <= t.max
      )
      const basis = rules.basis === 'gross_profit' ? deal.grossProfit : deal.netProfit
      return basis * (tier.percentage / 100)
    
    case 'hybrid':
      const bonus = deal.netProfit > rules.threshold 
        ? deal.netProfit * (rules.bonus_percentage / 100)
        : 0
      return rules.base + bonus
    
    default:
      return 0
  }
}
```

**Pattern:** Interpret rules at runtime, extensible.

---

## Performance Considerations

### Caching Calculated Fields
Option: Store calculated values with cache invalidation:

```sql
-- Add calculated columns
ALTER TABLE deals ADD COLUMN calculated_net_profit DECIMAL;

-- Trigger to recalculate
CREATE TRIGGER recalc_profit
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_profit();
```

**Pattern:** Trade storage for query speed, keep in sync with triggers.

### Batch Calculations
When calculating many deals:

```javascript
// Instead of N queries
for (const deal of deals) {
  deal.profit = await calculateProfit(deal.id) // ❌ Slow
}

// Batch it
const dealIds = deals.map(d => d.id)
const profits = await calculateProfitsBatch(dealIds) // ✅ Fast
```

**Pattern:** Minimize round trips to database.

---

## Error Handling

### Graceful Degradation
If calculation fails, don't break UI:

```javascript
try {
  const financials = calculateFinancials(deal)
  return <FinancialSummary data={financials} />
} catch (error) {
  console.error('Financial calculation error:', error)
  return <div>Unable to calculate financials. Please check deal data.</div>
}
```

**Pattern:** Show something useful, log the error.

### Validation Feedback
```javascript
if (contractPrice <= 0) {
  return { error: 'Contract price must be positive' }
}

if (!salePrice) {
  return { warning: 'Sale price not set, profit calculations are estimates' }
}
```

**Pattern:** Distinguish between errors (blocking) and warnings (informational).

---

## Testing Approach

### Unit Test Calculations
```javascript
describe('calculateGrossProfit', () => {
  it('calculates correctly with JV fee', () => {
    const result = calculateGrossProfit({
      salePrice: 150000,
      contractPrice: 100000,
      jvFee: 10000
    })
    expect(result).toBe(40000)
  })
  
  it('handles zero JV fee', () => {
    const result = calculateGrossProfit({
      salePrice: 150000,
      contractPrice: 100000,
      jvFee: 0
    })
    expect(result).toBe(50000)
  })
})
```

**Pattern:** Test calculations with various inputs.

### Integration Test with Real Data
Use realistic wholesaling scenarios:
- Typical contract: $100k
- Typical sale: $120k
- Typical expenses: $3-5k
- Expected net: $12-17k

**Pattern:** Validate against real-world expectations.

---

## Common Pitfalls

### ❌ Using Floating Point
```javascript
const profit = 100.10 - 50.05 // 50.05000000000001
```

### ✅ Use Decimal Library
```javascript
const profit = Decimal(100.10).minus(50.05) // 50.05
```

---

### ❌ Forgetting to Update Totals
```javascript
// Added expense but didn't recalculate profit
await addExpense(expense)
// UI still shows old profit ❌
```

### ✅ Trigger Recalculation
```javascript
await addExpense(expense)
refetchFinancials() // ✅
```

---

### ❌ Hardcoding Commission Logic
```javascript
const commission = profit * 0.20 // Can't change per employee
```

### ✅ Configuration-Driven
```javascript
const commission = calculateCommission(employee.commission_rules, deal)
```

---

## Summary

**Key Takeaways:**
1. Use decimal precision for all money calculations
2. Calculate client-side for speed, server-side for accuracy
3. Store flexible rules as JSON configuration
4. Log all financial changes for audit trail
5. Show calculations transparently to users
6. Validate inputs and results
7. Handle errors gracefully

**Specific formulas and business rules are in GitHub issues.**
This guide provides patterns and approaches.
