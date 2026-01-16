import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Users, Users2, Loader2, LogIn } from 'lucide-react'
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
import { getOrganizationDetails, getImpersonationUrl, type OrganizationWithDetails } from '@/lib/adminService'
import { toast } from 'sonner'

export function AdminOrgDetails() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [org, setOrg] = useState<OrganizationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrg = async () => {
      if (!orgId) return

      setLoading(true)
      try {
        const orgData = await getOrganizationDetails(orgId)
        setOrg(orgData)
      } catch (err) {
        console.error('Error loading organization:', err)
        toast.error('Failed to load organization details')
      } finally {
        setLoading(false)
      }
    }

    loadOrg()
  }, [orgId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleEnterTeam = (teamId: string) => {
    if (!orgId) return
    const url = getImpersonationUrl(orgId, teamId)
    navigate(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Organization not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/organizations')}>
          Back to Organizations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/admin/organizations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Link>
      </Button>

      {/* Org Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{org.name}</CardTitle>
                <CardDescription>{org.slug}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <Users2 className="h-3 w-3" />
                {org._count?.teams || 0} teams
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {org._count?.members || 0} members
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Org Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Organization ID</p>
              <p className="font-mono text-sm">{org.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{formatDate(org.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">
                {org.owner?.full_name || org.owner?.email?.split('@')[0]}
              </p>
              <p className="text-sm text-muted-foreground">{org.owner?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" />
            Teams
          </CardTitle>
          <CardDescription>
            Teams within this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {org.teams && org.teams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground">{team.slug}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEnterTeam(team.id)}
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
              This organization has no teams
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
