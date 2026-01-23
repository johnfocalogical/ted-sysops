import { create } from 'zustand'
import type {
  ContactType,
  ContactListItem,
  ContactWithDetails,
} from '@/types/contact.types'
import {
  getContacts,
  getContactById,
  getContactTypes,
} from '@/lib/contactService'

interface ContactStoreState {
  // List state
  contacts: ContactListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error: string | null

  // Filters
  search: string
  typeFilter: string[]

  // Contact types (lookup data)
  contactTypes: ContactType[]
  typesLoaded: boolean

  // Selected contact (for drawer)
  selectedContactId: string | null
  selectedContact: ContactWithDetails | null
  loadingSelected: boolean

  // Current team context
  teamId: string | null

  // Actions
  setTeamId: (teamId: string) => void
  loadContacts: () => Promise<void>
  loadContactTypes: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setTypeFilter: (typeIds: string[]) => void
  selectContact: (id: string | null) => Promise<void>
  refreshSelected: () => Promise<void>
  refreshList: () => Promise<void>
  clearStore: () => void
}

export const useContactStore = create<ContactStoreState>((set, get) => ({
  // Initial state
  contacts: [],
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
  loading: false,
  error: null,

  search: '',
  typeFilter: [],

  contactTypes: [],
  typesLoaded: false,

  selectedContactId: null,
  selectedContact: null,
  loadingSelected: false,

  teamId: null,

  // Set the current team
  setTeamId: (teamId: string) => {
    const current = get().teamId
    if (current !== teamId) {
      set({
        teamId,
        contacts: [],
        total: 0,
        page: 1,
        totalPages: 0,
        selectedContactId: null,
        selectedContact: null,
        search: '',
        typeFilter: [],
        typesLoaded: false,
        contactTypes: [],
      })
    }
  },

  // Load contacts for the current team
  loadContacts: async () => {
    const { teamId, page, pageSize, search, typeFilter } = get()
    if (!teamId) return

    set({ loading: true, error: null })

    try {
      const result = await getContacts({
        teamId,
        page,
        pageSize,
        search: search || undefined,
        typeIds: typeFilter.length > 0 ? typeFilter : undefined,
      })

      set({
        contacts: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        loading: false,
      })
    } catch (err) {
      console.error('Error loading contacts:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load contacts',
        loading: false,
      })
    }
  },

  // Load contact types (lookup data)
  loadContactTypes: async () => {
    const { teamId, typesLoaded } = get()
    if (typesLoaded || !teamId) return

    try {
      const types = await getContactTypes(teamId)
      set({ contactTypes: types, typesLoaded: true })
    } catch (err) {
      console.error('Error loading contact types:', err)
    }
  },

  // Pagination
  setPage: (page: number) => {
    set({ page })
    get().loadContacts()
  },

  // Search with debounce handled by component
  setSearch: (search: string) => {
    set({ search, page: 1 })
    get().loadContacts()
  },

  // Type filter
  setTypeFilter: (typeIds: string[]) => {
    set({ typeFilter: typeIds, page: 1 })
    get().loadContacts()
  },

  // Select a contact (load full details)
  selectContact: async (id: string | null) => {
    if (!id) {
      set({ selectedContactId: null, selectedContact: null })
      return
    }

    set({ selectedContactId: id, loadingSelected: true })

    try {
      const contact = await getContactById(id)
      set({ selectedContact: contact, loadingSelected: false })
    } catch (err) {
      console.error('Error loading contact details:', err)
      set({ loadingSelected: false })
    }
  },

  // Refresh the selected contact
  refreshSelected: async () => {
    const { selectedContactId } = get()
    if (selectedContactId) {
      await get().selectContact(selectedContactId)
    }
  },

  // Refresh the list (after create/update/delete)
  refreshList: async () => {
    await get().loadContacts()
  },

  // Clear all state
  clearStore: () => {
    set({
      contacts: [],
      total: 0,
      page: 1,
      totalPages: 0,
      loading: false,
      error: null,
      search: '',
      typeFilter: [],
      selectedContactId: null,
      selectedContact: null,
      loadingSelected: false,
      teamId: null,
    })
  },
}))
