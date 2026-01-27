import { useState, useEffect } from 'react'
import { Loader2, UserX, Eye } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayTimeSummaryCards } from '@/components/pay-time/PayTimeSummaryCards'
import { CommissionRulesTab } from '@/components/pay-time/CommissionRulesTab'
import { EarningsTab } from '@/components/pay-time/EarningsTab'
import { AdminEmployeeSelector } from '@/components/pay-time/AdminEmployeeSelector'
import { ActivityCard } from '@/components/activity/ActivityCard'
import { useCurrentEmployeeProfile } from '@/hooks/useCurrentEmployeeProfile'
import { useTeamContext } from '@/hooks/useTeamContext'
import { getEmployeeProfileById } from '@/lib/employeeService'
import type { EmployeeWithDetails } from '@/types/employee.types'

export function PayTime() {
  const { context, isAdmin } = useTeamContext()
  const { profile: ownProfile, loading: ownLoading, error: ownError } = useCurrentEmployeeProfile()
  const admin = isAdmin()

  // Admin employee switching
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<EmployeeWithDetails | null>(null)
  const [viewingLoading, setViewingLoading] = useState(false)

  // Set default viewing ID once own profile loads
  useEffect(() => {
    if (ownProfile && !viewingEmployeeId) {
      setViewingEmployeeId(ownProfile.id)
    }
  }, [ownProfile, viewingEmployeeId])

  // Load different employee profile when admin switches
  useEffect(() => {
    if (!viewingEmployeeId || !ownProfile) return

    // If viewing own profile, use the already-loaded data
    if (viewingEmployeeId === ownProfile.id) {
      setViewingProfile(null)
      return
    }

    const load = async () => {
      setViewingLoading(true)
      try {
        const result = await getEmployeeProfileById(viewingEmployeeId)
        setViewingProfile(result)
      } catch (err) {
        console.error('Error loading employee profile:', err)
        setViewingProfile(null)
      } finally {
        setViewingLoading(false)
      }
    }

    load()
  }, [viewingEmployeeId, ownProfile])

  const handleEmployeeChange = (employeeId: string) => {
    setViewingEmployeeId(employeeId)
  }

  // Resolve which profile to display
  const activeProfile = viewingProfile || ownProfile
  const isViewingOther = viewingEmployeeId !== null && ownProfile !== null && viewingEmployeeId !== ownProfile.id
  const displayName = activeProfile?.user.full_name || activeProfile?.user.email || 'Employee'

  // Loading state
  if (ownLoading) {
    return (
      <div>
        <PageHeader
          title="My Pay & Time"
          subtitle="Track your compensation and commissions"
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Error state
  if (ownError) {
    return (
      <div>
        <PageHeader
          title="My Pay & Time"
          subtitle="Track your compensation and commissions"
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserX className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Profile</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {ownError}
          </p>
        </div>
      </div>
    )
  }

  // No employee profile found
  if (!ownProfile) {
    return (
      <div>
        <PageHeader
          title="My Pay & Time"
          subtitle="Track your compensation and commissions"
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UserX className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Employee Profile Found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Your account doesn't have an employee profile yet.
            Contact your team admin to set up your employee record.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Pay & Time"
        subtitle="Track your compensation and commissions"
        actions={
          admin && context ? (
            <AdminEmployeeSelector
              currentEmployeeId={viewingEmployeeId || ownProfile.id}
              teamId={context.team.id}
              onEmployeeChange={handleEmployeeChange}
            />
          ) : undefined
        }
      />

      {/* Admin viewing another employee banner */}
      {isViewingOther && activeProfile && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
          <Eye className="h-4 w-4 text-accent" />
          <span>
            Viewing <span className="font-medium">{displayName}</span>'s Pay & Time dashboard
          </span>
          <span className="text-muted-foreground">(Admin View)</span>
        </div>
      )}

      {/* Loading overlay for employee switch */}
      {viewingLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeProfile ? (
        <>
          <PayTimeSummaryCards />

          <Tabs defaultValue="commission-rules">
            <TabsList>
              <TabsTrigger value="commission-rules">Commission Rules</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="commission-rules" className="mt-4">
              <CommissionRulesTab
                employeeProfileId={activeProfile.id}
                teamId={activeProfile.team_id}
              />
            </TabsContent>

            <TabsContent value="earnings" className="mt-4">
              <EarningsTab />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ActivityCard
                entityType="employee"
                entityId={activeProfile.id}
                teamId={activeProfile.team_id}
                employeeName={displayName}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}
