import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SectionKey } from '@/types/role.types'

interface NavigationState {
  collapsed: boolean
  mobileOpen: boolean
  toggleCollapsed: () => void
  setCollapsed: (value: boolean) => void
  toggleMobileMenu: () => void
  openMobileMenu: () => void
  closeMobileMenu: () => void
}

export const useNavigation = create<NavigationState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (value) => set({ collapsed: value }),
      toggleMobileMenu: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      openMobileMenu: () => set({ mobileOpen: true }),
      closeMobileMenu: () => set({ mobileOpen: false }),
    }),
    {
      name: 'navigation-state',
      partialize: (state) => ({ collapsed: state.collapsed }), // Only persist collapsed state
    }
  )
)

// Navigation items configuration
export interface NavItem {
  label: string
  route: string // Relative path (e.g., 'dashboard', 'contacts')
  icon: string
  section: SectionKey // Maps to permission section key
  exact?: boolean
}

// Routes are relative - they will be prefixed with /org/{orgId}/team/{teamId}
export const NAV_ITEMS: NavItem[] = [
  { label: 'My Dashboard', route: 'dashboard', icon: 'LayoutDashboard', section: 'dashboard', exact: true },
  { label: 'My Pay & Time', route: 'pay-time', icon: 'Wallet', section: 'pay_time' },
  { label: 'Team Dashboard', route: 'team', icon: 'Users', section: 'team' },
  { label: 'Whiteboard', route: 'whiteboard', icon: 'Kanban', section: 'whiteboard' },
  { label: 'Contact Hub', route: 'contacts', icon: 'Contact', section: 'contacts' },
  { label: 'Employee Sentinel', route: 'employees', icon: 'UserCog', section: 'employees' },
  { label: 'Transaction Guardian', route: 'transactions', icon: 'Shield', section: 'transactions' },
  { label: 'Calendar', route: 'calendar', icon: 'Calendar', section: 'calendar' },
  { label: 'Reports', route: 'reports', icon: 'BarChart3', section: 'reports' },
  { label: 'Settings', route: 'settings', icon: 'Settings', section: 'settings' },
]
