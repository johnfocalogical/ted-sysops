import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox as InboxIcon, Users, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface PendingInvitation {
  id: string
  permission_level: 'admin' | 'member' | 'viewer'
  expires_at: string
  created_at: string
  team: {
    id: string
    name: string
    org_id: string
    organization: {
      name: string
    }
  }
  inviter: {
    full_name: string | null
  } | null
}

const permissionBadgeStyles: Record<string, string> = {
  admin: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  member: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

export function Inbox() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInvitations = async () => {
      if (!supabase || !user?.email) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('team_invitations')
          .select(`
            id,
            permission_level,
            expires_at,
            created_at,
            team:teams!inner (
              id,
              name,
              org_id,
              organization:organizations!inner (name)
            ),
            inviter:users!invited_by (full_name)
          `)
          .eq('email', user.email.toLowerCase())
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (!error && data) {
          setInvitations(data as unknown as PendingInvitation[])
        }
      } finally {
        setLoading(false)
      }
    }

    loadInvitations()
  }, [user?.email])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Manage your messages and notifications"
      />

      {/* Pending Team Invitations */}
      {loading ? (
        <Card className="mb-6">
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : invitations.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Team Invitations</CardTitle>
                <CardDescription>
                  You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{invitation.team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.team.organization.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={permissionBadgeStyles[invitation.permission_level]}
                      >
                        {invitation.permission_level}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Invited by {invitation.inviter?.full_name || 'Team Admin'} on{' '}
                        {formatDate(invitation.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/invite/${invitation.id}`)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    View Invitation
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Empty state for other messages */}
      <Card>
        <CardContent className="py-12 text-center">
          <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
          <p className="text-muted-foreground">Your inbox is empty</p>
        </CardContent>
      </Card>
    </div>
  )
}
