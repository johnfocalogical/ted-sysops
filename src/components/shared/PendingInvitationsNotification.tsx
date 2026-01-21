import { useState, useEffect } from 'react'
import { Bell, Loader2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface PendingInvitation {
  id: string
  permission_level: 'admin' | 'member' | 'viewer'
  expires_at: string
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

export function PendingInvitationsNotification() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

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
      } catch (err) {
        console.error('Error loading invitations:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInvitations()

    // Set up realtime subscription for new invitations
    if (supabase && user?.email) {
      const channel = supabase
        .channel('user-invitations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_invitations',
          },
          () => {
            loadInvitations() // Reload on any change
          }
        )
        .subscribe()

      return () => {
        if (supabase) {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [user?.email])

  const handleViewInvitation = (invitationId: string) => {
    setOpen(false)
    navigate(`/invite/${invitationId}`)
  }

  const count = invitations.length

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground border-0"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b border-border">
          <h4 className="font-semibold">Notifications</h4>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No pending invitations
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-3 border-b border-border last:border-0 hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Team Invitation</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Join <span className="font-medium">{invitation.team.name}</span> at{' '}
                      {invitation.team.organization.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {invitation.inviter?.full_name || 'Team Admin'}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => handleViewInvitation(invitation.id)}
                  >
                    View & Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
