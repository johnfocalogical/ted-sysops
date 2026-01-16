import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Users2, Building2, Loader2, LogIn, Users, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getTeamDetails, getImpersonationUrl, type TeamWithDetails } from '@/lib/adminService'
import { toast } from 'sonner'

type TeamMember = {
  permission_level: string
  user: {
    id: string
    full_name: string | null
    email: string
  }
  role: {
    id: string
    name: string
  } | null
}

export function AdminTeamDetails() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<(TeamWithDetails & { members: TeamMember[] }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTeam = async () => {
      if (!teamId) return

      setLoading(true)
      try {
        const teamData = await getTeamDetails(teamId)
        setTeam(teamData as (TeamWithDetails & { members: TeamMember[] }) | null)
      } catch (err) {
        console.error('Error loading team:', err)
        toast.error('Failed to load team details')
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [teamId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleEnterTeam = () => {
    if (!team) return
    const url = getImpersonationUrl(team.org_id, team.id)
    navigate(url)
  }

  const getPermissionBadgeVariant = (level: string) => {
    switch (level) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Team not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/teams')}>
          Back to Teams
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/admin/teams">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Link>
      </Button>

      {/* Team Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <CardDescription>{team.slug}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {team._count?.members || 0} members
              </Badge>
              <Button onClick={handleEnterTeam}>
                <LogIn className="h-4 w-4 mr-2" />
                Enter Team
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Team ID</p>
              <p className="font-mono text-sm">{team.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{formatDate(team.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <Link
                to={`/admin/organizations/${team.organization.id}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {team.organization.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Join Code</p>
              <p className="font-mono text-sm">
                {team.join_code_enabled ? team.join_code || 'Not set' : 'Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            All members of this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {team.members && team.members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permission Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {(member.user?.full_name || member.user?.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {member.user?.full_name || member.user?.email?.split('@')[0]}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.role ? (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {member.role.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No role</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPermissionBadgeVariant(member.permission_level)}>
                        {member.permission_level}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              This team has no members
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
