import { create } from 'zustand'
import type {
  CompanyType,
  CompanyListItem,
  CompanyWithDetails,
} from '@/types/company.types'
import {
  getCompanies,
  getCompanyById,
  getCompanyTypes,
} from '@/lib/companyService'

interface CompanyStoreState {
  // List state
  companies: CompanyListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error: string | null

  // Filters
  search: string
  typeFilter: string[]

  // Company types (lookup data)
  companyTypes: CompanyType[]
  typesLoaded: boolean

  // Selected company (for drawer)
  selectedCompanyId: string | null
  selectedCompany: CompanyWithDetails | null
  loadingSelected: boolean

  // Current team context
  teamId: string | null

  // Actions
  setTeamId: (teamId: string) => void
  loadCompanies: () => Promise<void>
  loadCompanyTypes: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setTypeFilter: (typeIds: string[]) => void
  selectCompany: (id: string | null) => Promise<void>
  refreshSelected: () => Promise<void>
  refreshList: () => Promise<void>
  clearStore: () => void
}

export const useCompanyStore = create<CompanyStoreState>((set, get) => ({
  // Initial state
  companies: [],
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
  loading: false,
  error: null,

  search: '',
  typeFilter: [],

  companyTypes: [],
  typesLoaded: false,

  selectedCompanyId: null,
  selectedCompany: null,
  loadingSelected: false,

  teamId: null,

  // Set the current team
  setTeamId: (teamId: string) => {
    const current = get().teamId
    if (current !== teamId) {
      set({
        teamId,
        companies: [],
        total: 0,
        page: 1,
        totalPages: 0,
        selectedCompanyId: null,
        selectedCompany: null,
        search: '',
        typeFilter: [],
        typesLoaded: false,
        companyTypes: [],
      })
    }
  },

  // Load companies for the current team
  loadCompanies: async () => {
    const { teamId, page, pageSize, search, typeFilter } = get()
    if (!teamId) return

    set({ loading: true, error: null })

    try {
      const result = await getCompanies({
        teamId,
        page,
        pageSize,
        search: search || undefined,
        typeIds: typeFilter.length > 0 ? typeFilter : undefined,
      })

      set({
        companies: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        loading: false,
      })
    } catch (err) {
      console.error('Error loading companies:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load companies',
        loading: false,
      })
    }
  },

  // Load company types (lookup data)
  loadCompanyTypes: async () => {
    const { teamId, typesLoaded } = get()
    if (typesLoaded || !teamId) return

    try {
      const types = await getCompanyTypes(teamId)
      set({ companyTypes: types, typesLoaded: true })
    } catch (err) {
      console.error('Error loading company types:', err)
    }
  },

  // Pagination
  setPage: (page: number) => {
    set({ page })
    get().loadCompanies()
  },

  // Search with debounce handled by component
  setSearch: (search: string) => {
    set({ search, page: 1 })
    get().loadCompanies()
  },

  // Type filter
  setTypeFilter: (typeIds: string[]) => {
    set({ typeFilter: typeIds, page: 1 })
    get().loadCompanies()
  },

  // Select a company (load full details)
  selectCompany: async (id: string | null) => {
    if (!id) {
      set({ selectedCompanyId: null, selectedCompany: null })
      return
    }

    set({ selectedCompanyId: id, loadingSelected: true })

    try {
      const company = await getCompanyById(id)
      set({ selectedCompany: company, loadingSelected: false })
    } catch (err) {
      console.error('Error loading company details:', err)
      set({ loadingSelected: false })
    }
  },

  // Refresh the selected company
  refreshSelected: async () => {
    const { selectedCompanyId } = get()
    if (selectedCompanyId) {
      await get().selectCompany(selectedCompanyId)
    }
  },

  // Refresh the list (after create/update/delete)
  refreshList: async () => {
    await get().loadCompanies()
  },

  // Clear all state
  clearStore: () => {
    set({
      companies: [],
      total: 0,
      page: 1,
      totalPages: 0,
      loading: false,
      error: null,
      search: '',
      typeFilter: [],
      selectedCompanyId: null,
      selectedCompany: null,
      loadingSelected: false,
      teamId: null,
    })
  },
}))
