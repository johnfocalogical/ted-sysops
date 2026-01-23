# Supabase Patterns Guide

## Overview
This guide covers patterns for working with Supabase in this application. Specific schema details are in DATA-SCHEMA.md and GitHub issues.

---

## Client Setup

### Single Client Instance
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true
  }
})
```

**Pattern:** Single instance, imported everywhere.

---

## Authentication Patterns

### Sign Up
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      name: 'John Doe',
      org_id: 'org-uuid' // Set during onboarding
    }
  }
})
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Check Session
```javascript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // Redirect to login
}
```

### Listen for Auth Changes
```javascript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      navigate('/login')
    } else if (event === 'SIGNED_IN') {
      navigate('/deals')
    }
  })
  
  return () => subscription.unsubscribe()
}, [])
```

**Pattern:** React to auth events, handle routing.

---

## Query Patterns

### Basic Fetch
```javascript
const { data, error } = await supabase
  .from('deals')
  .select('*')

if (error) {
  console.error('Error fetching deals:', error)
  return null
}
```

**Pattern:** Always check for errors.

### Filtered Queries
```javascript
const { data, error } = await supabase
  .from('deals')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

**Pattern:** Chain filters, most specific to least specific.

### Joins (Relations)
```javascript
const { data, error } = await supabase
  .from('deals')
  .select(`
    *,
    owner:users!owner_id(id, name, email),
    seller:contacts!seller_contact_id(id, name, phone),
    expenses(id, amount, category)
  `)
  .eq('id', dealId)
  .single()
```

**Pattern:** Use foreign key relationships, specify fields needed.

### Pagination
```javascript
const pageSize = 20
const from = page * pageSize
const to = from + pageSize - 1

const { data, error, count } = await supabase
  .from('deals')
  .select('*', { count: 'exact' })
  .range(from, to)
```

**Pattern:** Range-based pagination, get total count.

### Full-Text Search
```javascript
const { data, error } = await supabase
  .from('deals')
  .select('*')
  .textSearch('address', searchTerm, {
    type: 'websearch',
    config: 'english'
  })
```

**Pattern:** Use Postgres full-text search for address/text fields.

---

## Insert Patterns

### Simple Insert
```javascript
const { data, error } = await supabase
  .from('deals')
  .insert({
    address: '123 Main St',
    city: 'Austin',
    deal_type: 'wholesale',
    status: 'active',
    owner_id: user.id,
    org_id: user.org_id // Always include for RLS
  })
  .select()
  .single()
```

**Pattern:** Include org_id, return the created record.

### Bulk Insert
```javascript
const { data, error } = await supabase
  .from('expenses')
  .insert([
    { deal_id: dealId, amount: 100, category: 'marketing' },
    { deal_id: dealId, amount: 500, category: 'inspection' }
  ])
  .select()
```

**Pattern:** Array of objects for multiple records.

---

## Update Patterns

### Simple Update
```javascript
const { data, error } = await supabase
  .from('deals')
  .update({ status: 'closed', closing_date: new Date() })
  .eq('id', dealId)
  .select()
  .single()
```

**Pattern:** Update, filter, return updated record.

### Conditional Update
```javascript
const { data, error } = await supabase
  .from('deals')
  .update({ status: 'closed' })
  .eq('id', dealId)
  .eq('status', 'pending_sale') // Only if currently pending
  .select()
```

**Pattern:** Use multiple filters to prevent race conditions.

---

## Delete Patterns

### Soft Delete (Preferred)
```javascript
const { error } = await supabase
  .from('deals')
  .update({ deleted_at: new Date() })
  .eq('id', dealId)
```

**Pattern:** Mark as deleted, don't actually delete (preserves audit trail).

### Hard Delete (Rarely)
```javascript
const { error } = await supabase
  .from('deals')
  .delete()
  .eq('id', dealId)
```

**Pattern:** Only for truly removing data (be careful with RLS).

---

## RLS (Row Level Security) Patterns

### Org Isolation Policy
```sql
-- Users can only see data from their org
CREATE POLICY org_isolation ON deals
  FOR ALL
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Pattern:** Every table has org_id, every policy checks it.

### Role-Based Access
```sql
-- Deal owner and TC have full access
CREATE POLICY owner_access ON deals
  FOR ALL
  USING (
    owner_id = auth.uid() 
    OR transaction_coordinator_id = auth.uid()
  );
```

**Pattern:** Multiple conditions with OR.

### Read-Only for Certain Users
```sql
-- Team members can view, not edit
CREATE POLICY team_read ON deals
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );
```

**Pattern:** Separate SELECT policy from UPDATE/DELETE.

---

## Realtime Patterns

### Subscribe to Changes
```javascript
useEffect(() => {
  const channel = supabase
    .channel('deal-changes')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'deals',
      filter: `id=eq.${dealId}` // Optional filter
    }, (payload) => {
      console.log('Change received!', payload)
      // Update local state
      setDeal(payload.new)
    })
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [dealId])
```

**Pattern:** Subscribe in useEffect, cleanup on unmount.

### Multiple Table Subscriptions
```javascript
const channel = supabase.channel('deal-updates')

channel
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'deals',
    filter: `id=eq.${dealId}`
  }, handleDealUpdate)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'expenses',
    filter: `deal_id=eq.${dealId}`
  }, handleExpenseChange)
  .subscribe()
