import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { DealCalendar } from '@/components/calendar/DealCalendar'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface TeamMemberOption {
  id: string
  name: string
}

export function CalendarPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([])

  useEffect(() => {
    if (!supabase || !teamId) return

    let cancelled = false

    async function load() {
      const { data, error } = await supabase!
        .from('team_members')
        .select(`
          user_id,
          user:users!inner (
            id,
            full_name
          )
        `)
        .eq('team_id', teamId!)

      if (cancelled || error) {
        if (error) console.error('Failed to load team members:', error)
        return
      }

      const members: TeamMemberOption[] = (data ?? []).map((row: Record<string, unknown>) => {
        const u = row.user as { id: string; full_name: string | null }
        return {
          id: u.id,
          name: u.full_name ?? 'Unknown',
        }
      })

      setTeamMembers(members)
    }

    load()
    return () => { cancelled = true }
  }, [teamId])

  if (!orgId || !teamId || !user) {
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Deal events and important dates"
      />

      <DealCalendar
        teamId={teamId}
        userId={user.id}
        orgId={orgId}
        teamMembers={teamMembers}
      />
    </div>
  )
}
