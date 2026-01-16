import { useState } from 'react'
import { UserPlus, Users, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTeamContext } from '@/hooks/useTeamContext'
import { MemberList, type MemberWithDetails } from './MemberList'
import { PendingInvitations } from './PendingInvitations'
import { JoinLinkSettings } from './JoinLinkSettings'
import { InviteMemberModal } from '@/components/shared/InviteMemberModal'
import { EditMemberModal } from '@/components/shared/EditMemberModal'
import { RemoveMemberDialog } from '@/components/shared/RemoveMemberDialog'

export function TeamMembersSection() {
  const { context, isAdmin } = useTeamContext()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberWithDetails | null>(null)
  const [removingMember, setRemovingMember] = useState<MemberWithDetails | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInvited = () => {
    setShowInviteModal(false)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleUpdated = () => {
    setEditingMember(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleRemoved = () => {
    setRemovingMember(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  if (!context) return null

  return (
    <div className="space-y-6">
      {/* Team Members Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to {context.team.name}
              </CardDescription>
            </div>
          </div>
          {isAdmin() && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <MemberList
            onEdit={setEditingMember}
            onRemove={setRemovingMember}
            refreshTrigger={refreshTrigger}
          />
        </CardContent>
      </Card>

      {/* Pending Invitations Card (Admin Only) */}
      {isAdmin() && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations waiting to be accepted
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PendingInvitations refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>
      )}

      {/* Join Link Settings (Admin Only) */}
      {isAdmin() && (
        <JoinLinkSettings refreshTrigger={refreshTrigger} />
      )}

      {/* Modals */}
      <InviteMemberModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvited={handleInvited}
      />

      <EditMemberModal
        open={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onUpdated={handleUpdated}
      />

      <RemoveMemberDialog
        open={!!removingMember}
        member={removingMember}
        onClose={() => setRemovingMember(null)}
        onRemoved={handleRemoved}
      />
    </div>
  )
}
