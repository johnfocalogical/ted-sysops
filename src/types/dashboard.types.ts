// ============================================================================
// Dashboard Types - Return types for dashboard RPC functions
// ============================================================================

import type { DealStatus } from './deal.types'

// ============================================================================
// My Dashboard
// ============================================================================

export interface DashboardDeadline {
  deal_id: string
  address: string
  status: DealStatus
  deadline_type: 'dd_expiration' | 'closing_date' | 'extended_closing'
  deadline_date: string
  days_remaining: number
  owner_name: string
}

export interface DashboardPipelineItem {
  status: DealStatus
  deal_count: number
  total_projected_profit: number
  total_actual_profit: number
}

export interface DashboardFinancials {
  pipeline_value: number
  closed_revenue_mtd: number
  closed_revenue_qtd: number
  estimated_commissions: number
  total_expenses: number
}

export interface DashboardStaleDeal {
  deal_id: string
  address: string
  status: DealStatus
  owner_name: string
  days_since_activity: number
}

// ============================================================================
// Team Dashboard
// ============================================================================

export interface DashboardTeamWorkload {
  user_id: string
  full_name: string
  active_count: number
  for_sale_count: number
  pending_count: number
  closed_mtd_count: number
  total_pipeline_value: number
}

export interface DashboardTeamFinancials {
  pipeline_value: number
  closed_revenue: number
  total_expenses: number
  net_profit: number
}

export interface DashboardRecentlyClosed {
  deal_id: string
  address: string
  closed_date: string
  actual_sale_price: number
  net_profit: number
  owner_name: string
}

// ============================================================================
// Shared
// ============================================================================

export type DashboardPeriod = 'mtd' | 'qtd' | 'ytd'
