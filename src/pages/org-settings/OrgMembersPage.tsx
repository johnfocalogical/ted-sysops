import { useState, useEffect, useMemo } from 'react'
import { Loader2, Search, Shield, Users, Settings2, ShieldCheck, ShieldX, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOrgContext } from '@/hooks/useOrgContext'
import {
  getAllOrgUsers,
  getOrganizationTeams,
  makeOrgOwner,
  removeOrgOwner,
  getOwnerCount,
} from '@/lib/orgService'
import { ManageTeamsModal } from '@/components/shared/ManageTeamsModal'
import type { OrgMemberWithTeams, TeamWithMemberCount } from '@/types/org-member.types'

export function OrgMembersPage() {
  const { organization } = useOrgContext()
  const [members, setMembers] = useState<OrgMemberWithTeams[]>([])
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterOwners, setFilterOwners] = useState<string>('all')

  // Owner confirmation modal
  const [ownerModalOpen, setOwnerModalOpen] = useState(false)
  const [ownerAction, setOwnerAction] = useState<'make' | 'remove'>('make')
  const [targetMember, setTargetMember] = useState<OrgMemberWithTeams | null>(null)
  const [ownerActionLoading, setOwnerActionLoading] = useState(false)

  // Manage teams modal
  const [manageTeamsOpen, setManageTeamsOpen] = useState(false)
  const [managingMember, setManagingMember] = useState<OrgMemberWithTeams | null>(null)

  const loadData = async () => {
    if (!organization) return

    setLoading(true)
    try {
      const [membersData, teamsData] = await Promise.all([
        getAllOrgUsers(organization.id),
        getOrganizationTeams(organization.id),
      ])
      setMembers(membersData)
      setTeams(teamsData)
    } catch (error) {
      toast.error('Failed to load members')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [organization?.id])

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = member.user.full_name?.toLowerCase().includes(query)
        const matchesEmail = member.user.email.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail) return false
      }

      // Team filter
      if (filterTeam !== 'all') {
        const inTeam = member.teams.some((t) => t.team_id === filterTeam)
        if (!inTeam) return false
      }

      // Owner filter
      if (filterOwners === 'owners' && !member.is_owner) return false
      if (filterOwners === 'members' && member.is_owner) return false

      return true
    })
  }, [members, searchQuery, filterTeam, filterOwners])

  const handleMakeOwner = (member: OrgMemberWithTeams) => {
    setTargetMember(member)
    setOwnerAction('make')
    setOwnerModalOpen(true)
  }

  const handleRemoveOwner = (member: OrgMemberWithTeams) => {
    setTargetMember(member)
    setOwnerAction('remove')
    setOwnerModalOpen(true)
  }

  const handleManageTeams = (member: OrgMemberWithTeams) => {
    setManagingMember(member)
    setManageTeamsOpen(true)
  }

  const handleTeamsUpdated = async () => {
    // Reload data and update the managing member with fresh data
    if (!organization || !managingMember) return

    try {
      const [membersData, teamsData] = await Promise.all([
        getAllOrgUsers(organization.id),
        getOrganizationTeams(organization.id),
      ])
      setMembers(membersData)
      setTeams(teamsData)

      // Update the managing member with fresh data (keep modal open)
      const freshMember = membersData.find((m) => m.user_id === managingMember.user_id)
      if (freshMember) {
        setManagingMember(freshMember)
      }
    } catch (error) {
      console.error('Failed to reload data:', error)
    }
  }

  const handleOwnerConfirm = async () => {
    if (!targetMember || !organization) return

    setOwnerActionLoading(true)
    try {
      if (ownerAction === 'make') {
        await makeOrgOwner(organization.id, targetMember.user_id)
        toast.success(`${targetMember.user.full_name || targetMember.user.email} is now an owner`)
      } else {
        // Check if this would leave no owners
        const count = await getOwnerCount(organization.id)
        if (count <= 1) {
          toast.error('Cannot remove the last owner')
          return
        }
        await removeOrgOwner(organization.id, targetMember.user_id)
        toast.success(`${targetMember.user.full_name || targetMember.user.email} is no longer an owner`)
      }
      setOwnerModalOpen(false)
      setTargetMember(null)
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update owner status')
    } finally {
      setOwnerActionLoading(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Organization Members</h2>
        <p className="text-muted-foreground">
          View and manage all members across your organization
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterOwners} onValueChange={setFilterOwners}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="owners">Owners Only</SelectItem>
            <SelectItem value="members">Non-Owners</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {members.length === 0
                  ? 'No members in this organization yet.'
                  : 'No members match your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.user.full_name, member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {member.user.full_name || member.user.email}
                        </span>
                        {member.user_id === organization?.owner_id && (
                          <Badge className="bg-primary/10 text-primary border-primary/30">
                            <Crown className="h-3 w-3 mr-1" />
                            Creator
                          </Badge>
                        )}
                        {member.is_owner && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                            <Shield className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Teams:
                        </span>
                        {member.teams.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No teams</span>
                        ) : (
                          member.teams.map((team) => (
                            <Badge
                              key={team.team_id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {team.team_name}
                              <span className="ml-1 text-muted-foreground">
                                ({team.permission_level})
                              </span>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManageTeams(member)}
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      Manage Teams
                    </Button>
                    {member.is_owner ? (
                      member.user_id === organization?.owner_id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="text-muted-foreground cursor-not-allowed"
                          title="Cannot remove the organization creator"
                        >
                          <ShieldX className="mr-2 h-4 w-4" />
                          Remove Owner
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOwner(member)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <ShieldX className="mr-2 h-4 w-4" />
                          Remove Owner
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMakeOwner(member)}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Make Owner
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Owner Confirmation Modal */}
      <Dialog open={ownerModalOpen} onOpenChange={setOwnerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ownerAction === 'make' ? 'Make Organization Owner' : 'Remove Organization Owner'}
            </DialogTitle>
            <DialogDescription>
              {ownerAction === 'make' ? (
                <>
                  Make{' '}
                  <span className="font-medium">
                    {targetMember?.user.full_name || targetMember?.user.email}
                  </span>{' '}
                  an owner of this organization?
                </>
              ) : (
                <>
                  Remove{' '}
                  <span className="font-medium">
                    {targetMember?.user.full_name || targetMember?.user.email}
                  </span>{' '}
                  as an owner of this organization?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {ownerAction === 'make' ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Organization owners can:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Manage all teams in the organization</li>
                  <li>Add and remove other org owners</li>
                  <li>Access organization settings</li>
                  <li>Delete the organization</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  They will remain a member and keep their team memberships, but will no longer be
                  able to manage organization settings.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOwnerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOwnerConfirm}
              disabled={ownerActionLoading}
              variant={ownerAction === 'remove' ? 'destructive' : 'default'}
            >
              {ownerActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {ownerAction === 'make' ? 'Make Owner' : 'Remove Owner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Teams Modal */}
      <ManageTeamsModal
        open={manageTeamsOpen}
        user={managingMember}
        orgTeams={teams}
        onClose={() => {
          setManageTeamsOpen(false)
          setManagingMember(null)
        }}
        onUpdated={handleTeamsUpdated}
      />
    </div>
  )
}
