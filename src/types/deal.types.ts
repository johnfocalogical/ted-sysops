// ============================================================================
// Deal Types - Central deal entity and all related sub-entities
// ============================================================================

// ============================================================================
// Enums (matching database enum values)
// ============================================================================

export type DealStatus =
  | 'active'
  | 'for_sale'
  | 'pending_sale'
  | 'closed'
  | 'funded'
  | 'on_hold'
  | 'canceled'

export type DealType = 'wholesale' | 'listing' | 'novation' | 'purchase'

export type PurchaseType =
  | 'cash'
  | 'financing'
  | 'subject_to'
  | 'owner_finance'
  | 'hard_money'

export type TitleStatus =
  | 'not_ordered'
  | 'ordered'
  | 'in_progress'
  | 'clear'
  | 'issues'
  | 'ready_to_close'

export type ExpenseCategory =
  | 'marketing'
  | 'inspection'
  | 'title_escrow'
  | 'legal'
  | 'hoa'
  | 'earnest_money'
  | 'contractor'
  | 'other'

export type JVType = 'fixed' | 'percentage'

// ============================================================================
// Label Maps (for display)
// ============================================================================

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  active: 'Active',
  for_sale: 'For Sale',
  pending_sale: 'Pending Sale',
  closed: 'Closed',
  funded: 'Funded',
  on_hold: 'On Hold',
  canceled: 'Canceled',
}

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  wholesale: 'Wholesale',
  listing: 'Listing',
  novation: 'Novation',
  purchase: 'Purchase',
}

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  cash: 'Cash',
  financing: 'Financing',
  subject_to: 'Subject To',
  owner_finance: 'Owner Finance',
  hard_money: 'Hard Money',
}

export const TITLE_STATUS_LABELS: Record<TitleStatus, string> = {
  not_ordered: 'Not Ordered',
  ordered: 'Ordered',
  in_progress: 'In Progress',
  clear: 'Clear',
  issues: 'Issues',
  ready_to_close: 'Ready to Close',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  marketing: 'Marketing',
  inspection: 'Inspection',
  title_escrow: 'Title/Escrow',
  legal: 'Legal',
  hoa: 'HOA',
  earnest_money: 'Earnest Money',
  contractor: 'Contractor',
  other: 'Other',
}

export const JV_TYPE_LABELS: Record<JVType, string> = {
  fixed: 'Fixed Amount',
  percentage: 'Percentage',
}

// ============================================================================
// Core Deal Interface
// ============================================================================

