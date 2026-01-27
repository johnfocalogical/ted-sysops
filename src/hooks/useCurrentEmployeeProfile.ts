import { useState, useEffect } from 'react'
import { useTeamContext } from '@/hooks/useTeamContext'
import { getEmployeeProfileByTeamMemberId } from '@/lib/employeeService'
import type { EmployeeWithDetails } from '@/types/employee.types'

export function useCurrentEmployeeProfile() {
  const { context } = useTeamContext()
  const [profile, setProfile] = useState<EmployeeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!context?.membership?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await getEmployeeProfileByTeamMemberId(context.membership.id)
        setProfile(result)
      } catch (err) {
        console.error('Error loading employee profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to load employee profile')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [context?.membership?.id])

  return { profile, loading, error }
}
