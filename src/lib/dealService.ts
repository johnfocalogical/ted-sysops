import { supabase } from './supabase'
import { broadcastDealEvent } from './commsEventBroadcaster'
import type {
  Deal,
  DealStatus,
  DealWithDetails,
  DealListItem,
  CreateDealDTO,
  UpdateDealDTO,
  DealContractFacts,
  UpsertDealContractFactsDTO,
  DealPropertyFacts,
  UpsertDealPropertyFactsDTO,
  DealFacts,
  UpsertDealFactsDTO,
  DealDisposition,
  UpsertDealDispositionDTO,
  DealExpense,
  CreateDealExpenseDTO,
  UpdateDealExpenseDTO,
  DealShowing,
  DealShowingWithContacts,
  CreateDealShowingDTO,
  UpdateDealShowingDTO,
  DealChecklistItem,
  CreateDealChecklistItemDTO,
  UpdateDealChecklistItemDTO,
  DealComment,
  DealCommentWithUser,
  CreateDealCommentDTO,
  DealNote,
  DealNoteWithUser,
  CreateDealNoteDTO,
  DealEmployee,
  DealEmployeeWithUser,
  CreateDealEmployeeDTO,
  UpdateDealEmployeeDTO,
  DealVendor,
  DealVendorWithDetails,
  CreateDealVendorDTO,
  UpdateDealVendorDTO,
} from '@/types/deal.types'

// ============================================================================
// Types
// ============================================================================

export interface DealsParams {
  teamId: string
  page: number
  pageSize: number
  search?: string
  status?: DealStatus | DealStatus[]
  ownerId?: string
}

