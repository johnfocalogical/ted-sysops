import { create } from 'zustand'
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
import {
  getMyDeadlines,
  getMyPipeline,
  getMyFinancials,
  getStaleDeals,
  getTeamPipeline,
  getTeamWorkload,
  getTeamFinancials,
  getRecentlyClosed,
} from '@/lib/dashboardService'

// ============================================================================
// Section keys for loading/error state
// ============================================================================

type SectionKey =
  | 'deadlines'
  | 'myPipeline'
  | 'myFinancials'
  | 'staleDeals'
  | 'teamPipeline'
  | 'teamWorkload'
  | 'teamFinancials'
  | 'recentlyClosed'

type LoadingState = Record<SectionKey, boolean>
type ErrorState = Record<SectionKey, string | null>

const initialLoading: LoadingState = {
  deadlines: false,
  myPipeline: false,
  myFinancials: false,
  staleDeals: false,
  teamPipeline: false,
  teamWorkload: false,
  teamFinancials: false,
  recentlyClosed: false,
}

const initialErrors: ErrorState = {
  deadlines: null,
  myPipeline: null,
  myFinancials: null,
  staleDeals: null,
  teamPipeline: null,
  teamWorkload: null,
  teamFinancials: null,
  recentlyClosed: null,
}

// ============================================================================
// Store interface
// ============================================================================

interface DashboardState {
  // My Dashboard data
  deadlines: DashboardDeadline[]
  myPipeline: DashboardPipelineItem[]
  myFinancials: DashboardFinancials | null
  staleDeals: DashboardStaleDeal[]

  // Team Dashboard data
  teamPipeline: DashboardPipelineItem[]
  teamWorkload: DashboardTeamWorkload[]
  teamFinancials: DashboardTeamFinancials | null
  recentlyClosed: DashboardRecentlyClosed[]

  // Loading / error states (per section)
  loading: LoadingState
  errors: ErrorState

  // Filter state
  deadlineDaysAhead: number
  teamPeriod: DashboardPeriod

  // Actions — My Dashboard
  loadMyDashboard: (teamId: string, userId: string) => Promise<void>
  loadDeadlines: (teamId: string, userId: string, daysAhead?: number) => Promise<void>
  loadMyPipeline: (teamId: string, userId: string) => Promise<void>
  loadMyFinancials: (teamId: string, userId: string) => Promise<void>
  loadStaleDeals: (teamId: string, userId: string) => Promise<void>
  setDeadlineDaysAhead: (days: number, teamId: string, userId: string) => void

  // Actions — Team Dashboard
  loadTeamDashboard: (teamId: string) => Promise<void>
  loadTeamPipeline: (teamId: string, period?: DashboardPeriod) => Promise<void>
  loadTeamWorkload: (teamId: string) => Promise<void>
  loadTeamFinancials: (teamId: string, period?: DashboardPeriod) => Promise<void>
  loadRecentlyClosed: (teamId: string) => Promise<void>
  setTeamPeriod: (period: DashboardPeriod, teamId: string) => void

  // Reset
  reset: () => void
}

