import { create } from 'zustand'
import { getOrganizationDetails, isOrgOwner as checkIsOrgOwner } from '@/lib/orgService'
import type { OrganizationWithDetails } from '@/types/org-member.types'

interface OrgContextState {
  // Current organization
  organization: OrganizationWithDetails | null
  loading: boolean
  error: string | null
  isOwner: boolean

  // Actions
  loadOrg: (orgId: string, userId: string) => Promise<boolean>
  clearOrg: () => void

  // Computed helpers
  orgId: () => string | null
  orgName: () => string | null
}

export const useOrgContext = create<OrgContextState>((set, get) => ({
  // Initial state
  organization: null,
  loading: false,
  error: null,
  isOwner: false,

  // Load organization details
  loadOrg: async (orgId: string, userId: string): Promise<boolean> => {
    set({ loading: true, error: null })

    try {
      // Check if user is org owner
      const ownerStatus = await checkIsOrgOwner(orgId, userId)

      // Get org details
      const org = await getOrganizationDetails(orgId)

      set({
        organization: org,
        isOwner: ownerStatus,
        loading: false,
        error: null,
      })
      return true
    } catch (err) {
      console.error('Error loading org context:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load organization',
        loading: false,
        organization: null,
        isOwner: false,
      })
      return false
    }
  },

  // Clear organization context
  clearOrg: () => {
    set({ organization: null, error: null, isOwner: false })
  },

  // Helper: Get org ID
  orgId: () => {
    const { organization } = get()
    return organization?.id || null
  },

  // Helper: Get org name
  orgName: () => {
    const { organization } = get()
    return organization?.name || null
  },
}))
