import { useState, useEffect, useMemo } from 'react'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addUserToTeam, removeUserFromTeam } from '@/lib/orgService'
import type { TeamWithMemberCount, TeamMembershipInfo } from '@/types/org-member.types'
import type { PermissionLevel } from '@/types/team-member.types'

interface UserInfo {
  id: string
  user_id: string
  user: {
    id: string
    email: string
    full_name: string | null
  }
  teams: TeamMembershipInfo[]
}

interface ManageTeamsModalProps {
  open: boolean
  user: UserInfo | null
  orgTeams: TeamWithMemberCount[]
  onClose: () => void
  onUpdated: () => void
}

export function ManageTeamsModal({
  open,
  user,
  orgTeams,
  onClose,
  onUpdated,
}: ManageTeamsModalProps) {
  const [loading, setLoading] = useState<string | null>(null) // Track which team is loading
  const [pendingPermissions, setPendingPermissions] = useState<Record<string, PermissionLevel>>({})

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setPendingPermissions({})
    }
  }, [open])

  // Build a map of team memberships for quick lookup
  // Must be called before any early returns to satisfy Rules of Hooks
  const userTeamsMap = useMemo(() => {
    const map = new Map<string, TeamMembershipInfo>()
    if (user) {
      user.teams.forEach((t) => map.set(t.team_id, t))
    }
    return map
  }, [user?.teams])

  if (!user) return null

  const userName = user.user.full_name || user.user.email

  const isInTeam = (teamId: string) => userTeamsMap.has(teamId)
  const getTeamMembership = (teamId: string) => userTeamsMap.get(teamId)

  const handleToggleTeam = async (teamId: string, teamName: string, currentlyIn: boolean) => {
    setLoading(teamId)
    try {
      if (currentlyIn) {
        // Remove from team
        await removeUserFromTeam(teamId, user.user_id)
        toast.success(`Removed ${userName} from ${teamName}`)
      } else {
        // Add to team with selected permission (default to 'member')
        const permission = pendingPermissions[teamId] || 'member'
        await addUserToTeam(teamId, user.user_id, permission)
        toast.success(`Added ${userName} to ${teamName}`)
      }
      // Refresh data but keep modal open
      onUpdated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update team access')
    } finally {
      setLoading(null)
    }
  }

  const handlePermissionChange = (teamId: string, permission: PermissionLevel) => {
    setPendingPermissions((prev) => ({ ...prev, [teamId]: permission }))
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Team Access</DialogTitle>
          <DialogDescription>
            Toggle team access for{' '}
            <span className="font-medium text-foreground">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
          {orgTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No teams in this organization
            </p>
          ) : (
            orgTeams.map((team) => {
              const inTeam = isInTeam(team.id)
              const membership = getTeamMembership(team.id)
              const isLoading = loading === team.id

              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    inTeam ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch
                      checked={inTeam}
                      onCheckedChange={() => handleToggleTeam(team.id, team.name, inTeam)}
                      disabled={isLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{team.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : inTeam ? (
                      // Show current permission level (read-only for now)
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        {membership?.permission_level || 'member'}
                      </span>
                    ) : (
                      // Show permission selector for adding
                      <Select
                        value={pendingPermissions[team.id] || 'member'}
                        onValueChange={(v) => handlePermissionChange(team.id, v as PermissionLevel)}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