// ============================================================================
// Store
// ============================================================================

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial data
  deadlines: [],
  myPipeline: [],
  myFinancials: null,
  staleDeals: [],

  teamPipeline: [],
  teamWorkload: [],
  teamFinancials: null,
  recentlyClosed: [],

  loading: { ...initialLoading },
  errors: { ...initialErrors },

  deadlineDaysAhead: 7,
  teamPeriod: 'mtd',

  // ---------------------------------------------------------------------------
  // My Dashboard
  // ---------------------------------------------------------------------------

  loadMyDashboard: async (teamId, userId) => {
    const s = get()
    // Fire all sections in parallel — each manages its own loading state
    await Promise.allSettled([
      s.loadDeadlines(teamId, userId),
      s.loadMyPipeline(teamId, userId),
      s.loadMyFinancials(teamId, userId),
      s.loadStaleDeals(teamId, userId),
    ])
  },

  loadDeadlines: async (teamId, userId, daysAhead) => {
    set((s) => ({
      loading: { ...s.loading, deadlines: true },
      errors: { ...s.errors, deadlines: null },
    }))
    try {
      const data = await getMyDeadlines(teamId, userId, daysAhead ?? get().deadlineDaysAhead)
      set((s) => ({ deadlines: data, loading: { ...s.loading, deadlines: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, deadlines: false },
        errors: { ...s.errors, deadlines: err instanceof Error ? err.message : 'Failed to load deadlines' },
      }))
    }
  },

  loadMyPipeline: async (teamId, userId) => {
    set((s) => ({
      loading: { ...s.loading, myPipeline: true },
      errors: { ...s.errors, myPipeline: null },
    }))
    try {
      const data = await getMyPipeline(teamId, userId)
      set((s) => ({ myPipeline: data, loading: { ...s.loading, myPipeline: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, myPipeline: false },
        errors: { ...s.errors, myPipeline: err instanceof Error ? err.message : 'Failed to load pipeline' },
      }))
    }
  },

  loadMyFinancials: async (teamId, userId) => {
    set((s) => ({
      loading: { ...s.loading, myFinancials: true },
      errors: { ...s.errors, myFinancials: null },
    }))
    try {
      const data = await getMyFinancials(teamId, userId)
      set((s) => ({ myFinancials: data, loading: { ...s.loading, myFinancials: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, myFinancials: false },
        errors: { ...s.errors, myFinancials: err instanceof Error ? err.message : 'Failed to load financials' },
      }))
    }
  },

  loadStaleDeals: async (teamId, userId) => {
    set((s) => ({
      loading: { ...s.loading, staleDeals: true },
      errors: { ...s.errors, staleDeals: null },
    }))
    try {
      const data = await getStaleDeals(teamId, userId)
      set((s) => ({ staleDeals: data, loading: { ...s.loading, staleDeals: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, staleDeals: false },
        errors: { ...s.errors, staleDeals: err instanceof Error ? err.message : 'Failed to load stale deals' },
      }))
    }
  },

  setDeadlineDaysAhead: (days, teamId, userId) => {
    set({ deadlineDaysAhead: days })
    get().loadDeadlines(teamId, userId, days)
  },

  // ---------------------------------------------------------------------------
  // Team Dashboard
  // ---------------------------------------------------------------------------

  loadTeamDashboard: async (teamId) => {
    const s = get()
    await Promise.allSettled([
      s.loadTeamPipeline(teamId),
      s.loadTeamWorkload(teamId),
      s.loadTeamFinancials(teamId),
      s.loadRecentlyClosed(teamId),
    ])
  },

  loadTeamPipeline: async (teamId, period) => {
    set((s) => ({
      loading: { ...s.loading, teamPipeline: true },
      errors: { ...s.errors, teamPipeline: null },
    }))
    try {
      const data = await getTeamPipeline(teamId, period ?? get().teamPeriod)
      set((s) => ({ teamPipeline: data, loading: { ...s.loading, teamPipeline: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, teamPipeline: false },
        errors: { ...s.errors, teamPipeline: err instanceof Error ? err.message : 'Failed to load team pipeline' },
      }))
    }
  },

  loadTeamWorkload: async (teamId) => {
    set((s) => ({
      loading: { ...s.loading, teamWorkload: true },
      errors: { ...s.errors, teamWorkload: null },
    }))
    try {
      const data = await getTeamWorkload(teamId)
      set((s) => ({ teamWorkload: data, loading: { ...s.loading, teamWorkload: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, teamWorkload: false },
        errors: { ...s.errors, teamWorkload: err instanceof Error ? err.message : 'Failed to load workload' },
      }))
    }
  },

  loadTeamFinancials: async (teamId, period) => {
    set((s) => ({
      loading: { ...s.loading, teamFinancials: true },
      errors: { ...s.errors, teamFinancials: null },
    }))
    try {
      const data = await getTeamFinancials(teamId, period ?? get().teamPeriod)
      set((s) => ({ teamFinancials: data, loading: { ...s.loading, teamFinancials: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, teamFinancials: false },
        errors: { ...s.errors, teamFinancials: err instanceof Error ? err.message : 'Failed to load team financials' },
      }))
    }
  },

  loadRecentlyClosed: async (teamId) => {
    set((s) => ({
      loading: { ...s.loading, recentlyClosed: true },
      errors: { ...s.errors, recentlyClosed: null },
    }))
    try {
      const data = await getRecentlyClosed(teamId)
      set((s) => ({ recentlyClosed: data, loading: { ...s.loading, recentlyClosed: false } }))
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, recentlyClosed: false },
        errors: { ...s.errors, recentlyClosed: err instanceof Error ? err.message : 'Failed to load recently closed' },
      }))
    }
  },

  setTeamPeriod: (period, teamId) => {
    set({ teamPeriod: period })
    const s = get()
    // Re-fetch period-sensitive sections
    s.loadTeamPipeline(teamId, period)
    s.loadTeamFinancials(teamId, period)
  },

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  reset: () =>
    set({
      deadlines: [],
      myPipeline: [],
      myFinancials: null,
      staleDeals: [],
      teamPipeline: [],
      teamWorkload: [],
      teamFinancials: null,
      recentlyClosed: [],
      loading: { ...initialLoading },
      errors: { ...initialErrors },
      deadlineDaysAhead: 7,
      teamPeriod: 'mtd',
    }),
}))
