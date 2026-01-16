import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, ChevronDown, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTeamContext } from '@/hooks/useTeamContext'
import { useAuth } from '@/hooks/useAuth'
import { CreateTeamModal } from '@/components/shared/CreateTeamModal'
import type { TeamSwitcherItem } from '@/types'

interface GroupedTeams {
  orgId: string
  orgName: string
  teams: TeamSwitcherItem[]
}

export function TeamSwitcher() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { context, availableTeams, loadAvailableTeams, isAdmin } = useTeamContext()
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Group teams by organization
  const groupedTeams = useMemo<GroupedTeams[]>(() => {
    const groups = new Map<string, GroupedTeams>()

    for (const team of availableTeams) {
      if (!groups.has(team.org_id)) {
        groups.set(team.org_id, {
          orgId: team.org_id,
          orgName: team.org_name,
          teams: [],
        })
      }
      groups.get(team.org_id)!.teams.push(team)
    }

    return Array.from(groups.values())
  }, [availableTeams])

  // Handle team selection
  const handleSelectTeam = (team: TeamSwitcherItem) => {
    // Don't reload if already on this team
    if (team.team_id === context?.team.id) return

    // Navigate to the selected team's dashboard
    navigate(`/org/${team.org_id}/team/${team.team_id}/dashboard`)
  }

  // Check if a team is the current team
  const isCurrentTeam = (teamId: string) => {
    return context?.team.id === teamId
  }

  // Refresh available teams when dropdown opens
  const handleOpenChange = (open: boolean) => {
    if (open && user) {
      loadAvailableTeams(user.id)
    }
  }

  // Handle team creation success
  const handleTeamCreated = (orgId: string, teamId: string) => {
    setShowCreateModal(false)
    // Navigate to the new team
    navigate(`/org/${orgId}/team/${teamId}/dashboard`)
  }

  // Don't render if no context
  if (!context) return null

  return (
    <>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 h-9">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground max-w-[100px] truncate">
                {context.organization.name}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium max-w-[120px] truncate">
                {context.team.name}
              </span>
            </div>
            {/* Mobile: show only team name */}
            <span className="sm:hidden font-medium text-sm max-w-[120px] truncate">
              {context.team.name}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72">
          {groupedTeams.map((group, groupIndex) => (
            <div key={group.orgId}>
              {/* Organization header */}
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                <Building2 className="h-3 w-3" />
                {group.orgName}
              </DropdownMenuLabel>

              {/* Teams in this organization */}
              {group.teams.map((team) => (
                <DropdownMenuItem
                  key={team.team_id}
                  onClick={() => handleSelectTeam(team)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className={isCurrentTeam(team.team_id) ? 'font-medium' : ''}>
                      {team.team_name}
                    </span>
                  </div>
                  {isCurrentTeam(team.team_id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}

              {/* Separator between orgs (not after last one) */}
              {groupIndex < groupedTeams.length - 1 && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}

          {/* Create Team option (admin only) */}
          {isAdmin() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 text-primary cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create New Team
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleTeamCreated}
        orgId={context.organization.id}
        orgName={context.organization.name}
      />
    </>
  )
}