export interface PaginatedDeals {
  data: DealListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// Deal Metrics (for Whiteboard metric cards)
// ============================================================================

export interface DealStatusMetric {
  status: DealStatus
  count: number
  totalEstimatedProfit: number
}

/**
 * Get deal counts and estimated profit aggregated by status.
 * Fetches deals with disposition data and aggregates client-side.
 */
export async function getDealMetrics(teamId: string): Promise<DealStatusMetric[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('deals')
    .select(`
      status,
      contract_price,
      disposition:deal_disposition (
        original_projected_sale_price,
        updated_projected_sale_price,
        actual_sale_price,
        assignment_fee
      )
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (error) throw error

  const allStatuses: DealStatus[] = [
    'active',
    'for_sale',
    'pending_sale',
    'closed',
    'funded',
    'on_hold',
    'canceled',
  ]

  // Build a map of status -> { count, totalProfit }
  const metricsMap = new Map<DealStatus, { count: number; totalEstimatedProfit: number }>()
  for (const s of allStatuses) {
    metricsMap.set(s, { count: 0, totalEstimatedProfit: 0 })
  }

  for (const deal of data || []) {
    const entry = metricsMap.get(deal.status as DealStatus)
    if (!entry) continue
    entry.count++

    // Estimated gross profit = best sale price - contract price
    const disp = deal.disposition as unknown as {
      actual_sale_price: number | null
      updated_projected_sale_price: number | null
      original_projected_sale_price: number | null
      assignment_fee: number | null
    } | null
    const salePrice =
      disp?.actual_sale_price ??
      disp?.updated_projected_sale_price ??
      disp?.original_projected_sale_price ??
      0
    const contractPrice = (deal.contract_price as number) ?? 0
    const assignmentFee = disp?.assignment_fee ?? 0

    // For wholesale deals, profit is the assignment fee if set; otherwise spread
    const estimatedProfit = assignmentFee > 0 ? assignmentFee : salePrice - contractPrice
    entry.totalEstimatedProfit += estimatedProfit
  }

  return allStatuses.map((status) => ({
    status,
    ...metricsMap.get(status)!,
  }))
}

// ============================================================================
// Deal CRUD
// ============================================================================

/**
 * Get deals with pagination, search, and filtering
 */
export async function getDeals(params: DealsParams): Promise<PaginatedDeals> {
  if (!supabase) throw new Error('Supabase not configured')

  const { teamId, page, pageSize, search, status, ownerId } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('deals')
    .select(
      `
      *,
      owner:users!deals_owner_id_fkey (id, full_name, email),
      seller_contact:contacts!deals_seller_contact_id_fkey (id, first_name, last_name)
    `,
      { count: 'exact' }
    )
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (search) {
    query = query.or(
      `address.ilike.%${search}%,city.ilike.%${search}%`
    )
  }

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  }

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const listItems: DealListItem[] = (data || []).map((deal) => ({
    ...deal,
    owner: deal.owner,
    seller_contact: deal.seller_contact || null,
  }))

  const total = count || 0

  return {
    data: listItems,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get a single deal with full details including all fact tables
 */
export async function getDealById(dealId: string): Promise<DealWithDetails | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('deals')
    .select(
      `
      *,
      owner:users!deals_owner_id_fkey (id, full_name, email, avatar_url),
      transaction_coordinator:users!deals_transaction_coordinator_id_fkey (id, full_name, email, avatar_url),
      seller_contact:contacts!deals_seller_contact_id_fkey (id, first_name, last_name),
      buyer_contact:contacts!deals_buyer_contact_id_fkey (id, first_name, last_name),
      contract_facts:deal_contract_facts (*),
      property_facts:deal_property_facts (*),
      deal_facts (*),
      disposition:deal_disposition (*)
    `
    )
    .eq('id', dealId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    ...data,
    owner: data.owner,
    transaction_coordinator: data.transaction_coordinator || null,
    seller_contact: data.seller_contact || null,
    buyer_contact: data.buyer_contact || null,
    contract_facts: data.contract_facts || null,
    property_facts: data.property_facts || null,
    deal_facts: data.deal_facts || null,
    disposition: data.disposition || null,
  }
}

/**
 * Create a new deal with initialized fact rows
 */
export async function createDeal(dto: CreateDealDTO, userId: string): Promise<Deal> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      team_id: dto.team_id,
      address: dto.address,
      city: dto.city || null,
      state: dto.state || null,
      zip: dto.zip || null,
      county: dto.county || null,
      deal_type: dto.deal_type,
      status: dto.status || 'active',
      owner_id: dto.owner_id,
      transaction_coordinator_id: dto.transaction_coordinator_id || null,
      seller_contact_id: dto.seller_contact_id || null,
      buyer_contact_id: dto.buyer_contact_id || null,
      contract_date: dto.contract_date || null,
      closing_date: dto.closing_date || null,
      contract_price: dto.contract_price || null,
      custom_fields: dto.custom_fields || {},
      notes: dto.notes || null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // Initialize fact rows — seed contract facts with values from the deal
  const contractFactsSeed: Record<string, unknown> = { deal_id: deal.id }
  if (dto.contract_price) {
    contractFactsSeed.actual_contract_price = dto.contract_price
    contractFactsSeed.original_contract_price = dto.contract_price
  }
  if (dto.contract_date) {
    contractFactsSeed.contract_date = dto.contract_date
  }
  if (dto.closing_date) {
    contractFactsSeed.original_closing_date = dto.closing_date
  }

  await Promise.all([
    supabase.from('deal_contract_facts').insert(contractFactsSeed),
    supabase.from('deal_property_facts').insert({ deal_id: deal.id }),
    supabase.from('deal_facts').insert({ deal_id: deal.id }),
    supabase.from('deal_disposition').insert({ deal_id: deal.id }),
  ])

  return deal
}

/**
 * Update an existing deal
 */
export async function updateDeal(dealId: string, dto: UpdateDealDTO): Promise<Deal> {
  if (!supabase) throw new Error('Supabase not configured')

  // Capture old status before update for broadcast comparison
  let oldStatus: string | undefined
  if (dto.status) {
    const { data: existing } = await supabase
      .from('deals')
      .select('status')
      .eq('id', dealId)
      .single()
    oldStatus = existing?.status
  }

  const { data, error } = await supabase
    .from('deals')
    .update(dto)
    .eq('id', dealId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  // Broadcast status change
  if (dto.status && dto.status !== oldStatus) {
    broadcastDealEvent(dealId, data.team_id, 'status_change', {
      oldStatus,
      newStatus: dto.status,
    })
  }

  return data
}

/**
 * Soft-delete a deal
 */
export async function deleteDeal(dealId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('deals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dealId)

  if (error) throw error
}

// ============================================================================
// Fact Tables (1:1 Upserts)
// ============================================================================

export async function getDealContractFacts(dealId: string): Promise<DealContractFacts | null> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_contract_facts')
    .select('*')
    .eq('deal_id', dealId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function upsertDealContractFacts(dto: UpsertDealContractFactsDTO): Promise<DealContractFacts> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_contract_facts')
    .upsert(dto, { onConflict: 'deal_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDealPropertyFacts(dealId: string): Promise<DealPropertyFacts | null> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_property_facts')
    .select('*')
    .eq('deal_id', dealId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function upsertDealPropertyFacts(dto: UpsertDealPropertyFactsDTO): Promise<DealPropertyFacts> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_property_facts')
    .upsert(dto, { onConflict: 'deal_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDealFacts(dealId: string): Promise<DealFacts | null> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_facts')
    .select('*')
    .eq('deal_id', dealId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function upsertDealFacts(dto: UpsertDealFactsDTO): Promise<DealFacts> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_facts')
    .upsert(dto, { onConflict: 'deal_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getDealDisposition(dealId: string): Promise<DealDisposition | null> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_disposition')
    .select('*')
    .eq('deal_id', dealId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function upsertDealDisposition(dto: UpsertDealDispositionDTO): Promise<DealDisposition> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_disposition')
    .upsert(dto, { onConflict: 'deal_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================================================
// Deal Expenses
// ============================================================================

export async function getDealExpenses(dealId: string): Promise<DealExpense[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_expenses')
    .select('*')
    .eq('deal_id', dealId)
    .order('expense_date', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function createDealExpense(dto: CreateDealExpenseDTO, userId: string): Promise<DealExpense> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_expenses')
    .insert({ ...dto, created_by: userId })
    .select()
    .single()
  if (error) throw error

  // Broadcast financial event
  broadcastDealEvent(dto.deal_id, null, 'financial_event', {
    expenseCategory: dto.category,
    expenseAmount: dto.amount,
  })

  return data
}

export async function updateDealExpense(expenseId: string, dto: UpdateDealExpenseDTO): Promise<DealExpense> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_expenses')
    .update(dto)
    .eq('id', expenseId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDealExpense(expenseId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('deal_expenses').delete().eq('id', expenseId)
  if (error) throw error
}

// ============================================================================
// Deal Showings
// ============================================================================

export async function getDealShowings(dealId: string): Promise<DealShowingWithContacts[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_showings')
    .select(`
      *,
      buyer_contact:contacts!deal_showings_buyer_contact_id_fkey (id, first_name, last_name),
      vendor_contact:contacts!deal_showings_vendor_contact_id_fkey (id, first_name, last_name)
    `)
    .eq('deal_id', dealId)
    .order('showing_datetime', { ascending: true })
  if (error) throw error
  return (data || []) as DealShowingWithContacts[]
}

export async function createDealShowing(dto: CreateDealShowingDTO, userId: string): Promise<DealShowing> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_showings')
    .insert({ ...dto, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDealShowing(showingId: string, dto: UpdateDealShowingDTO): Promise<DealShowing> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_showings')
    .update(dto)
    .eq('id', showingId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDealShowing(showingId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('deal_showings').delete().eq('id', showingId)
  if (error) throw error
}

// ============================================================================
// Deal Checklist Items
// ============================================================================

export async function getDealChecklistItems(dealId: string): Promise<DealChecklistItem[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_checklist_items')
    .select('*')
    .eq('deal_id', dealId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createDealChecklistItem(dto: CreateDealChecklistItemDTO): Promise<DealChecklistItem> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_checklist_items')
    .insert(dto)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDealChecklistItem(itemId: string, dto: UpdateDealChecklistItemDTO): Promise<DealChecklistItem> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_checklist_items')
    .update(dto)
    .eq('id', itemId)
    .select()
    .single()
  if (error) throw error

  // Broadcast checklist completion
  if (dto.is_checked === true) {
    broadcastDealEvent(data.deal_id, null, 'checklist_completion', {
      checklistItem: data.label ?? data.item_key,
    })
  }

  return data
}

export async function deleteDealChecklistItem(itemId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('deal_checklist_items').delete().eq('id', itemId)
  if (error) throw error
}

// ============================================================================
// Deal Comments
// ============================================================================

export async function getDealComments(dealId: string): Promise<DealCommentWithUser[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_comments')
    .select(`
      *,
      user:users!deal_comments_user_id_fkey (id, full_name, email, avatar_url)
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as DealCommentWithUser[]
}

export async function createDealComment(dto: CreateDealCommentDTO, userId: string): Promise<DealComment> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_comments')
    .insert({
      deal_id: dto.deal_id,
      user_id: userId,
      content: dto.content,
      tagged_user_ids: dto.tagged_user_ids || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDealComment(commentId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('deal_comments').delete().eq('id', commentId)
  if (error) throw error
}

// ============================================================================
// Deal Notes
// ============================================================================

export async function getDealNotes(dealId: string): Promise<DealNoteWithUser[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_notes')
    .select(`
      *,
      user:users!deal_notes_user_id_fkey (id, full_name, email, avatar_url)
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as DealNoteWithUser[]
}

export async function createDealNote(dto: CreateDealNoteDTO, userId: string): Promise<DealNote> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_notes')
    .insert({
      deal_id: dto.deal_id,
      user_id: userId,
      content: dto.content,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDealNote(noteId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('deal_notes').delete().eq('id', noteId)
  if (error) throw error
}

// ============================================================================
// Deal Employees
// ============================================================================

export async function getDealEmployees(dealId: string): Promise<DealEmployeeWithUser[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_employees')
    .select(`
      *,
      user:users!deal_employees_user_id_fkey (id, full_name, email, avatar_url)
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as DealEmployeeWithUser[]
}

export async function createDealEmployee(dto: CreateDealEmployeeDTO): Promise<DealEmployee> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_employees')
    .insert(dto)
    .select()
    .single()
  if (error) throw error

  // Broadcast employee assignment — resolve name asynchronously
  supabase
    .from('users')
    .select('full_name')
    .eq('id', dto.user_id)
    .single()
    .then(({ data: user }) => {
      broadcastDealEvent(dto.deal_id, null, 'employee_change', {
        personName: user?.full_name ?? undefined,
        role: dto.role,
        action: 'assigned',
      })
    })

  return data
}

export async function updateDealEmployee(employeeId: string, dto: UpdateDealEmployeeDTO): Promise<DealEmployee> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_employees')
    .update(dto)
    .eq('id', employeeId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDealEmployee(employeeId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Fetch before delete for broadcast
  const { data: emp } = await supabase
    .from('deal_employees')
    .select('deal_id, user_id, role, user:users!deal_employees_user_id_fkey(full_name)')
    .eq('id', employeeId)
    .single()

  const { error } = await supabase.from('deal_employees').delete().eq('id', employeeId)
  if (error) throw error

  // Broadcast removal
  if (emp) {
    const user = emp.user as unknown as { full_name: string | null } | null
    broadcastDealEvent(emp.deal_id, null, 'employee_change', {
      personName: user?.full_name ?? undefined,
      role: emp.role ?? undefined,
      action: 'removed',
    })
  }
}

// ============================================================================
// Deal Vendors
// ============================================================================

export async function getDealVendors(dealId: string): Promise<DealVendorWithDetails[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_vendors')
    .select(`
      *,
      contact:contacts!deal_vendors_contact_id_fkey (id, first_name, last_name),
      company:companies!deal_vendors_company_id_fkey (id, name)
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as DealVendorWithDetails[]
}

export async function createDealVendor(dto: CreateDealVendorDTO): Promise<DealVendor> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_vendors')
    .insert({
      deal_id: dto.deal_id,
      contact_id: dto.contact_id || null,
      company_id: dto.company_id || null,
      role: dto.role || null,
      notes: dto.notes || null,
    })
    .select()
    .single()
  if (error) throw error

  // Broadcast vendor addition — resolve name asynchronously
  if (dto.contact_id) {
    supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', dto.contact_id)
      .single()
      .then(({ data: contact }) => {
        broadcastDealEvent(dto.deal_id, null, 'vendor_change', {
          personName: contact ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() : undefined,
          role: dto.role,
          action: 'assigned',
        })
      })
  } else if (dto.company_id) {
    supabase
      .from('companies')
      .select('name')
      .eq('id', dto.company_id)
      .single()
      .then(({ data: company }) => {
        broadcastDealEvent(dto.deal_id, null, 'vendor_change', {
          personName: company?.name ?? undefined,
          role: dto.role,
          action: 'assigned',
        })
      })
  }

  return data
}

export async function updateDealVendor(vendorId: string, dto: UpdateDealVendorDTO): Promise<DealVendor> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from('deal_vendors')
    .update(dto)
    .eq('id', vendorId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDealVendor(vendorId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  // Fetch before delete for broadcast
  const { data: vendor } = await supabase
    .from('deal_vendors')
    .select(`
      deal_id, role,
      contact:contacts!deal_vendors_contact_id_fkey(first_name, last_name),
      company:companies!deal_vendors_company_id_fkey(name)
    `)
    .eq('id', vendorId)
    .single()

  const { error } = await supabase.from('deal_vendors').delete().eq('id', vendorId)
  if (error) throw error

  // Broadcast removal
  if (vendor) {
    const contact = vendor.contact as unknown as { first_name: string | null; last_name: string | null } | null
    const company = vendor.company as unknown as { name: string | null } | null
    const name = contact
      ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()
      : company?.name ?? undefined
    broadcastDealEvent(vendor.deal_id, null, 'vendor_change', {
      personName: name,
      role: vendor.role ?? undefined,
      action: 'removed',
    })
  }
}