```

**Pattern:** Multiple listeners on same channel.

### Broadcast Messages
```javascript
// Send
channel.send({
  type: 'broadcast',
  event: 'user-typing',
  payload: { userId: user.id }
})

// Receive
channel.on('broadcast', { event: 'user-typing' }, (payload) => {
  console.log('User typing:', payload.userId)
})
```

**Pattern:** For UI states, not data changes.

---

## Storage Patterns

### Upload File
```javascript
const uploadFile = async (file, dealId) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${dealId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('deal-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('deal-documents')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

**Pattern:** Organize by deal ID, generate unique names, return URL.

### Download File
```javascript
const { data, error } = await supabase.storage
  .from('deal-documents')
  .download(filePath)

// Create download link
const url = URL.createObjectURL(data)
const a = document.createElement('a')
a.href = url
a.download = 'document.pdf'
a.click()
```

### Delete File
```javascript
const { error } = await supabase.storage
  .from('deal-documents')
  .remove([filePath])
```

---

## Edge Functions Patterns

### Call from Client
```javascript
const { data, error } = await supabase.functions.invoke('calculate-financials', {
  body: { dealId: 'uuid' }
})

if (error) {
  console.error('Function error:', error)
}
```

**Pattern:** Use for complex server-side logic.

### Edge Function Structure
```typescript
// /functions/calculate-financials/index.ts
import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  try {
    const { dealId } = await req.json()
    
    // Create admin client (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Fetch data
    const { data: deal } = await supabase
      .from('deals')
      .select('*, expenses(*)')
      .eq('id', dealId)
      .single()
    
    // Perform complex calculations
    const financials = calculateFinancials(deal)
    
    return new Response(JSON.stringify(financials), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

**Pattern:** Service role key for admin access, proper error handling.

---

## Error Handling Patterns

### Try-Catch Wrapper
```javascript
async function fetchDeal(dealId) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Failed to fetch deal:', error)
    toast.error('Unable to load deal')
    return null
  }
}
```

**Pattern:** Catch errors, log them, show user feedback.

### Retry Logic
```javascript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Usage
const deal = await fetchWithRetry(() => fetchDeal(dealId))
```

**Pattern:** Exponential backoff for transient errors.

---

## Performance Patterns

### Select Only Needed Fields
```javascript
// ❌ Don't fetch everything
const { data } = await supabase.from('deals').select('*')

// ✅ Select specific fields
const { data } = await supabase
  .from('deals')
  .select('id, address, status, contract_price')
```

**Pattern:** Minimize data transfer.

### Index Common Queries
```sql
-- Index for filtering by status
CREATE INDEX idx_deals_status ON deals(status);

-- Composite index for org + status
CREATE INDEX idx_deals_org_status ON deals(org_id, status);

-- Full-text search index
CREATE INDEX idx_deals_address_fts ON deals USING GIN(to_tsvector('english', address));
```

**Pattern:** Index filters and joins.

### Use Postgres Functions for Complex Queries
```sql
CREATE FUNCTION get_deal_summary(p_deal_id UUID)
RETURNS TABLE (
  deal_id UUID,
  address TEXT,
  gross_profit DECIMAL,
  total_expenses DECIMAL,
  net_profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.address,
    (d.projected_sale_price - d.contract_price) AS gross_profit,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    (d.projected_sale_price - d.contract_price - COALESCE(SUM(e.amount), 0)) AS net_profit
  FROM deals d
  LEFT JOIN expenses e ON e.deal_id = d.id
  WHERE d.id = p_deal_id
  GROUP BY d.id;
END;
$$ LANGUAGE plpgsql;
```

**Pattern:** Complex logic in database, not client.

---

## Testing Patterns

### Mock Supabase in Tests
```javascript
// __mocks__/supabase.js
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockDeal, error: null }))
      }))
    }))
  }))
}
```

### Integration Tests with Test Database
```javascript
// Use separate test project
const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL,
  process.env.TEST_SUPABASE_KEY
)

beforeEach(async () => {
  // Clear test data
  await testSupabase.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
})
```

---

## Common Pitfalls

### ❌ Forgetting org_id
```javascript
// Fails due to RLS
await supabase.from('deals').insert({ address: '123 Main' })
```

### ✅ Always Include org_id
```javascript
await supabase.from('deals').insert({ 
  address: '123 Main',
  org_id: user.org_id
})
```

---

### ❌ Not Checking Errors
```javascript
const { data } = await supabase.from('deals').select('*')
// data might be null if error occurred
```

### ✅ Check and Handle Errors
```javascript
const { data, error } = await supabase.from('deals').select('*')
if (error) {
  console.error(error)
  return
}
```

---

### ❌ Memory Leaks with Subscriptions
```javascript
useEffect(() => {
  supabase.channel('updates').subscribe()
  // Never cleaned up! ❌
}, [])
```

### ✅ Cleanup Subscriptions
```javascript
useEffect(() => {
  const channel = supabase.channel('updates').subscribe()
  return () => supabase.removeChannel(channel) // ✅
}, [])
```

---

## Summary

**Key Takeaways:**
1. Always include `org_id` for multi-tenancy
2. Check for errors on every query
3. Use RLS policies for security
4. Subscribe to realtime for collaboration
5. Cleanup subscriptions to prevent leaks
6. Select only needed fields for performance
7. Use Edge Functions for complex server logic

**Specific schema and table structures are in DATA-SCHEMA.md and GitHub issues.**
