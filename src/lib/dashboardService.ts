import { supabase } from './supabase'
import type {
  DashboardDeadline,
  DashboardPipelineItem,
  DashboardFinancials,
  DashboardStaleDeal,
  DashboardTeamWorkload,
  DashboardTeamFinancials,
  DashboardRecentlyClosed,
  DashboardPeriod,
} from '@/types/dashboard.types'

// ============================================================================
// My Dashboard
// ============================================================================

export async function getMyDeadlines(
  teamId: string,
  userId: string,
  daysAhead: number = 7
): Promise<DashboardDeadline[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_my_deadlines', {
    p_team_id: teamId,
    p_user_id: userId,
    p_days_ahead: daysAhead,
  })
  if (error) throw error
  return data ?? []
}

export async function getMyPipeline(
  teamId: string,
  userId: string
): Promise<DashboardPipelineItem[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_my_pipeline', {
    p_team_id: teamId,
    p_user_id: userId,
  })
  if (error) throw error
  return data ?? []
}

export async function getMyFinancials(
  teamId: string,
  userId: string
): Promise<DashboardFinancials> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_my_financials', {
    p_team_id: teamId,
    p_user_id: userId,
  })
  if (error) throw error
  // RPC returns an array; our function returns a single row
  const row = Array.isArray(data) ? data[0] : data
  return row ?? {
    pipeline_value: 0,
    closed_revenue_mtd: 0,
    closed_revenue_qtd: 0,
    estimated_commissions: 0,
    total_expenses: 0,
  }
}

export async function getStaleDeals(
  teamId: string,
  userId: string,
  staleDays: number = 7
): Promise<DashboardStaleDeal[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_stale_deals', {
    p_team_id: teamId,
    p_user_id: userId,
    p_stale_days: staleDays,
  })
  if (error) throw error
  return data ?? []
}

// ============================================================================
// Team Dashboard
// ============================================================================

export async function getTeamPipeline(
  teamId: string,
  period: DashboardPeriod = 'mtd'
): Promise<DashboardPipelineItem[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_team_pipeline', {
    p_team_id: teamId,
    p_period: period,
  })
  if (error) throw error
  return data ?? []
}

export async function getTeamWorkload(
  teamId: string
): Promise<DashboardTeamWorkload[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_team_workload', {
    p_team_id: teamId,
  })
  if (error) throw error
  return data ?? []
}

export async function getTeamFinancials(
  teamId: string,
  period: DashboardPeriod = 'mtd'
): Promise<DashboardTeamFinancials> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_team_financials', {
    p_team_id: teamId,
    p_period: period,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return row ?? {
    pipeline_value: 0,
    closed_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
  }
}

export async function getRecentlyClosed(
  teamId: string,
  days: number = 30
): Promise<DashboardRecentlyClosed[]> {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.rpc('dashboard_recently_closed', {
    p_team_id: teamId,
    p_days: days,
  })
  if (error) throw error
  return data ?? []
}
