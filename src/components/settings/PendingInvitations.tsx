import { useState, useEffect } from 'react'
import { RefreshCw, X, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { useTeamContext } from '@/hooks/useTeamContext'
import type { PermissionLevel } from '@/types/team-member.types'
import { cn } from '@/lib/utils'

interface InvitationWithDetails {
  id: string
  email: string
  permission_level: PermissionLevel
  role_id: string | null
  expires_at: string
  created_at: string
  role: {
    id: string
    name: string
  } | null
  inviter: {
    id: string
    full_name: string | null
  } | null
}

interface PendingInvitationsProps {
  refreshTrigger?: number
}

const permissionBadgeStyles: Record<PermissionLevel, string> = {
  admin: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  member: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

export function PendingInvitations({ refreshTrigger }: PendingInvitationsProps) {
  const { context } = useTeamContext()
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadInvitations = async () => {
    if (!supabase || !context) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id,
          email,
          permission_level,
          role_id,
          expires_at,
          created_at,
          role:team_roles (
            id,
            name
          ),
          inviter:users!invited_by (
            id,
            full_name
          )
        `)
        .eq('team_id', context.team.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading invitations:', error)
        return
      }

      setInvitations(data as unknown as InvitationWithDetails[])
    } catch (err) {
      console.error('Error loading invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [context?.team.id, refreshTrigger])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const handleResend = async (invitationId: string) => {
    if (!supabase) return

    setActionLoading(invitationId)
    try {
      // Reset expiration to 7 days from now
      const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase
        .from('team_invitations')
        .update({ expires_at: newExpiration })
        .eq('id', invitationId)

      if (error) {
        console.error('Error resending invitation:', error)
        return
      }

      // Reload invitations
      await loadInvitations()
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (invitationId: string) => {
    if (!supabase) return

    setActionLoading(invitationId)
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)

      if (error) {
        console.error('Error revoking invitation:', error)
        return
      }

      // Reload invitations
      await loadInvitations()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No pending invitations</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Permission</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">{invitation.email}</TableCell>
            <TableCell>
              {invitation.role?.name || (
                <span className="text-muted-foreground">No role</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn('capitalize', permissionBadgeStyles[invitation.permission_level])}
              >
                {invitation.permission_level}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {invitation.inviter?.full_name || 'Unknown'}
            </TableCell>
            <TableCell>
              {isExpired(invitation.expires_at) ? (
                <Badge variant="outline" className="text-destructive border-destructive">
                  Expired
                </Badge>
              ) : (
                <span className="text-muted-foreground">
                  {formatDate(invitation.expires_at)}
                </span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleResend(invitation.id)}
                  disabled={actionLoading === invitation.id}
                  title="Resend invitation"
                >
                  {actionLoading === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRevoke(invitation.id)}
                  disabled={actionLoading === invitation.id}
                  title="Revoke invitation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
