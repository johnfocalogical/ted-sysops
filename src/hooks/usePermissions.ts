import { useTeamContext } from '@/hooks/useTeamContext'
import type { SectionKey } from '@/types/role.types'

/**
 * Simple hook for checking permissions on a specific section.
 * Provides convenient boolean flags for permission-based UI rendering.
 */
export function usePermissions(section: SectionKey) {
  const { canAccess, hasFullAccess, loading } = useTeamContext()

  return {
    /** Whether the user can view this section at all */
    canView: canAccess(section),
    /** Whether the user can edit content in this section */
    canEdit: hasFullAccess(section),
    /** Whether the user has view-only access (can view but not edit) */
    isViewOnly: canAccess(section) && !hasFullAccess(section),
    /** Whether permission data is still loading */
    loading,
  }
}
