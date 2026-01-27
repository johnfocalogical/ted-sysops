import { useState } from 'react'
import { TeamMetricCards } from './TeamMetricCards'
import { OverviewFilterBar } from './OverviewFilterBar'
import { DepartmentBreakdown } from './DepartmentBreakdown'
import { LeaderboardPlaceholder } from './LeaderboardPlaceholder'
import { EmployeeComparisonPlaceholder } from './EmployeeComparisonPlaceholder'
import { WorkloadPlaceholder } from './WorkloadPlaceholder'
import type { EmployeeListItem } from '@/types/employee.types'
import type { Department } from '@/types/employee.types'

interface TeamOverviewTabProps {
  employees: EmployeeListItem[]
  departments: Department[]
  total: number
  teamId: string
  loading: boolean
}

export function TeamOverviewTab({
  employees,
  departments,
  total,
  teamId,
  loading,
}: TeamOverviewTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('ytd')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)

  const activeMembers = employees.filter((e) => e.status === 'active').length

  return (
    <div className="space-y-6">
      <OverviewFilterBar
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        onDepartmentChange={setSelectedDepartmentId}
      />

      <TeamMetricCards
        totalMembers={total}
        activeMembers={activeMembers}
        loading={loading}
      />

      <DepartmentBreakdown
        teamId={teamId}
        totalEmployees={total}
        selectedDepartmentId={selectedDepartmentId}
      />

      <LeaderboardPlaceholder />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmployeeComparisonPlaceholder />
        <WorkloadPlaceholder />
      </div>
    </div>
  )
}
