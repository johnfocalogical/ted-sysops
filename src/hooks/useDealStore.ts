import { create } from 'zustand'
import type {
  DealStatus,
  DealType,
  DealListItem,
  DealWithDetails,
} from '@/types/deal.types'
import { getDeals, getDealById } from '@/lib/dealService'

interface DealStoreState {
  // List state
  deals: DealListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error: string | null

  // Filters
  search: string
  statusFilter: DealStatus[]
  dealTypeFilter: DealType[]
  ownerFilter: string | null

  // Sort
  sortColumn: string
  sortDirection: 'asc' | 'desc'

  // Selected deal (for detail view)
  selectedDealId: string | null
  selectedDeal: DealWithDetails | null
  loadingSelected: boolean

  // Current team context
  teamId: string | null

  // Actions
  setTeamId: (teamId: string) => void
  loadDeals: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setStatusFilter: (statuses: DealStatus[]) => void
  setDealTypeFilter: (types: DealType[]) => void
  setOwnerFilter: (ownerId: string | null) => void
  setSort: (column: string, direction: 'asc' | 'desc') => void
  selectDeal: (id: string | null) => Promise<void>
  refreshSelected: () => Promise<void>
  refreshList: () => Promise<void>
  clearSelection: () => void
  clearStore: () => void
}

export const useDealStore = create<DealStoreState>((set, get) => ({
  // Initial state
  deals: [],
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
  loading: false,
  error: null,

  search: '',
  statusFilter: [],
  dealTypeFilter: [],
  ownerFilter: null,

  sortColumn: 'updated_at',
  sortDirection: 'desc',

  selectedDealId: null,
  selectedDeal: null,
  loadingSelected: false,

  teamId: null,

  setTeamId: (teamId: string) => {
    const current = get().teamId
    if (current !== teamId) {
      set({
        teamId,
        deals: [],
        total: 0,
        page: 1,
        totalPages: 0,
        selectedDealId: null,
        selectedDeal: null,
        search: '',
        statusFilter: [],
        dealTypeFilter: [],
        ownerFilter: null,
      })
    }
  },

  loadDeals: async () => {
    const { teamId, page, pageSize, search, statusFilter, ownerFilter } = get()
    if (!teamId) return

    set({ loading: true, error: null })

    try {
      const result = await getDeals({
        teamId,
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        ownerId: ownerFilter || undefined,
      })

      set({
        deals: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        loading: false,
      })
    } catch (err) {
      console.error('Error loading deals:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load deals',
        loading: false,
      })
    }
  },

  setPage: (page: number) => {
    set({ page })
    get().loadDeals()
  },

  setSearch: (search: string) => {
    set({ search, page: 1 })
    get().loadDeals()
  },

  setStatusFilter: (statuses: DealStatus[]) => {
    set({ statusFilter: statuses, page: 1 })
    get().loadDeals()
  },

  setDealTypeFilter: (types: DealType[]) => {
    set({ dealTypeFilter: types, page: 1 })
    get().loadDeals()
  },

  setOwnerFilter: (ownerId: string | null) => {
    set({ ownerFilter: ownerId, page: 1 })
    get().loadDeals()
  },

  setSort: (column: string, direction: 'asc' | 'desc') => {
    set({ sortColumn: column, sortDirection: direction })
    get().loadDeals()
  },

  selectDeal: async (id: string | null) => {
    if (!id) {
      set({ selectedDealId: null, selectedDeal: null })
      return
    }

    set({ selectedDealId: id, loadingSelected: true })

    try {
      const deal = await getDealById(id)
      set({ selectedDeal: deal, loadingSelected: false })
    } catch (err) {
      console.error('Error loading deal details:', err)
      set({ loadingSelected: false })
    }
  },

  refreshSelected: async () => {
    const { selectedDealId } = get()
    if (selectedDealId) {
      await get().selectDeal(selectedDealId)
    }
  },

  refreshList: async () => {
    await get().loadDeals()
  },

  clearSelection: () => {
    set({ selectedDealId: null, selectedDeal: null })
  },

  clearStore: () => {
    set({
      deals: [],
      total: 0,
      page: 1,
      totalPages: 0,
      loading: false,
      error: null,
      search: '',
      statusFilter: [],
      dealTypeFilter: [],
      ownerFilter: null,
      selectedDealId: null,
      selectedDeal: null,
      loadingSelected: false,
      teamId: null,
    })
  },
}))
