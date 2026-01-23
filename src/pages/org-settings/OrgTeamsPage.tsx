import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Users, Pencil, Trash2, ExternalLink, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOrgContext } from '@/hooks/useOrgContext'
import { getOrganizationTeams, updateTeam, deleteTeam } from '@/lib/orgService'
import { CreateTeamModal } from '@/components/shared/CreateTeamModal'
import type { TeamWithMemberCount } from '@/types/org-member.types'

export function OrgTeamsPage() {
  const navigate = useNavigate()
  const { organization } = useOrgContext()
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithMemberCount | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState<TeamWithMemberCount | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadTeams = async () => {
    if (!organization) return

    setLoading(true)
    try {
      const data = await getOrganizationTeams(organization.id)
      setTeams(data)
    } catch (error) {
      toast.error('Failed to load teams')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [organization?.id])

  const handleEditClick = (team: TeamWithMemberCount) => {
    setEditingTeam(team)
    setEditName(team.name)
    setEditModalOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingTeam || !editName.trim()) return

    setSaving(true)
    try {
      await updateTeam(editingTeam.id, editName.trim())
      toast.success('Team name updated')
      setEditModalOpen(false)
      setEditingTeam(null)
      setEditName('')
      loadTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (team: TeamWithMemberCount) => {
    setDeletingTeam(team)
    setDeleteConfirmation('')
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTeam || deleteConfirmation !== deletingTeam.name) return

    setDeleting(true)
    try {
      await deleteTeam(deletingTeam.id)
      toast.success('Team deleted')
      setDeleteModalOpen(false)
      setDeletingTeam(null)
      setDeleteConfirmation('')
      loadTeams()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete team')
    } finally {
      setDeleting(false)
    }
  }

  const handleEnterTeam = (team: TeamWithMemberCount) => {
    if (!organization) return
    navigate(`/org/${organization.id}/team/${team.id}/dashboard`)
  }

  const handleTeamCreated = () => {
    setCreateModalOpen(false)
    loadTeams()
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-muted-foreground">
            Manage teams in your organization
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {/* Teams List */}
      <div className="space-y-3">
        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No teams yet. Create your first team to get started.</p>
            </CardContent>
          </Card>
        ) : (
          teams.map((team) => (
            <Card key={team.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      </span>
                      <span>
                        Created {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEnterTeam(team)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Enter
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(team)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Team Modal */}
      {organization && (
        <CreateTeamModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          orgId={organization.id}
          onTeamCreated={handleTeamCreated}
        />
      )}

      {/* Edit Team Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Change the team's display name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            {editingTeam && (
              <div className="text-sm text-muted-foreground">
                Slug: {editingTeam.slug} (cannot be changed)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={saving || !editName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Team
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the team
              "{deletingTeam?.name}" and all its data.
            </DialogDescription>
          </DialogHeader>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 my-4">
            <li>Remove all {deletingTeam?.member_count} team member(s)</li>
            <li>Delete all deals, contacts, and data</li>
            <li>Remove all roles and permissions</li>
          </ul>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type "{deletingTeam?.name}" to confirm:
            </label>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={deletingTeam?.name}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setDeletingTeam(null)
                setDeleteConfirmation('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmation !== deletingTeam?.name || deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