export interface Deal {
  id: string
  team_id: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
  county: string | null
  deal_type: DealType
  status: DealStatus
  owner_id: string
  transaction_coordinator_id: string | null
  seller_contact_id: string | null
  buyer_contact_id: string | null
  contract_date: string | null
  closing_date: string | null
  contract_price: number | null
  custom_fields: Record<string, unknown>
  notes: string | null
  deleted_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Fact Table Interfaces (1:1 with Deal)
// ============================================================================

export interface DealContractFacts {
  deal_id: string
  original_contract_price: number | null
  actual_contract_price: number | null
  contract_date: string | null
  due_diligence_date: string | null
  due_diligence_end_date: string | null
  original_closing_date: string | null
  extended_closing_date: string | null
  earnest_money_amount: number | null
  earnest_money_held_by: string | null
  earnest_money_date: string | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DealPropertyFacts {
  deal_id: string
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  lot_size: string | null
  year_built: number | null
  legal_description: string | null
  parcel_number: string | null
  mortgage_balance: number | null
  mortgage_monthly_payment: number | null
  mortgage_lender: string | null
  liens_amount: number | null
  liens_description: string | null
  is_foreclosure: boolean
  foreclosure_auction_date: string | null
  foreclosure_status: string | null
  property_condition: string | null
  arv: number | null
  estimated_repair_cost: number | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DealFacts {
  deal_id: string
  lead_source: string | null
  lead_source_detail: string | null
  reason_for_selling: string | null
  title_status: TitleStatus
  title_company_id: string | null
  title_ordered_date: string | null
  title_clear_date: string | null
  poa_required: boolean
  poa_status: string | null
  purchase_type: PurchaseType | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DealDisposition {
  deal_id: string
  original_projected_sale_price: number | null
  updated_projected_sale_price: number | null
  actual_sale_price: number | null
  listing_price: number | null
  listing_date: string | null
  listing_agent_contact_id: string | null
  is_jv_deal: boolean
  jv_type: JVType | null
  jv_fixed_amount: number | null
  jv_percentage: number | null
  jv_partner_contact_id: string | null
  assignment_fee: number | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ============================================================================
// One-to-Many Interfaces
// ============================================================================

export interface DealEmployee {
  id: string
  deal_id: string
  user_id: string
  role: string | null
  commission_percentage: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DealVendor {
  id: string
  deal_id: string
  contact_id: string | null
  company_id: string | null
  role: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DealExpense {
  id: string
  deal_id: string
  category: ExpenseCategory
  description: string | null
  amount: number
  expense_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DealShowing {
  id: string
  deal_id: string
  showing_datetime: string
  duration_minutes: number
  buffer_minutes: number
  buyer_contact_id: string | null
  vendor_contact_id: string | null
  status: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CheckedBySource {
  source: 'manual' | 'automator'
  user_id?: string
  automator_name?: string
  instance_id?: string
  step_node_id?: string
}

export interface DealChecklistItem {
  id: string
  deal_id: string
  item_key: string
  label: string
  is_checked: boolean
  date_completed: string | null
  price: number | null
  sort_order: number
  process_instance_id: string | null
  checked_by_source: CheckedBySource | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DealComment {
  id: string
  deal_id: string
  user_id: string
  content: string
  tagged_user_ids: string[] | null
  created_at: string
  updated_at: string
}

export interface DealNote {
  id: string
  deal_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// ============================================================================
// Extended / Joined Interfaces (for views with related data)
// ============================================================================

export interface DealEmployeeWithUser extends DealEmployee {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface DealVendorWithDetails extends DealVendor {
  contact?: {
    id: string
    first_name: string
    last_name: string | null
  } | null
  company?: {
    id: string
    name: string
  } | null
}

export interface DealCommentWithUser extends DealComment {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface DealNoteWithUser extends DealNote {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export interface DealShowingWithContacts extends DealShowing {
  buyer_contact?: {
    id: string
    first_name: string
    last_name: string | null
  } | null
  vendor_contact?: {
    id: string
    first_name: string
    last_name: string | null
  } | null
}

export interface DealListItem extends Deal {
  owner: {
    id: string
    full_name: string | null
    email: string
  }
  seller_contact?: {
    id: string
    first_name: string
    last_name: string | null
  } | null
}

export interface DealWithDetails extends Deal {
  owner: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  transaction_coordinator?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
  seller_contact?: {
    id: string
    first_name: string
    last_name: string | null
  } | null
  buyer_contact?: {
    id: string
    first_name: string
    last_name: string | null
  } | null
  contract_facts?: DealContractFacts | null
  property_facts?: DealPropertyFacts | null
  deal_facts?: DealFacts | null
  disposition?: DealDisposition | null
}

// ============================================================================
// DTOs (Data Transfer Objects for create/update operations)
// ============================================================================

export interface CreateDealDTO {
  team_id: string
  address: string
  city?: string
  state?: string
  zip?: string
  county?: string
  deal_type: DealType
  status?: DealStatus
  owner_id: string
  transaction_coordinator_id?: string
  seller_contact_id?: string
  buyer_contact_id?: string
  contract_date?: string
  closing_date?: string
  contract_price?: number
  custom_fields?: Record<string, unknown>
  notes?: string
}

export interface UpdateDealDTO {
  address?: string
  city?: string | null
  state?: string | null
  zip?: string | null
  county?: string | null
  deal_type?: DealType
  status?: DealStatus
  owner_id?: string
  transaction_coordinator_id?: string | null
  seller_contact_id?: string | null
  buyer_contact_id?: string | null
  contract_date?: string | null
  closing_date?: string | null
  contract_price?: number | null
  custom_fields?: Record<string, unknown>
  notes?: string | null
}

export interface UpsertDealContractFactsDTO {
  deal_id: string
  original_contract_price?: number | null
  actual_contract_price?: number | null
  contract_date?: string | null
  due_diligence_date?: string | null
  due_diligence_end_date?: string | null
  original_closing_date?: string | null
  extended_closing_date?: string | null
  earnest_money_amount?: number | null
  earnest_money_held_by?: string | null
  earnest_money_date?: string | null
  custom_fields?: Record<string, unknown>
}

export interface UpsertDealPropertyFactsDTO {
  deal_id: string
  property_type?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  sqft?: number | null
  lot_size?: string | null
  year_built?: number | null
  legal_description?: string | null
  parcel_number?: string | null
  mortgage_balance?: number | null
  mortgage_monthly_payment?: number | null
  mortgage_lender?: string | null
  liens_amount?: number | null
  liens_description?: string | null
  is_foreclosure?: boolean
  foreclosure_auction_date?: string | null
  foreclosure_status?: string | null
  property_condition?: string | null
  arv?: number | null
  estimated_repair_cost?: number | null
  custom_fields?: Record<string, unknown>
}

export interface UpsertDealFactsDTO {
  deal_id: string
  lead_source?: string | null
  lead_source_detail?: string | null
  reason_for_selling?: string | null
  title_status?: TitleStatus
  title_company_id?: string | null
  title_ordered_date?: string | null
  title_clear_date?: string | null
  poa_required?: boolean
  poa_status?: string | null
  purchase_type?: PurchaseType | null
  custom_fields?: Record<string, unknown>
}

export interface UpsertDealDispositionDTO {
  deal_id: string
  original_projected_sale_price?: number | null
  updated_projected_sale_price?: number | null
  actual_sale_price?: number | null
  listing_price?: number | null
  listing_date?: string | null
  listing_agent_contact_id?: string | null
  is_jv_deal?: boolean
  jv_type?: JVType | null
  jv_fixed_amount?: number | null
  jv_percentage?: number | null
  jv_partner_contact_id?: string | null
  assignment_fee?: number | null
  custom_fields?: Record<string, unknown>
}

export interface CreateDealExpenseDTO {
  deal_id: string
  category: ExpenseCategory
  description?: string
  amount: number
  expense_date?: string
  notes?: string
}

export interface UpdateDealExpenseDTO {
  category?: ExpenseCategory
  description?: string | null
  amount?: number
  expense_date?: string | null
  notes?: string | null
}

export interface CreateDealShowingDTO {
  deal_id: string
  showing_datetime: string
  duration_minutes?: number
  buffer_minutes?: number
  buyer_contact_id?: string
  vendor_contact_id?: string
  notes?: string
}

export interface UpdateDealShowingDTO {
  showing_datetime?: string
  duration_minutes?: number
  buffer_minutes?: number
  buyer_contact_id?: string | null
  vendor_contact_id?: string | null
  status?: string
  notes?: string | null
}

export interface CreateDealChecklistItemDTO {
  deal_id: string
  item_key: string
  label: string
  sort_order?: number
  price?: number
  notes?: string
}

export interface UpdateDealChecklistItemDTO {
  label?: string
  is_checked?: boolean
  date_completed?: string | null
  price?: number | null
  sort_order?: number
  notes?: string | null
}

export interface CreateDealCommentDTO {
  deal_id: string
  content: string
  tagged_user_ids?: string[]
}

export interface CreateDealNoteDTO {
  deal_id: string
  content: string
}

export interface CreateDealEmployeeDTO {
  deal_id: string
  user_id: string
  role?: string
  notes?: string
}

export interface UpdateDealEmployeeDTO {
  role?: string | null
  commission_percentage?: number | null
  notes?: string | null
}

export interface CreateDealVendorDTO {
  deal_id: string
  contact_id?: string
  company_id?: string
  role?: string
  notes?: string
}

export interface UpdateDealVendorDTO {
  role?: string | null
  notes?: string | null
}
