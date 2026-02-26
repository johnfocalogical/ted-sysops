import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { PipelineMetricCards } from '@/components/dashboard/PipelineMetricCards'
import { FinancialSummaryCards } from '@/components/dashboard/FinancialSummaryCards'
import { DeadlinesList } from '@/components/dashboard/DeadlinesList'
import { AutomatorStepsWaiting } from '@/components/dashboard/AutomatorStepsWaiting'
import { StaleDealsList } from '@/components/dashboard/StaleDealsList'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { useDashboardStore } from '@/hooks/useDashboardStore'
import { useTeamContext } from '@/hooks/useTeamContext'
import type { DealStatus } from '@/types/deal.types'

export function MyDashboard() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { context } = useTeamContext()
  const userId = context?.user?.id

  const {
    deadlines,
    myPipeline,
    myFinancials,
    staleDeals,
    loading,
    deadlineDaysAhead,
    loadMyDashboard,
    setDeadlineDaysAhead,
    reset,
  } = useDashboardStore()

  const [revenuePeriod, setRevenuePeriod] = useState<'mtd' | 'qtd'>('mtd')

  // Load dashboard data on mount / team change
  useEffect(() => {
    if (teamId && userId) {
      loadMyDashboard(teamId, userId)
    }
    return () => reset()
  }, [teamId, userId, loadMyDashboard, reset])

  const handleDealClick = (dealId: string) => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/whiteboard?deal=${dealId}`)
    }
  }

  const handleStatusClick = (status: DealStatus) => {
    if (orgId && teamId) {
      navigate(`/org/${orgId}/team/${teamId}/whiteboard?status=${status}`)
    }
  }

  const handleDaysChange = (days: number) => {
    if (teamId && userId) {
      setDeadlineDaysAhead(days, teamId, userId)
    }
  }

  const userName = context?.user?.full_name ?? 'Your'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mission Control"
        subtitle={`${userName}'s personal overview`}
      />

      {/* Section 1: Attention Needed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DeadlinesList
          deadlines={deadlines}
          loading={loading.deadlines}
          daysAhead={deadlineDaysAhead}
          onDaysChange={handleDaysChange}
          onDealClick={handleDealClick}
        />
        <AutomatorStepsWaiting
          teamId={teamId ?? ''}
          userId={userId ?? ''}
          onDealClick={handleDealClick}
          onContinueClick={handleDealClick}
        />
        <StaleDealsList
          staleDeals={staleDeals}
          loading={loading.staleDeals}
          onDealClick={handleDealClick}
        />
      </div>

      {/* Section 2: My Pipeline */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Pipeline</h2>
        <PipelineMetricCards
          data={myPipeline}
          loading={loading.myPipeline}
          onStatusClick={handleStatusClick}
        />
      </div>

      {/* Section 3: My Financials */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Financials</h2>
        <FinancialSummaryCards
          pipelineValue={myFinancials?.pipeline_value}
          closedRevenueMtd={myFinancials?.closed_revenue_mtd}
          closedRevenueQtd={myFinancials?.closed_revenue_qtd}
          estimatedCommissions={myFinancials?.estimated_commissions}
          totalExpenses={myFinancials?.total_expenses}
          loading={loading.myFinancials}
          showRevenuePeriodToggle
          revenuePeriod={revenuePeriod}
          onRevenuePeriodChange={setRevenuePeriod}
        />
      </div>

      {/* Section 4: Recent Activity */}
      <RecentActivityFeed
        teamId={teamId ?? ''}
        userId={userId}
        limit={15}
        onDealClick={handleDealClick}
      />
    </div>
  )
}
