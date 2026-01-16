import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Loader2, Users, Building2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUserDetails, setSuperadminStatus, type UserWithMemberships } from '@/lib/adminService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { PermissionLevel } from '@/types/team-member.types'

const permissionBadgeStyles: Record<PermissionLevel, string> = {
  admin: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  member: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

export function AdminUserDetails() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<UserWithMemberships | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return

      setLoading(true)
      try {
        const userData = await getUserDetails(userId)
        setUser(userData)
      } catch (err) {
        console.error('Error loading user:', err)
        toast.error('Failed to load user details')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [userId])

  const handleSuperadminToggle = async (checked: boolean) => {
    if (!userId || !user) return

    // Prevent toggling own superadmin status
    if (userId === currentUser?.id) {
      toast.error("You cannot change your own superadmin status")
      return
    }

    setUpdating(true)
    try {
      await setSuperadminStatus(userId, checked)
      setUser({ ...user, is_superadmin: checked })
      toast.success(checked ? 'User is now a superadmin' : 'Superadmin access removed')
    } catch (err) {
      console.error('Error updating superadmin status:', err)
      toast.error('Failed to update superadmin status')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </div>
    )
  }

  const isCurrentUser = userId === currentUser?.id

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                {(user.full_name || user.email).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {user.full_name || user.email.split('@')[0]}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            {user.is_superadmin && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Superadmin
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p>{formatDate(user.created_at)}</p>
            </div>
          </div>

          {/* Superadmin Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
              <div>
                <Label htmlFor="superadmin-toggle" className="font-medium">
                  Superadmin Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  Grant full platform administration privileges
                </p>
              </div>
            </div>
            <Switch
              id="superadmin-toggle"
              checked={user.is_superadmin}
              onCheckedChange={handleSuperadminToggle}
              disabled={updating || isCurrentUser}
            />
          </div>

          {isCurrentUser && (
            <p className="text-sm text-muted-foreground text-center">
              You cannot modify your own superadmin status
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Memberships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Memberships
          </CardTitle>
          <CardDescription>
            Teams this user belongs to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.team_members && user.team_members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.team_members.map((membership, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {membership.team.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {membership.team.organization.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {membership.role?.name || (
                        <span className="text-muted-foreground">No role</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={permissionBadgeStyles[membership.permission_level]}
                      >
                        {membership.permission_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        title="Impersonation coming soon"
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Enter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              This user is not a member of any teams
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
