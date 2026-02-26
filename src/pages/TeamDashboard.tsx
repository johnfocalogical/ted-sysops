import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodToggle } from '@/components/dashboard/PeriodToggle'
import { PipelineMetricCards } from '@/components/dashboard/PipelineMetricCards'
import { FinancialSummaryCards } from '@/components/dashboard/FinancialSummaryCards'
import { TeamWorkloadTable } from '@/components/dashboard/TeamWorkloadTable'
import { RecentlyClosedList } from '@/components/dashboard/RecentlyClosedList'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { useDashboardStore } from '@/hooks/useDashboardStore'
import { useTeamContext } from '@/hooks/useTeamContext'
import { usePermissions } from '@/hooks/usePermissions'
import type { DealStatus } from '@/types/deal.types'
import type { DashboardPeriod } from '@/types/dashboard.types'

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  mtd: '(MTD)',
  qtd: '(QTD)',
  ytd: '(YTD)',
}

export function TeamDashboard() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>()
  const navigate = useNavigate()
  const { context } = useTeamContext()
  const { canEdit } = usePermissions('team')

  const {
    teamPipeline,
    teamWorkload,
    teamFinancials,
    recentlyClosed,
    loading,
    teamPeriod,
    loadTeamDashboard,
    setTeamPeriod,
    reset,
  } = useDashboardStore()

  // Load team dashboard data on mount / team change
  useEffect(() => {
    if (teamId) {
      loadTeamDashboard(teamId)
    }
    return () => reset()
  }, [teamId, loadTeamDashboard, reset])

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

  const handlePeriodChange = (period: DashboardPeriod) => {
    if (teamId) {
      setTeamPeriod(period, teamId)
    }
  }

  const teamName = context?.team?.name ?? 'Team'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Overview"
        subtitle={teamName}
        actions={
          <PeriodToggle
            value={teamPeriod}
            onChange={handlePeriodChange}
          />
        }
      />

      {/* Section 1: Pipeline Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Pipeline Overview <span className="text-sm font-normal text-muted-foreground">{PERIOD_LABELS[teamPeriod]}</span>
        </h2>
        <PipelineMetricCards
          data={teamPipeline}
          loading={loading.teamPipeline}
          onStatusClick={handleStatusClick}
          periodLabel={PERIOD_LABELS[teamPeriod]}
        />
      </div>

      {/* Section 2: Team Workload (full access only) */}
      {canEdit ? (
        <TeamWorkloadTable
          workload={teamWorkload}
          loading={loading.teamWorkload}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Lock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Contact your team admin for workload details.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Team Financials */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Team Financials <span className="text-sm font-normal text-muted-foreground">{PERIOD_LABELS[teamPeriod]}</span>
        </h2>
        <FinancialSummaryCards
          pipelineValue={teamFinancials?.pipeline_value}
          closedRevenue={teamFinancials?.closed_revenue}
          totalExpenses={teamFinancials?.total_expenses}
          netProfit={teamFinancials?.net_profit}
          loading={loading.teamFinancials}
        />
      </div>

      {/* Section 4: Recently Closed */}
      <RecentlyClosedList
        deals={recentlyClosed}
        loading={loading.recentlyClosed}
        onDealClick={handleDealClick}
      />

      {/* Section 5: Team Activity */}
      <RecentActivityFeed
        teamId={teamId ?? ''}
        limit={25}
        onDealClick={handleDealClick}
      />
    </div>
  )
}
