import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, List, Kanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useAuth } from '@/hooks/useAuth'
import { useDealStore } from '@/hooks/useDealStore'
import { updateDeal } from '@/lib/dealService'
import { getTeamMembersForMentions } from '@/lib/activityLogService'
import { toast } from 'sonner'
import { WhiteboardMetricCards } from '@/components/deals/WhiteboardMetricCards'
import { DealFilters } from '@/components/deals/DealFilters'
import { DealListView } from '@/components/deals/DealListView'
import { DealKanbanView } from '@/components/deals/DealKanbanView'
import { CreateDealModal } from '@/components/deals/CreateDealModal'
import type { DealStatus } from '@/types/deal.types'

type ViewMode = 'list' | 'kanban'

export function Whiteboard() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const { user } = useAuth()
  const { hasFullAccess } = useTeamContext()
  const canEdit = hasFullAccess('whiteboard')

  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [teamMembers, setTeamMembers] = useState<
    { id: string; full_name: string | null; email: string }[]
  >([])
  const [metricsKey, setMetricsKey] = useState(0)

  const {
    deals,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    search,
    statusFilter,
    dealTypeFilter,
    ownerFilter,
    sortColumn,
    sortDirection,
    setTeamId,
    loadDeals,
    setPage,
    setSearch,
    setStatusFilter,
    setDealTypeFilter,
    setOwnerFilter,
    setSort,
  } = useDealStore()

  // Initialize store with team ID and load data
  useEffect(() => {
    if (teamId) {
      setTeamId(teamId)
      loadDeals()
    }
  }, [teamId, setTeamId, loadDeals])

  // Load team members for owner filter
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

  // Handle metric card status filter click
  const handleStatusCardClick = useCallback(
    (status: DealStatus | null) => {
      if (status === null) {
        setStatusFilter([])
      } else {
        setStatusFilter([status])
      }
    },
    [setStatusFilter]
  )

  // Handle Kanban drag-to-change-status
  const handleKanbanStatusChange = useCallback(
    async (dealId: string, newStatus: DealStatus) => {
      if (!canEdit) {
        toast.error('You do not have permission to change deal status')
        return
      }
      try {
        await updateDeal(dealId, { status: newStatus })
        toast.success('Deal status updated')
        loadDeals()
        setMetricsKey((k) => k + 1)
      } catch (err) {
        console.error('Error updating deal status:', err)
        toast.error('Failed to update deal status')
      }
    },
    [canEdit, loadDeals]
  )

  const handleDealCreated = useCallback(() => {
    loadDeals()
    setMetricsKey((k) => k + 1)
  }, [loadDeals])

  // Determine active status from metric card selection
  const activeMetricStatus = statusFilter.length === 1 ? statusFilter[0] : null

  if (!teamId || !orgId || !user) return null

  return (
    <div>
      <PageHeader
        title="Whiteboard"
        subtitle="Manage your deal pipeline"
        actions={
          canEdit ? (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          ) : undefined
        }
      />

      {/* Metric Cards */}
      <WhiteboardMetricCards
        key={metricsKey}
        teamId={teamId}
        activeStatus={activeMetricStatus}
        onStatusClick={handleStatusCardClick}
      />

      {/* Filters */}
      <DealFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dealTypeFilter={dealTypeFilter}
        onDealTypeFilterChange={setDealTypeFilter}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        teamMembers={teamMembers}
      />

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button
          variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('kanban')}
        >
          <Kanban className="h-4 w-4 mr-2" />
          Kanban
        </Button>
      </div>

      {/* Deal Views */}
      {viewMode === 'list' ? (
        <DealListView
          deals={deals}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={setSort}
          onPageChange={setPage}
          orgId={orgId}
          teamId={teamId}
        />
      ) : (
        <DealKanbanView
          deals={deals}
          loading={loading}
          onStatusChange={handleKanbanStatusChange}
          orgId={orgId}
          teamId={teamId}
        />
      )}

      {/* Create Deal Modal */}
      {canEdit && (
        <CreateDealModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          teamId={teamId}
          orgId={orgId}
          userId={user.id}
          onDealCreated={handleDealCreated}
        />
      )}
    </div>
  )
}
