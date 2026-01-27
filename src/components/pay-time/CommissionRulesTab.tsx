import { CommissionRulesSection } from '@/components/commissions/CommissionRulesSection'

interface CommissionRulesTabProps {
  employeeProfileId: string
  teamId: string
}

export function CommissionRulesTab({ employeeProfileId, teamId }: CommissionRulesTabProps) {
  return (
    <CommissionRulesSection
      employeeProfileId={employeeProfileId}
      teamId={teamId}
      isAdmin={false}
    />
  )
}
