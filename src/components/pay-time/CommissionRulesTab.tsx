import { EffectiveCommissionsSection } from '@/components/commissions/EffectiveCommissionsSection'

interface CommissionRulesTabProps {
  employeeProfileId: string
  teamMemberId: string
  teamId: string
  isAdmin: boolean
}

export function CommissionRulesTab({
  employeeProfileId,
  teamMemberId,
  teamId,
  isAdmin,
}: CommissionRulesTabProps) {
  return (
    <EffectiveCommissionsSection
      employeeProfileId={employeeProfileId}
      teamMemberId={teamMemberId}
      teamId={teamId}
      isAdmin={isAdmin}
    />
  )
}
