import { useState, useEffect } from 'react'
import { Shield, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTeamContext } from '@/hooks/useTeamContext'
import { getTeamRoles, type RoleWithMemberCount } from '@/lib/roleService'
import { RoleList } from './RoleList'
import { RoleFormModal } from './RoleFormModal'
import { DeleteRoleDialog } from './DeleteRoleDialog'

export function RoleSettingsSection() {
  const { context, isAdmin } = useTeamContext()
  const [roles, setRoles] = useState<RoleWithMemberCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleWithMemberCount | null>(null)
  const [deletingRole, setDeletingRole] = useState<RoleWithMemberCount | null>(null)

  const loadRoles = async () => {
    if (!context) return

    setLoading(true)
    try {
      const data = await getTeamRoles(context.team.id)
      setRoles(data)
    } catch (err) {
      console.error('Error loading roles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [context?.team.id])

  const handleRoleSaved = () => {
    setShowCreateModal(false)
    setEditingRole(null)
    loadRoles()
  }

  const handleRoleDeleted = () => {
    setDeletingRole(null)
    loadRoles()
  }

  if (!context) return null

  // Only admins can manage roles
  if (!isAdmin()) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Team Roles</CardTitle>
              <CardDescription>
                Manage roles and permissions for {context.team.name}
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RoleList
              roles={roles}
              onEdit={setEditingRole}
              onDelete={setDeletingRole}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <RoleFormModal
        open={showCreateModal || !!editingRole}
        role={editingRole}
        onClose={() => {
          setShowCreateModal(false)
          setEditingRole(null)
        }}
        onSaved={handleRoleSaved}
      />

      {/* Delete Dialog */}
      <DeleteRoleDialog
        open={!!deletingRole}
        role={deletingRole}
        onClose={() => setDeletingRole(null)}
        onDeleted={handleRoleDeleted}
      />
    </>
  )
}
