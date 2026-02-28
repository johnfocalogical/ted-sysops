import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DealHeader } from '@/components/deals/DealHeader'
import { DealTabs } from '@/components/deals/DealTabs'
import { DealSidebar } from '@/components/deals/DealSidebar'
import { getDealById, updateDeal, deleteDeal, getDealEmployees, getDealVendors } from '@/lib/dealService'
import { getTeamMembersForMentions } from '@/lib/activityLogService'
import { getDealTPT, subscribeToInstanceUpdates } from '@/lib/automatorInstanceService'
import { toast } from 'sonner'
import type { DealWithDetails, DealStatus, UpdateDealDTO, DealEmployeeWithUser, DealVendorWithDetails } from '@/types/deal.types'

export function DealDetailPage() {
  const { orgId, teamId, dealId } = useParams<{
    orgId: string
    teamId: string
    dealId: string
  }>()
  const navigate = useNavigate()

  const [deal, setDeal] = useState<DealWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<UpdateDealDTO>({})

  const [teamMembers, setTeamMembers] = useState<
    { id: string; full_name: string | null; email: string }[]
  >([])

  // Tab state
  const [activeMainTab, setActiveMainTab] = useState('deal-info')
  const [activeSidebarTab, setActiveSidebarTab] = useState('checklist')
  const [checklistTpt, setChecklistTpt] = useState(0)
  const [automatorTpt, setAutomatorTpt] = useState<number | null>(null)

  // Employee/vendor state for header display
  const [employees, setEmployees] = useState<DealEmployeeWithUser[]>([])
  const [vendors, setVendors] = useState<DealVendorWithDetails[]>([])

  // Load deal data
  useEffect(() => {
    const loadDeal = async () => {
      if (!dealId) return

      setLoading(true)
      setError(null)

      try {
        const data = await getDealById(dealId)
        if (!data) {
          setError('Deal not found')
        } else {
          setDeal(data)
        }
      } catch (err) {
        console.error('Error loading deal:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deal')
      } finally {
        setLoading(false)
      }
    }

    loadDeal()
  }, [dealId])

  // Load employees and vendors for header display
  useEffect(() => {
    if (!dealId) return
    getDealEmployees(dealId)
      .then(setEmployees)
      .catch((err) => console.error('Error loading deal employees:', err))
    getDealVendors(dealId)
      .then(setVendors)
      .catch((err) => console.error('Error loading deal vendors:', err))
  }, [dealId])

  // Callback when EmployeeTab changes assignments — refresh header data
  const handleAssignmentChange = useCallback(() => {
    if (!dealId) return
    getDealEmployees(dealId)
      .then(setEmployees)
      .catch((err) => console.error('Error refreshing employees:', err))
    getDealVendors(dealId)
      .then(setVendors)
      .catch((err) => console.error('Error refreshing vendors:', err))
  }, [dealId])

  // Load automator TPT and subscribe to instance updates
  useEffect(() => {
    if (!dealId) return

    const loadAutomatorTpt = () => {
      getDealTPT(dealId)
        .then((tpt) => setAutomatorTpt(tpt > 0 ? tpt : null))
        .catch((err) => console.error('Error loading automator TPT:', err))
    }

    loadAutomatorTpt()

    const unsubscribe = subscribeToInstanceUpdates(dealId, () => {
      loadAutomatorTpt()
    })

    return unsubscribe
  }, [dealId])

  // Combined TPT: prefer automator TPT when instances exist, else checklist TPT
  const tptProgress = automatorTpt ?? checklistTpt

  // Load team members
  useEffect(() => {
    if (!teamId) return
    getTeamMembersForMentions(teamId)
      .then((members) =>
        setTeamMembers(
          members.map((m) => ({
            id: m.id,
            full_name: m.full_name,
            email: m.email,
          }))
        )
      )
      .catch((err) => console.error('Error loading team members:', err))
  }, [teamId])

  // Apply a pending change locally (optimistic update on the deal object)
  const applyChange = useCallback(
    (changes: UpdateDealDTO) => {
      setPendingChanges((prev) => ({ ...prev, ...changes }))
      setIsDirty(true)
      // Optimistically update the deal for display
      setDeal((prev) => (prev ? { ...prev, ...changes } as DealWithDetails : prev))
    },
    []
  )

  const handleBuyerChange = useCallback(
    (contactId: string | null) => {
      applyChange({ buyer_contact_id: contactId })
    },
    [applyChange]
  )

  const handleStatusChange = useCallback(
    (status: DealStatus) => {
      applyChange({ status })
    },
    [applyChange]
  )

  const handleOwnerChange = useCallback(
    (ownerId: string) => {
      applyChange({ owner_id: ownerId })
      // Update the owner display data
      const member = teamMembers.find((m) => m.id === ownerId)
      if (member && deal) {
        setDeal((prev) =>
          prev
            ? {
                ...prev,
                owner_id: ownerId,
                owner: {
                  id: ownerId,
                  full_name: member.full_name,
                  email: member.email,
                  avatar_url: null,
                },
              }
            : prev
        )
      }
    },
    [applyChange, teamMembers, deal]
  )

  const handleSave = useCallback(async () => {
    if (!dealId || !isDirty) return

    setIsSaving(true)
    try {
      await updateDeal(dealId, pendingChanges)
      setPendingChanges({})
      setIsDirty(false)
      toast.success('Deal saved successfully')

      // Refresh deal data
      const refreshed = await getDealById(dealId)
      if (refreshed) setDeal(refreshed)
    } catch (err) {
      console.error('Error saving deal:', err)
      toast.error('Failed to save deal', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }, [dealId, isDirty, pendingChanges])

  const handleDelete = useCallback(async () => {
    if (!dealId) return

    try {
      await deleteDeal(dealId)
      toast.success('Deal deleted')
      navigate(`/org/${orgId}/team/${teamId}/whiteboard`)
    } catch (err) {
      console.error('Error deleting deal:', err)
      toast.error('Failed to delete deal')
    }
  }, [dealId, orgId, teamId, navigate])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] -mx-6 -mt-6">
        {/* Header skeleton */}
        <div className="shrink-0 border-b bg-background px-6 py-3 space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-6 w-64" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="w-80 border-l p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !deal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h2 className="text-lg font-semibold">{error || 'Deal not found'}</h2>
        <p className="text-muted-foreground text-sm">
          The deal you're looking for may have been deleted or you don't have access.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(`/org/${orgId}/team/${teamId}/whiteboard`)}
        >
          Back to Whiteboard
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mx-6 -mt-6">
      {/* Pinned Header */}
      <DealHeader
        deal={deal}
        teamMembers={teamMembers}
        isDirty={isDirty}
        isSaving={isSaving}
        tptProgress={tptProgress}
        employees={employees}
        vendors={vendors}
        onStatusChange={handleStatusChange}
        onOwnerChange={handleOwnerChange}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Two-panel layout below header */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: Tabbed content (65-70%) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <DealTabs
            deal={deal}
            activeTab={activeMainTab}
            onTabChange={setActiveMainTab}
            onDealUpdated={setDeal}
            onAssignmentChange={handleAssignmentChange}
            onBuyerChange={handleBuyerChange}
          />
        </div>

        {/* Right sidebar (30-35%) — hidden on small screens */}
        <div className="hidden lg:block w-80 xl:w-96 shrink-0">
          <DealSidebar
            dealId={deal.id}
            dealNotes={deal.notes ?? null}
            activeTab={activeSidebarTab}
            onTabChange={setActiveSidebarTab}
            onTptChange={setChecklistTpt}
          />
        </div>
      </div>
    </div>
  )
}
