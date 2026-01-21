import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTeamContext } from '@/hooks/useTeamContext'
import type { SectionKey } from '@/types/role.types'

interface SectionAccessGuardProps {
  section: SectionKey
  children: React.ReactNode
}

// Map section keys to display names for error messages
export const SECTION_DISPLAY_NAMES: Record<SectionKey, string> = {
  inbox: 'Inbox',
  dashboard: 'Dashboard',
  pay_time: 'Pay & Time',
  team: 'Team Dashboard',
  whiteboard: 'Whiteboard',
  contacts: 'Contact Hub',
  employees: 'Employee Sentinel',
  transactions: 'Transaction Guardian',
  calendar: 'Calendar',
  reports: 'Reports',
  settings: 'Settings',
}

export function SectionAccessGuard({ section, children }: SectionAccessGuardProps) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { context, loading, canAccess } = useTeamContext()

  // Still loading context
  if (loading || !context) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check if user can access this section
  if (!canAccess(section)) {
    // Redirect to access denied page with section info
    return (
      <Navigate
        to={`/org/${orgId}/team/${teamId}/access-denied`}
        state={{ section, sectionName: SECTION_DISPLAY_NAMES[section] }}
        replace
      />
    )
  }

  // User has access, render the children
  return <>{children}</>
}
